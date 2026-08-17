"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

export type StoreSettings = {
  name: string;
  botName: string;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  welcomeMessage: string;
  paymentMessage: string;
  orderApprovedMessage: string;
  defaultMinStock: number;
};

export function SettingsForm({ initialData }: { initialData: StoreSettings }) {
  const [values, setValues] = useState({
    name: initialData.name,
    botName: initialData.botName,
    phone: initialData.phone ?? "",
    address: initialData.address ?? "",
    logoUrl: initialData.logoUrl ?? "",
    welcomeMessage: initialData.welcomeMessage,
    paymentMessage: initialData.paymentMessage,
    orderApprovedMessage: initialData.orderApprovedMessage,
    defaultMinStock: String(initialData.defaultMinStock),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setFieldErrors(undefined);
    setSavedAt(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar");
        if (json.issues) {
          setFieldErrors(Object.fromEntries(Object.entries(json.issues).map(([k, v]) => [k, (v as string[])[0]])));
        }
        return;
      }
      setSavedAt(new Date());
    } catch {
      setError("Erro de conexão ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      {savedAt && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          Configurações salvas com sucesso.
        </p>
      )}

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Dados da loja</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nome da loja"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            error={fieldErrors?.name}
          />
          <Input
            label="Nome do bot"
            value={values.botName}
            onChange={(e) => update("botName", e.target.value)}
            error={fieldErrors?.botName}
          />
          <Input
            label="Telefone"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            error={fieldErrors?.phone}
          />
          <Input
            label="Estoque mínimo padrão"
            type="number"
            min="0"
            value={values.defaultMinStock}
            onChange={(e) => update("defaultMinStock", e.target.value)}
            error={fieldErrors?.defaultMinStock}
          />
          <Input
            label="Endereço"
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
            error={fieldErrors?.address}
            className="sm:col-span-2"
          />
          <Input
            label="URL do logo"
            value={values.logoUrl}
            onChange={(e) => update("logoUrl", e.target.value)}
            error={fieldErrors?.logoUrl}
            placeholder="https://..."
            className="sm:col-span-2"
          />
          {values.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitrária definida pelo lojista
            <img src={values.logoUrl} alt="Prévia do logo" className="h-16 w-16 rounded-md border border-zinc-200 object-contain dark:border-zinc-800" />
          )}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Mensagens do bot</h2>
        <div className="flex flex-col gap-4">
          <Textarea
            label="Mensagem inicial (quando o cliente manda a primeira mensagem)"
            value={values.welcomeMessage}
            onChange={(e) => update("welcomeMessage", e.target.value)}
            error={fieldErrors?.welcomeMessage}
            rows={2}
          />
          <Textarea
            label="Mensagem de pagamento (cabeçalho do PIX)"
            value={values.paymentMessage}
            onChange={(e) => update("paymentMessage", e.target.value)}
            error={fieldErrors?.paymentMessage}
            rows={2}
          />
          <Textarea
            label="Mensagem de pedido aprovado"
            value={values.orderApprovedMessage}
            onChange={(e) => update("orderApprovedMessage", e.target.value)}
            error={fieldErrors?.orderApprovedMessage}
            rows={2}
          />
        </div>
      </section>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}
