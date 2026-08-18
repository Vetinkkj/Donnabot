"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

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

type Props = {
  appId: string;
  configId: string;
  onConnected: (status: unknown) => void;
};

/**
 * Botão de conexão em um clique via Meta Embedded Signup — o fluxo oficial
 * pra Tech Providers conectarem o WhatsApp de um cliente sem trocar token
 * manualmente. Não testado contra a API de verdade (exige aprovação como
 * Tech Provider e um config_id reais, que este projeto ainda não tem) —
 * trate como ponto de partida estruturalmente correto a validar depois.
 * Docs: developers.facebook.com/docs/whatsapp/embedded-signup
 */
export function MetaEmbeddedSignupButton({ appId, configId, onConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const capturedRef = useRef<{ phoneNumberId?: string; wabaId?: string }>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP" && data.event === "FINISH") {
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
    if (window.FB) return;
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: true, version: "v20.0" });
    };
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/pt_BR/sdk.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [appId]);

  function handleClick() {
    if (!window.FB) {
      setError("SDK da Meta ainda não carregou, tente novamente em alguns segundos.");
      return;
    }
    setError(undefined);
    setLoading(true);
    capturedRef.current = {};

    window.FB.login(
      async (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setError("Conexão cancelada ou sem permissão concedida.");
          setLoading(false);
          return;
        }
        try {
          const res = await fetch("/api/admin/integrations/whatsapp/embedded-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
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
      },
      {
        config_id: configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
      }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" onClick={handleClick} disabled={loading}>
        {loading ? "Conectando..." : "Conectar com um clique (Meta)"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
