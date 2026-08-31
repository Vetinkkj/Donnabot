import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { WhatsAppDemo } from "@/components/marketing/WhatsAppDemo";

export const metadata: Metadata = {
  title: "Donnabot — Atendimento automático via WhatsApp pra loja de peças",
  description:
    "A Donna atende seus clientes no WhatsApp, consulta estoque, fecha o pedido e recebe o pagamento via PIX — sozinha, o dia inteiro.",
};

const FEATURES = [
  {
    emoji: "📦",
    title: "Consulta de estoque na hora",
    description:
      "O cliente pergunta se tem a peça, a Donna responde na hora com preço e quantidade disponível — sem seu time precisar digitar nada.",
  },
  {
    emoji: "🛒",
    title: "Carrinho e fechamento de pedido",
    description:
      "A Donna monta o carrinho, calcula o total e fecha o pedido direto na conversa, do jeito que o cliente já está acostumado a comprar.",
  },
  {
    emoji: "💳",
    title: "Pagamento PIX automático",
    description:
      "Gera o QR Code, confirma o pagamento e dá baixa no estoque sozinha — você só recebe a notificação de venda.",
  },
  {
    emoji: "🙋",
    title: "Atendimento humano quando precisa",
    description:
      "Se o cliente pedir pra falar com alguém, a conversa cai direto na fila do seu time no painel — a Donna nunca deixa ninguém sem resposta.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center md:px-6 md:py-24">
          <span className="rounded-full bg-[#25D366]/10 px-3 py-1 text-xs font-medium text-[#0f7a3d] dark:bg-[#25D366]/15 dark:text-[#25D366]">
            🤖 Atendimento automático via WhatsApp
          </span>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
            Sua loja de peças de celular, atendida 24h pela Donna
          </h1>
          <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400 md:text-lg">
            A Donna responde clientes no seu WhatsApp, consulta estoque, monta o carrinho e recebe o pagamento via
            PIX — sozinha, o dia inteiro.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-[#075E54] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0b6e5f]"
            >
              Criar minha loja
            </Link>
            <a
              href="#demo"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Ver como funciona
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-zinc-100 bg-zinc-50 py-16 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 md:px-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 text-2xl">{feature.emoji}</div>
                <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-3xl">
              Veja a Donna em ação
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Essa é uma conversa de exemplo, com o mesmo texto que a Donna realmente manda — é assim que ela vai
              atender os clientes da sua loja.
            </p>
          </div>
          <WhatsAppDemo />
        </section>

        {/* CTA final */}
        <section className="bg-[#075E54] py-16 text-center text-white">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 md:px-6">
            <h2 className="text-2xl font-semibold md:text-3xl">Pronta pra vender enquanto você dorme?</h2>
            <p className="text-white/80">Cadastre sua loja e comece com 1 mês grátis.</p>
            <Link
              href="/signup"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-[#075E54] transition-colors hover:bg-zinc-100"
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
