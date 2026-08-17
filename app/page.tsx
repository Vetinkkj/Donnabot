import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Olá, Sou a Donna Bot!🤖
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Automação de atendimento via WhatsApp para lojas de peças de celular.
        Projeto em construção — o painel administrativo será adicionado nas
        próximas etapas.
      </p>
      <div className="flex gap-3 text-sm font-medium">
        <Link href="/products" className="text-zinc-900 underline dark:text-zinc-50">
          Painel admin
        </Link>
        <Link href="/mock-chat" className="text-zinc-900 underline dark:text-zinc-50">
          Simular conversa no WhatsApp
        </Link>
      </div>
    </div>
  );
}
