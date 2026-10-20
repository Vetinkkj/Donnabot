import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { Nav } from "@/components/landing/hero";
import { CTA, RevealOnScroll } from "@/components/landing/primitives";
import { FAQ, FinalCTA, Footer } from "@/components/landing/sections";
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_WHATSAPP } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Dúvidas — ${BRAND_NAME}`,
  description: "Perguntas frequentes sobre a Donna e como falar com a gente.",
};

export default function DuvidasPage() {
  const whatsappHref = CONTACT_WHATSAPP
    ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent("Oi! Quero saber mais sobre a Donna.")}`
    : null;

  return (
    <div className="landing">
      <RevealOnScroll />
      <Nav />
      <main className="pt-16">
        <FAQ all />

        <section className="px-5 pb-24 sm:px-8">
          <div className="reveal mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-border bg-card/40 px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ainda com dúvida?</h2>
            <p className="text-muted-foreground">Fale direto com a gente, respondemos rapidinho.</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              {whatsappHref && (
                <CTA href={whatsappHref}>
                  <MessageCircle className="size-4" /> Chamar no WhatsApp
                </CTA>
              )}
              <CTA href={`mailto:${CONTACT_EMAIL}`} variant="ghost">
                <Mail className="size-4" /> {CONTACT_EMAIL}
              </CTA>
            </div>
          </div>
        </section>

        <FinalCTA href="/signup" />
      </main>
      <Footer />
    </div>
  );
}
