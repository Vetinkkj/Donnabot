"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { MetaEmbeddedSignupButton } from "@/components/admin/MetaEmbeddedSignupButton";

export type WhatsAppIntegrationStatus = {
  whatsappProvider: string | null;
  metaConfigured: boolean;
  whatsappPhoneNumberId: string | null;
  twilioConfigured: boolean;
  twilioWhatsappNumber: string | null;
};

type Provider = "meta" | "twilio";

const EMPTY_META = { token: "", phoneNumberId: "", businessAccountId: "", appSecret: "" };
const EMPTY_TWILIO = { accountSid: "", authToken: "", whatsappNumber: "" };

type EmbeddedSignupConfig = { appId: string; configId: string };

export function WhatsAppIntegrationForm({
  initialStatus,
  embeddedSignup,
}: {
  initialStatus: WhatsAppIntegrationStatus;
  embeddedSignup?: EmbeddedSignupConfig;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [provider, setProvider] = useState<Provider>(
    status.whatsappProvider === "twilio" ? "twilio" : "meta"
  );
  const [meta, setMeta] = useState(EMPTY_META);
  const [twilio, setTwilio] = useState(EMPTY_TWILIO);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [removedAt, setRemovedAt] = useState<Date | null>(null);

  const isConfigured = status.metaConfigured || status.twilioConfigured;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setFieldErrors(undefined);
    setSavedAt(null);
    setRemovedAt(null);
    try {
      const body = provider === "meta" ? { provider: "meta", ...meta } : { provider: "twilio", ...twilio };
      const res = await fetch("/api/admin/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar");
        if (json.issues) {
          setFieldErrors(Object.fromEntries(Object.entries(json.issues).map(([k, v]) => [k, (v as string[])[0]])));
        }
        return;
      }
      setStatus(json.data);
      setMeta(EMPTY_META);
      setTwilio(EMPTY_TWILIO);
      setSavedAt(new Date());
    } catch {
      setError("Erro de conexão ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    setError(undefined);
    setSavedAt(null);
    setRemovedAt(null);
    try {
      const res = await fetch("/api/admin/integrations/whatsapp", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao remover integração");
        return;
      }
      setStatus(json.data);
      setRemovedAt(new Date());
    } catch {
      setError("Erro de conexão ao remover");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">WhatsApp desta loja</h2>
        {isConfigured ? (
          <Badge tone="success">
            Conectado via {status.whatsappProvider === "meta" ? "Meta Cloud API" : "Twilio"}
          </Badge>
        ) : (
          <Badge tone="neutral">Não conectado (usando padrão do sistema)</Badge>
        )}
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        Cole aqui as credenciais do WhatsApp desta loja para que ela use o próprio número, em vez do número padrão
        configurado no servidor. Os valores ficam criptografados no banco e nunca são exibidos de novo depois de
        salvos.
      </p>

      {embeddedSignup && !isConfigured && (
        <div className="mb-4 flex flex-col gap-2 rounded-md border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
          <p className="text-xs text-zinc-500">
            Conecte o WhatsApp Business da loja em um clique, direto pela Meta (recomendado):
          </p>
          <MetaEmbeddedSignupButton
            appId={embeddedSignup.appId}
            configId={embeddedSignup.configId}
            onConnected={(data) => {
              setStatus(data as WhatsAppIntegrationStatus);
              setSavedAt(new Date());
            }}
          />
          <p className="text-center text-xs text-zinc-400">— ou configure manualmente abaixo —</p>
        </div>
      )}

      {isConfigured && (
        <div className="mb-4 flex flex-col gap-1 rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {status.whatsappProvider === "meta" && status.whatsappPhoneNumberId && (
            <span>Phone Number ID: {status.whatsappPhoneNumberId}</span>
          )}
          {status.whatsappProvider === "twilio" && status.twilioWhatsappNumber && (
            <span>Número: {status.twilioWhatsappNumber}</span>
          )}
          <Button type="button" variant="danger" className="mt-2 w-fit" onClick={handleRemove} disabled={removing}>
            {removing ? "Removendo..." : "Remover integração e voltar ao padrão do sistema"}
          </Button>
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {savedAt && (
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          Integração salva com sucesso.
        </p>
      )}
      {removedAt && (
        <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          Integração removida — voltou a usar o padrão do sistema.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={provider === "meta" ? "primary" : "secondary"}
            onClick={() => setProvider("meta")}
          >
            Meta Cloud API
          </Button>
          <Button
            type="button"
            variant={provider === "twilio" ? "primary" : "secondary"}
            onClick={() => setProvider("twilio")}
          >
            Twilio
          </Button>
        </div>

        {provider === "meta" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Token de acesso permanente"
              type="password"
              value={meta.token}
              onChange={(e) => setMeta((prev) => ({ ...prev, token: e.target.value }))}
              error={fieldErrors?.token}
              className="sm:col-span-2"
            />
            <Input
              label="Phone Number ID"
              value={meta.phoneNumberId}
              onChange={(e) => setMeta((prev) => ({ ...prev, phoneNumberId: e.target.value }))}
              error={fieldErrors?.phoneNumberId}
            />
            <Input
              label="WhatsApp Business Account ID (opcional)"
              value={meta.businessAccountId}
              onChange={(e) => setMeta((prev) => ({ ...prev, businessAccountId: e.target.value }))}
              error={fieldErrors?.businessAccountId}
            />
            <Input
              label="App Secret (opcional, valida assinatura dos webhooks)"
              type="password"
              value={meta.appSecret}
              onChange={(e) => setMeta((prev) => ({ ...prev, appSecret: e.target.value }))}
              error={fieldErrors?.appSecret}
              className="sm:col-span-2"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Account SID"
              value={twilio.accountSid}
              onChange={(e) => setTwilio((prev) => ({ ...prev, accountSid: e.target.value }))}
              error={fieldErrors?.accountSid}
            />
            <Input
              label="Auth Token"
              type="password"
              value={twilio.authToken}
              onChange={(e) => setTwilio((prev) => ({ ...prev, authToken: e.target.value }))}
              error={fieldErrors?.authToken}
            />
            <Input
              label="Número do WhatsApp (ex: +14155238886)"
              value={twilio.whatsappNumber}
              onChange={(e) => setTwilio((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
              error={fieldErrors?.whatsappNumber}
              className="sm:col-span-2"
            />
          </div>
        )}

        <div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar integração"}
          </Button>
        </div>
      </form>
    </section>
  );
}
