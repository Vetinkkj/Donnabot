import type { ReactNode } from "react";
import { Nav } from "@/components/landing/hero";
import { Footer } from "@/components/landing/sections";
import { LEGAL_UPDATED_AT } from "@/lib/marketing-config";

/** Moldura comum das páginas legais (Termos, Privacidade, Exclusão de dados), no tema da página inicial. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="landing">
      <Nav />
      <main>
        <section className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mb-12 mt-3 font-mono text-xs uppercase tracking-[0.14em] text-primary">
            Última atualização: {LEGAL_UPDATED_AT}
          </p>

          <div className="flex flex-col gap-10 text-[15px] leading-relaxed text-muted-foreground [&_a]:text-foreground [&_strong]:text-foreground">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}
