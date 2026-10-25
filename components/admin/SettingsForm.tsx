"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { Bot, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { StatusMessage } from "@/components/admin/page-ui";

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

type Values = Record<
  "name" | "botName" | "phone" | "address" | "logoUrl" | "welcomeMessage" | "paymentMessage" | "orderApprovedMessage" | "defaultMinStock",
  string
>;

function toValues(data: StoreSettings): Values {
  return {
    name: data.name,
    botName: data.botName,
    phone: data.phone ?? "",
    address: data.address ?? "",
    logoUrl: data.logoUrl ?? "",
    welcomeMessage: data.welcomeMessage,
    paymentMessage: data.paymentMessage,
    orderApprovedMessage: data.orderApprovedMessage,
    defaultMinStock: String(data.defaultMinStock),
  };
}

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-zinc-900/50">
      <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <h2 className="text-[15px] font-semibold text-zinc-50">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

/**
 * Dados da loja + mensagens da Donna. É um formulário só no servidor (a API
 * salva tudo junto), mas aparece em duas abas: `part` escolhe quais campos
 * mostrar. O estado fica no componente pai (SettingsView) para as duas abas
 * compartilharem as mesmas alterações pendentes.
 */
export function StoreSettingsFields({
  part,
  values,
  update,
  fieldErrors,
}: {
  part: "store" | "donna";
  values: Values;
  update: (key: keyof Values, value: string) => void;
  fieldErrors?: Record<string, string>;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  if (part === "store") {
    const showLogo = /^https?:\/\/\S+$/.test(values.logoUrl.trim()) && !logoFailed;
    return (
      <>
        <SettingsSection title="Perfil da loja" description="Como a sua loja se apresenta. O nome aparece no painel e nas mensagens.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Nome da loja" value={values.name} onChange={(e) => update("name", e.target.value)} error={fieldErrors?.name} required />
            <Input label="Telefone de contato" value={values.phone} onChange={(e) => update("phone", e.target.value)} error={fieldErrors?.phone} placeholder="(00) 00000-0000" />
          </div>
          <Input label="Endereço" value={values.address} onChange={(e) => update("address", e.target.value)} error={fieldErrors?.address} placeholder="Rua, número, bairro, cidade" />
          <div className="flex items-end gap-4">
            <span className="grid size-[42px] shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-600">
              {showLogo ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitrária definida pelo lojista
                <img src={values.logoUrl.trim()} alt="Prévia do logo" className="size-full object-contain" onError={() => setLogoFailed(true)} />
              ) : (
                <Store className="size-4" aria-hidden />
              )}
            </span>
            <Input
              label="Logo (URL da imagem)"
              type="url"
              value={values.logoUrl}
              onChange={(e) => {
                setLogoFailed(false);
                update("logoUrl", e.target.value);
              }}
              error={fieldErrors?.logoUrl ?? (logoFailed ? "Não foi possível carregar essa imagem." : undefined)}
              placeholder="https://…"
              className="flex-1"
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Padrões do catálogo" description="Usado quando você cadastra um produto novo.">
          <Input
            label="Estoque mínimo padrão"
            type="number"
            inputMode="numeric"
            min="0"
            value={values.defaultMinStock}
            onChange={(e) => update("defaultMinStock", e.target.value)}
            error={fieldErrors?.defaultMinStock}
            hint="Produtos com essa quantidade ou menos aparecem como “estoque baixo”."
            className="sm:max-w-xs"
          />
        </SettingsSection>
      </>
    );
  }

  return (
    <>
      <SettingsSection title="Assistente" description="Como a Donna se apresenta para os seus clientes no WhatsApp.">
        <Input
          label="Nome da assistente"
          value={values.botName}
          onChange={(e) => update("botName", e.target.value)}
          error={fieldErrors?.botName}
          hint="Ex.: “Oi! Aqui é a Donna 👋”."
          className="sm:max-w-sm"
          required
        />
      </SettingsSection>

      <SettingsSection title="Mensagens automáticas" description="Textos que a Donna envia em momentos-chave do atendimento.">
        <Textarea
          label="Boas-vindas"
          value={values.welcomeMessage}
          onChange={(e) => update("welcomeMessage", e.target.value)}
          error={fieldErrors?.welcomeMessage}
          hint="Enviada quando o cliente manda a primeira mensagem."
          rows={2}
          required
        />
        <Textarea
          label="Pagamento"
          value={values.paymentMessage}
          onChange={(e) => update("paymentMessage", e.target.value)}
          error={fieldErrors?.paymentMessage}
          hint="Cabeçalho da mensagem com as instruções de pagamento."
          rows={2}
          required
        />
        <Textarea
          label="Pedido aprovado"
          value={values.orderApprovedMessage}
          onChange={(e) => update("orderApprovedMessage", e.target.value)}
          error={fieldErrors?.orderApprovedMessage}
          hint="Enviada quando você marca o pedido como pago."
          rows={2}
          required
        />
      </SettingsSection>

      <SettingsSection title="Quando um atendente assume">
        <div className="flex gap-3 rounded-xl bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-zinc-400">
          <Bot className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
          <p>
            Ao assumir uma conversa (ou responder pelo WhatsApp Business no celular), a Donna pausa naquela conversa. Se
            ninguém da loja responder em <span className="text-zinc-200">2 horas</span>, ela volta a atender quando o
            cliente escrever de novo. Esse comportamento é fixo.
          </p>
        </div>
      </SettingsSection>
    </>
  );
}

/** Estado + salvamento do formulário da loja, compartilhado entre as abas Loja e Donna. */
export function useStoreSettingsForm(initialData: StoreSettings) {
  const [saved, setSaved] = useState<Values>(() => toValues(initialData));
  const [values, setValues] = useState<Values>(saved);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  // Aviso do navegador ao sair com alterações não salvas.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setSavedAt(null), 4000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  function update(key: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function discard() {
    setValues(saved);
    setError(undefined);
    setFieldErrors(undefined);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setFieldErrors(undefined);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Não foi possível salvar");
        if (json.issues) {
          setFieldErrors(Object.fromEntries(Object.entries(json.issues).map(([k, v]) => [k, (v as string[])[0]])));
        }
        return;
      }
      setSaved(values);
      setSavedAt(new Date());
    } catch {
      setError("Erro de conexão ao salvar. Suas alterações continuam aqui.");
    } finally {
      setSubmitting(false);
    }
  }

  return { values, update, dirty, discard, submit, submitting, error, fieldErrors, savedAt };
}

/** Barra fixa no rodapé enquanto há alterações pendentes. */
export function UnsavedBar({
  dirty,
  submitting,
  onDiscard,
  onSave,
}: {
  dirty: boolean;
  submitting: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  if (!dirty) return null;
  return (
    <div className="dash-enter sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur">
      <span className="flex items-center gap-2 text-sm text-zinc-300">
        <span className="size-2 rounded-full bg-amber-400" aria-hidden />
        Alterações não salvas
      </span>
      <span className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={submitting}>
          Descartar
        </Button>
        <Button size="sm" onClick={onSave} loading={submitting}>
          Salvar
        </Button>
      </span>
    </div>
  );
}

export function SaveFeedback({ error, savedAt }: { error?: string; savedAt: Date | null }) {
  if (error) return <StatusMessage tone="error">{error}</StatusMessage>;
  if (savedAt) return <StatusMessage tone="success">Configurações salvas.</StatusMessage>;
  return null;
}
