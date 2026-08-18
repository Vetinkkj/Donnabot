import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

/**
 * Área da plataforma (não é o painel de uma loja) — só pra quem tem
 * isPlatformAdmin=true. O middleware já bloqueia isso antes de chegar
 * aqui; esse check é só uma segunda camada de defesa.
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.isPlatformAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">BOTloja — Administração da plataforma</h1>
          <p className="text-xs text-zinc-500">{session.user.email}</p>
        </div>
        <div className="w-24">
          <LogoutButton />
        </div>
      </header>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
