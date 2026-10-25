import { MessagesSquare } from "lucide-react";

/** Nenhuma conversa aberta (só aparece de tablet para cima; no celular a lista ocupa a tela). */
export default function ConversationsIndexPage() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center md:flex">
      <span className="grid size-12 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-zinc-400">
        <MessagesSquare className="size-5" aria-hidden />
      </span>
      <p className="font-medium text-zinc-200">Escolha uma conversa</p>
      <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
        As conversas em que o cliente pediu um atendente aparecem com um ponto âmbar. A Donna continua respondendo as
        outras sozinha.
      </p>
    </div>
  );
}
