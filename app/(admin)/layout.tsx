import type { ReactNode } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStoreOperational } from "@/services/store";
import { Sidebar } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";
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
      select: { name: true, status: true, subscriptionExpiresAt: true },
    });

    if (store && !isStoreOperational(store)) {
      const expired = store.status === "ACTIVE";
      const message = expired
        ? `A validade da assinatura desta loja venceu. Fale com o suporte da ${BRAND_NAME} pra renovar.`
        : (STATUS_MESSAGE[store.status] ?? "O acesso desta loja está bloqueado no momento.");
      const whatsappHref = CONTACT_WHATSAPP
        ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(`Oi! Quero ativar o plano da loja "${store.name}".`)}`
        : null;

      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-black">
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

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        userLabel={session?.user?.name ?? session?.user?.email}
        footer={<LogoutButton />}
        isPlatformAdmin={session?.user?.isPlatformAdmin}
      />
      <main className="flex-1 overflow-x-auto bg-zinc-50 p-4 dark:bg-black md:p-8">{children}</main>
    </div>
  );
}
