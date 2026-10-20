"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { META_GRAPH_VERSION } from "@/lib/meta";

declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        params: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

/**
 * - new_number: número que ainda não está em nenhum WhatsApp (chip novo) —
 *   vai ser registrado na Cloud API.
 * - business_app: Coexistência — a loja continua usando o número no app
 *   WhatsApp Business no celular e a Donna atende pela API ao mesmo tempo.
 */
export type EmbeddedSignupMode = "new_number" | "business_app";

type Props = {
  appId: string;
  configId: string;
  mode: EmbeddedSignupMode;
  label: string;
  onConnected: (status: unknown) => void;
};

// Eventos de fim do popup da Meta: FINISH (número novo) e
// FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING (Coexistência — não traz phone_number_id,
// o servidor busca pelo WABA).
const FINISH_EVENTS = new Set(["FINISH", "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"]);

/**
 * Botão de conexão em um clique via Meta Embedded Signup — o fluxo oficial
 * pra Tech Providers conectarem o WhatsApp de um cliente sem trocar token
 * manualmente. Docs: developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup
 */
export function MetaEmbeddedSignupButton({ appId, configId, mode, label, onConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const capturedRef = useRef<{ phoneNumberId?: string; wabaId?: string }>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP" && FINISH_EVENTS.has(data.event)) {
          capturedRef.current = {
            phoneNumberId: data.data?.phone_number_id,
            wabaId: data.data?.waba_id,
          };
        }
      } catch {
        // mensagens que não são JSON do fluxo de signup — ignora
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (window.FB || document.getElementById("facebook-jssdk")) return;
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: true, version: META_GRAPH_VERSION });
    };
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [appId]);

  async function finishSignup(code: string) {
    // O evento FINISH (postMessage) às vezes chega um instante depois do
    // callback do FB.login — espera um pouco por ele antes de desistir do wabaId.
    for (let attempt = 0; attempt < 10 && !capturedRef.current.wabaId; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    try {
      const res = await fetch("/api/admin/integrations/whatsapp/embedded-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          mode,
          phoneNumberId: capturedRef.current.phoneNumberId,
          wabaId: capturedRef.current.wabaId,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao concluir a conexão");
        return;
      }
      onConnected(json.data);
    } catch {
      setError("Erro de conexão ao concluir o cadastro");
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (!window.FB) {
      setError("SDK da Meta ainda não carregou, tente novamente em alguns segundos.");
      return;
    }
    setError(undefined);
    setLoading(true);
    capturedRef.current = {};

    window.FB.login(
      // Precisa ser uma função comum: o SDK da Meta recusa callback `async`
      // ("Expression is of type asyncfunction, not function") e nunca o chama.
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setError("Conexão cancelada ou sem permissão concedida.");
          setLoading(false);
          return;
        }
        void finishSignup(code);
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: mode === "business_app" ? "whatsapp_business_app_onboarding" : "",
          sessionInfoVersion: "3",
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" onClick={handleClick} disabled={loading}>
        {loading ? "Conectando..." : label}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
