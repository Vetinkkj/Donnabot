import type { ReactNode } from "react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LEGAL_UPDATED_AT } from "@/lib/marketing-config";

/** Moldura comum das páginas legais (Termos, Privacidade, Exclusão de dados). */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <MarketingNav />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-20">
          <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <p className="mb-10 text-sm text-zinc-500 dark:text-zinc-400">Última atualização: {LEGAL_UPDATED_AT}</p>

          <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {children}
    </section>
  );
}
