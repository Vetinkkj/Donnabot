"use client";

import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Bot, KeyRound, MessageCircle, Server, Store } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/admin/page-ui";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { WhatsAppIntegrationForm } from "@/components/admin/WhatsAppIntegrationForm";
import {
  SaveFeedback,
  SettingsSection,
  StoreSettingsFields,
  UnsavedBar,
  useStoreSettingsForm,
  type StoreSettings,
} from "@/components/admin/SettingsForm";

type Tab = "loja" | "donna" | "whatsapp" | "conta" | "plataforma";

type WhatsAppProps = Parameters<typeof WhatsAppIntegrationForm>[0];

const TABS: { id: Tab; label: string; description: string; icon: typeof Store; adminOnly?: boolean }[] = [
  { id: "loja", label: "Loja", description: "Perfil e padrões do catálogo", icon: Store },
  { id: "donna", label: "Donna", description: "Assistente e mensagens", icon: Bot },
  { id: "whatsapp", label: "WhatsApp", description: "Conexão do número", icon: MessageCircle },
  { id: "conta", label: "Conta", description: "Acesso e senha", icon: KeyRound },
  { id: "plataforma", label: "Plataforma", description: "Padrões do servidor", icon: Server, adminOnly: true },
];

export function SettingsView({
  storeSettings,
  whatsapp,
  userEmail,
  platform,
}: {
  storeSettings: StoreSettings;
  whatsapp: WhatsAppProps;
  userEmail: string | null;
  /** Só para isPlatformAdmin: provedores ativos no servidor (nunca chaves). */
  platform: { whatsapp: string | null; payment: string | null; ai: string | null } | null;
}) {
  const searchParams = useSearchParams();
  const tabs = TABS.filter((t) => !t.adminOnly || platform);
  const [tab, setTab] = useState<Tab>(() => {
    const fromUrl = searchParams.get("aba") as Tab | null;
    return fromUrl && tabs.some((t) => t.id === fromUrl) ? fromUrl : "loja";
  });
  const form = useStoreSettingsForm(storeSettings);

  function selectTab(next: Tab) {
    setTab(next);
    // Mantém a aba no endereço (dá para compartilhar o link), sem recarregar a página.
    const url = new URL(window.location.href);
    url.searchParams.set("aba", next);
    window.history.replaceState(null, "", url);
  }

  const current = tabs.find((t) => t.id === tab) ?? tabs[0];
  let content: ReactNode = null;

  if (tab === "loja" || tab === "donna") {
    content = (
      <form onSubmit={form.submit} className="flex flex-col gap-5" noValidate>
        <SaveFeedback error={form.error} savedAt={form.savedAt} />
        <StoreSettingsFields part={tab === "loja" ? "store" : "donna"} values={form.values} update={form.update} fieldErrors={form.fieldErrors} />
      </form>
    );
  } else if (tab === "whatsapp") {
    content = (
      <SettingsSection title="WhatsApp" description="O número em que a Donna atende os seus clientes.">
        <WhatsAppIntegrationForm {...whatsapp} />
      </SettingsSection>
    );
  } else if (tab === "conta") {
    content = (
      <>
        <SettingsSection title="Acesso" description="Conta usada para entrar no painel.">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-zinc-500">E-mail de login</span>
            <span className="truncate text-zinc-100">{userEmail ?? "—"}</span>
          </div>
        </SettingsSection>
        <SettingsSection title="Senha" description="Depois de trocar, use a nova senha no próximo login.">
          <ChangePasswordForm />
        </SettingsSection>
      </>
    );
  } else if (tab === "plataforma" && platform) {
    const rows: [string, string, string | null, string][] = [
      ["WhatsApp padrão", "WHATSAPP_PROVIDER", platform.whatsapp, "meta"],
      ["Pagamento", "PAYMENT_PROVIDER", platform.payment, "mercadopago"],
      ["Inteligência artificial", "AI_PROVIDER", platform.ai, "openai"],
    ];
    content = (
      <SettingsSection
        title="Padrão do sistema (todas as lojas)"
        description="Definidos por variáveis de ambiente na Vercel — de propósito sem campo aqui, para nenhuma chave de API ficar no banco. Valem só para lojas sem integração própria."
      >
        <dl className="flex flex-col divide-y divide-white/[0.05]">
          {rows.map(([label, env, value, real]) => (
            <div key={env} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <dt>
                <span className="block text-sm text-zinc-200">{label}</span>
                <code className="text-xs text-zinc-500">{env}</code>
              </dt>
              <dd>
                <Badge tone={value === real ? "success" : "neutral"}>{value === real ? value : "mock (padrão)"}</Badge>
              </dd>
            </div>
          ))}
        </dl>
      </SettingsSection>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <PageHeader title="Configurações" description="Ajustes da loja, da Donna e da sua conta." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        <nav aria-label="Categorias de configuração" className="lg:sticky lg:top-8 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = item.id === tab;
              const pending = form.dirty && (item.id === "loja" || item.id === "donna");
              return (
                <li key={item.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => selectTab(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500",
                      active ? "bg-white/[0.07] text-zinc-50" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-emerald-400" : "text-zinc-500")} aria-hidden />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {item.label}
                        {pending && <span className="size-1.5 rounded-full bg-amber-400" aria-label="alterações não salvas" />}
                      </span>
                      <span className="hidden text-xs text-zinc-500 lg:block">{item.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div key={current.id} className="dash-enter flex min-w-0 flex-col gap-5">
          {content}
          <UnsavedBar dirty={form.dirty} submitting={form.submitting} onDiscard={form.discard} onSave={() => form.submit()} />
        </div>
      </div>
    </div>
  );
}
