import type { ReactNode } from "react";
import { ConversationList } from "@/components/admin/inbox/ConversationList";

/**
 * Atendimento em tela cheia: lista de conversas à esquerda (fica montada ao
 * trocar de conversa) e a conversa aberta ao lado. No celular aparece uma
 * coisa de cada vez: a lista, ou a conversa com botão de voltar.
 * As margens negativas anulam o espaçamento do <main> do painel.
 */
export default function ConversationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-97px)] overflow-hidden sm:-mx-6 md:-mx-8 md:-my-8 md:h-dvh">
      <ConversationList />
      {children}
    </div>
  );
}
