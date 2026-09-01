import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { WhatsAppDemo } from "@/components/marketing/WhatsAppDemo";
import { ChatExampleCard } from "@/components/marketing/ChatExampleCard";
import { PRICING } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: "Donnabot — Atendimento automático via WhatsApp pra loja de peças",
  description:
    "A Donna atende seus clientes no WhatsApp, consulta estoque, fecha o pedido e recebe o pagamento via PIX — sozinha, o dia inteiro.",
};

const FEATURES = [
  {
    emoji: "📦",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    title: "Consulta de estoque na hora",
    description:
      "O cliente pergunta se tem a peça, a Donna responde na hora com preço e quantidade disponível — sem seu time precisar digitar nada.",
  },
  {
    emoji: "🛒",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    title: "Carrinho e fechamento de pedido",
    description:
      "A Donna monta o carrinho, calcula o total e fecha o pedido direto na conversa, do jeito que o cliente já está acostumado a comprar.",
  },
  {
    emoji: "💳",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    title: "Pagamento PIX automático",
    description:
      "Gera o QR Code, confirma o pagamento e dá baixa no estoque sozinha — você só recebe a notificação de venda.",
  },
  {
    emoji: "🙋",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    title: "Atendimento humano quando precisa",
    description:
      "Se o cliente pedir pra falar com alguém, a conversa cai direto na fila do seu time no painel — a Donna nunca deixa ninguém sem resposta.",
  },
];

const EXAMPLES = [
  {
    title: "Exemplo: consulta de estoque",
    messages: [
      { from: "customer" as const, text: "Oi, tem bateria de iPhone XR?" },
      {
        from: "donna" as const,
        text: "Sim! Temos disponível:\n🔋 Bateria iPhone XR\n💰 R$ 180,00\n📦 Estoque: 6 unidades\nDeseja comprar?",
      },
    ],
  },
  {
    title: "Exemplo: fechamento de pedido",
    messages: [
      { from: "customer" as const, text: "finalizar" },
      {
        from: "donna" as const,
        text: "Perfeito! Seu pedido ficou:\n📱 Tela iPhone 13 — Quantidade: 1\n💰 Total: R$ 420,00\nDeseja prosseguir para o pagamento?",
      },
      { from: "customer" as const, text: "sim" },
      {
        from: "donna" as const,
        text: "💳 Pagamento via PIX\n💰 Valor: R$ 420,00\nQR Code enviado — é só escanear e pagar 📲",
      },
    ],
  },
  {
    title: "Exemplo: atendimento humano",
    messages: [
      { from: "customer" as const, text: "Quero falar com um atendente" },
      { from: "donna" as const, text: "Combinado! Vou te transferir para um atendente humano, só um instante 🙋‍♀️" },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#25D366]/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-[#075E54]/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
            <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
              <span className="rounded-full bg-[#25D366]/10 px-3 py-1 text-xs font-medium text-[#0f7a3d] dark:bg-[#25D366]/15 dark:text-[#25D366]">
                🤖 Atendimento automático via WhatsApp
              </span>
              <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
                Sua loja de peças de celular,{" "}
                <span className="bg-gradient-to-r from-[#075E54] to-[#25D366] bg-clip-text text-transparent">
                  atendida 24h pela Donna
                </span>
              </h1>
              <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400 md:text-lg">
                A Donna responde clientes no seu WhatsApp, consulta estoque, monta o carrinho e recebe o pagamento
                via PIX — sozinha, o dia inteiro.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="rounded-full bg-[#075E54] px-6 py-3 text-sm font-medium text-white shadow-lg shadow-[#075E54]/20 transition-transform hover:scale-105 hover:bg-[#0b6e5f]"
                >
                  Criar minha loja
                </Link>
                <a
                  href="#como-funciona"
                  className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Ver como funciona
                </a>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                ✅ {PRICING.trialDays} dias grátis · ✅ sem fidelidade · ✅ cancele quando quiser
              </p>
            </div>

            <div>
              <p className="mb-3 text-center text-sm text-zinc-500 dark:text-zinc-400 md:hidden">
                👇 Digite algo e teste a Donna de verdade
              </p>
              <WhatsAppDemo />
              <p className="mt-3 hidden text-center text-xs text-zinc-500 dark:text-zinc-500 md:block">
                👆 É de verdade — digite qualquer coisa, como se você fosse o cliente
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="como-funciona" className="border-y border-zinc-100 bg-zinc-50 py-16 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="mx-auto mb-10 max-w-xl px-4 text-center md:px-6">
            <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-3xl">Como funciona</h2>
            <p className="text-zinc-600 dark:text-zinc-400">Tudo isso sem você precisar mexer em nada depois de configurado.</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 md:px-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full text-xl ${feature.color}`}>
                  {feature.emoji}
                </div>
                <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Exemplos de conversa */}
        <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-3xl">
              Mais exemplos de atendimento
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Algumas situações comuns do dia a dia — do jeito que a Donna resolve sozinha.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLES.map((example) => (
              <ChatExampleCard key={example.title} title={example.title} messages={example.messages} />
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-gradient-to-br from-[#075E54] to-[#0b6e5f] py-16 text-center text-white">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 md:px-6">
            <h2 className="text-2xl font-semibold md:text-3xl">Pronta pra vender enquanto você dorme?</h2>
            <p className="text-white/80">Cadastre sua loja e comece com {PRICING.trialDays} dias grátis.</p>
            <Link
              href="/signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-[#075E54] shadow-lg transition-transform hover:scale-105 hover:bg-zinc-100"
            >
              Criar minha loja
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
