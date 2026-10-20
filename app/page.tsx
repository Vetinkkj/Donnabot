import type { Metadata } from "next";
import { Demo } from "@/components/landing/demo";
import { Hero, Nav } from "@/components/landing/hero";
import { PlansAndSignup } from "@/components/landing/plans";
import { RevealOnScroll } from "@/components/landing/primitives";
import { Benefits, FAQ, FinalCTA, Footer, HowItWorks, Trust } from "@/components/landing/sections";
import { PRICING } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: "Donnabot — Atendimento e vendas pelo WhatsApp",
  description: `A Donna atende seus clientes no WhatsApp, apresenta capinhas, carregadores e acessórios e ajuda sua loja a vender. ${PRICING.refundDays} dias de garantia com reembolso.`,
  openGraph: {
    title: "Donnabot — Seu novo vendedor no WhatsApp",
    description: `Automatize o atendimento da sua loja pelo WhatsApp. Teste por ${PRICING.refundDays} dias com reembolso garantido.`,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/** Página inicial (design feito no Lovable). O tema fica isolado em `.landing` (app/globals.css). */
export default async function HomePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="landing">
      <RevealOnScroll />
      <Nav />
      <main>
        <Hero />
        <Demo />
        <Benefits />
        <HowItWorks />
        <Trust />
        <PlansAndSignup error={erro} />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
