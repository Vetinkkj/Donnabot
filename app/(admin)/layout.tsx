import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Image from "next/image";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStoreOperational } from "@/services/store";
import { Sidebar } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { WaitingCustomerAlert } from "@/components/admin/WaitingCustomerAlert";
import { SubscribeForm } from "@/components/admin/SubscribeForm";
import { isAsaasConfigured } from "@/lib/asaas";
import { getFounderSpotsLeft } from "@/services/billing";
import { SIDEBAR_COOKIE } from "@/lib/ui-prefs";

/** Tema do painel: sempre escuro (classe .dark), fonte Geist e controles nativos escuros. */
const SHELL = "dark min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased [color-scheme:dark]";
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/marketing-config";

const STATUS_MESSAGE: Record<string, string> = {
  PENDING:
    "Seu cadastro foi recebido! Fale com a gente pra ativar seu plano — assim que confirmarmos, o painel e a Donna são liberados automaticamente.",
  SUSPENDED: `O acesso desta loja foi suspenso. Fale com o suporte da ${BRAND_NAME} pra regularizar.`,
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // isPlatformAdmin nunca é bloqueado pelo status da própria loja — é quem
  // aprova/suspende as outras.
  if (session?.user?.storeId && !session.user.isPlatformAdmin) {
    const store = await db.store.findUnique({
      where: { id: session.user.storeId },
      select: { name: true, status: true, subscriptionExpiresAt: true, intendedPlan: true, asaasSubscriptionId: true },
    });

    if (store && !isStoreOperational(store)) {
      const expired = store.status === "ACTIVE";
      // Pendente ou vencida paga sozinha pelo Asaas; suspensa só com você.
      const canSubscribe = store.status !== "SUSPENDED" && isAsaasConfigured();
      const message = canSubscribe
        ? expired
          ? "A assinatura desta loja venceu. Renove para liberar o painel e a Donna de novo."
          : "Seu cadastro foi recebido! Escolha o plano e faça o pagamento: o painel e a Donna são liberados assim que ele for confirmado."
        : expired
        ? `A validade da assinatura desta loja venceu. Fale com o suporte da ${BRAND_NAME} pra renovar.`
        : (STATUS_MESSAGE[store.status] ?? "O acesso desta loja está bloqueado no momento.");
      const whatsappHref = CONTACT_WHATSAPP
        ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(`Oi! Quero ativar o plano da loja "${store.name}".`)}`
        : null;

      if (canSubscribe) {
        // Checkout da assinatura em página própria (largo, com resumo ao lado).
        return (
          <div className={`${SHELL} flex flex-col`}>
            <header className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-8">
              <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-zinc-50">
                <span className="relative block size-8 overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
                  <Image src="/logo-icon.png" alt="" fill sizes="32px" className="object-cover" />
                </span>
                {BRAND_NAME}
              </span>
              <div className="w-28">
                <LogoutButton />
              </div>
            </header>
            <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-12">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                  {expired ? "Renove sua assinatura" : "Ative sua loja"}
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm text-zinc-400">{message}</p>
              </div>
              <SubscribeForm
                defaultPlan={store.intendedPlan === "yearly" || store.intendedPlan === "founder" ? store.intendedPlan : "monthly"}
                storeName={store.name}
                founderAvailable={(store.intendedPlan === "founder" && store.asaasSubscriptionId !== null) || (await getFounderSpotsLeft()) > 0}
              />
              <p className="text-xs text-zinc-500">
                Dúvidas? Escreva para{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-zinc-300 underline-offset-2 hover:underline">
                  {CONTACT_EMAIL}
                </a>
                {whatsappHref && (
                  <>
                    {" "}ou{" "}
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline-offset-2 hover:underline">
                      fale no WhatsApp
                    </a>
                  </>
                )}
                .
              </p>
            </main>
          </div>
        );
      }

      return (
        <div className={`${SHELL} flex items-center justify-center p-4`}>
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{store.name}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
            <div className="flex flex-col gap-2">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-[#25D366] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1ebc59]"
                >
                  💬 Falar no WhatsApp
                </a>
              )}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                ✉️ {CONTACT_EMAIL}
              </a>
            </div>
            <LogoutButton />
          </div>
        </div>
      );
    }
  }

  const sidebarCollapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <div className={`${SHELL} flex flex-col md:flex-row`}>
      <Sidebar
        userLabel={session?.user?.name ?? session?.user?.email}
        footer={<LogoutButton />}
        isPlatformAdmin={session?.user?.isPlatformAdmin}
        initialCollapsed={sidebarCollapsed}
      />
      <main className="min-w-0 flex-1 overflow-x-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
      <WaitingCustomerAlert />
    </div>
  );
}
