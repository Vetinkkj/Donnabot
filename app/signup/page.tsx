import type { Metadata } from "next";
import { Nav } from "@/components/landing/hero";
import { PlansAndSignup } from "@/components/landing/plans";
import { Eyebrow, RevealOnScroll } from "@/components/landing/primitives";
import { Footer, HowItWorks } from "@/components/landing/sections";
import { BRAND_NAME, PRICING } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Cadastre sua loja — ${BRAND_NAME}`,
  description: "Crie sua conta e coloque a Donna pra atender sua loja no WhatsApp.",
};

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <div className="landing">
      <RevealOnScroll />
      <Nav />
      <main>
        <section className="relative overflow-hidden pb-4 pt-32 text-center sm:pt-40">
          <div className="grid-bg pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-glow blur-3xl" />
          <div className="reveal relative mx-auto max-w-3xl px-5 sm:px-8">
            <Eyebrow>{PRICING.trialDays} dias grátis para testar</Eyebrow>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              Coloque a Donna para <span className="text-gradient">atender sua loja.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Escolha o plano, crie sua conta e nossa equipe ajuda a conectar o WhatsApp e cadastrar seus produtos.
            </p>
          </div>
        </section>
        <PlansAndSignup error={params.error} origin="signup" />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
