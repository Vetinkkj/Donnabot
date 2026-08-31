import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_WHATSAPP, PRICING } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Dúvidas — ${BRAND_NAME}`,
  description: "Perguntas frequentes sobre a Donna e como falar com a gente.",
};

const FAQ = [
  {
    question: "Preciso saber programar ou mexer em código?",
    answer:
      "Não. Você só cadastra sua loja, cola as credenciais do seu WhatsApp Business (ou pede ajuda pra gente) e cadastra seus produtos — a Donna cuida do resto.",
  },
  {
    question: "Funciona no meu WhatsApp normal, do celular?",
    answer:
      'A Donna usa a API oficial de WhatsApp Business (via Meta ou Twilio) — não é o WhatsApp pessoal do dia a dia. Cada loja conecta o próprio número dedicado ao atendimento.',
  },
  {
    question: "Quanto custa?",
    answer: `R$ ${PRICING.monthly},00 por mês ou R$ ${PRICING.yearly.toLocaleString("pt-BR")},00 por ano (economia de 2 meses) — com ${
      PRICING.trialDays
    } dias grátis pra testar antes de decidir.`,
  },
  {
    question: "Como funciona o pagamento?",
    answer:
      "Depois que você cadastra a loja, é só falar com a gente (WhatsApp ou e-mail) pra ativar o plano. Sem fidelidade — cancele quando quiser.",
  },
  {
    question: "Meus dados e os dos meus clientes ficam seguros?",
    answer:
      "Sim. As credenciais de WhatsApp e pagamento de cada loja ficam criptografadas no banco, nunca em texto puro, e nunca são compartilhadas com outras lojas.",
  },
  {
    question: "Quanto tempo leva pra minha loja ficar no ar?",
    answer: "Normalmente no mesmo dia em que confirmamos o pagamento — o cadastro é liberado manualmente pela nossa equipe.",
  },
];

export default function DuvidasPage() {
  const whatsappHref = CONTACT_WHATSAPP
    ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent("Oi! Quero saber mais sobre a Donna.")}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <MarketingNav />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
          <h1 className="mb-2 text-center text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Dúvidas frequentes
          </h1>
          <p className="mb-10 text-center text-zinc-600 dark:text-zinc-400">
            Não achou o que precisava? Fala com a gente ali embaixo.
          </p>

          <div className="flex flex-col gap-3">
            {FAQ.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-zinc-200 bg-white p-4 open:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-zinc-900 dark:text-zinc-50">
                  {item.question}
                  <span className="shrink-0 text-zinc-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-100 bg-zinc-50 py-16 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 text-center md:px-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Ainda com dúvida?</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Fale direto com a gente — respondemos rapidinho.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1ebc59]"
                >
                  💬 Chamar no WhatsApp
                </a>
              )}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                ✉️ {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
