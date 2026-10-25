import { ConversationView } from "@/components/admin/inbox/ConversationView";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // key: ao trocar de conversa, o estado (rascunho, rolagem, envios) recomeça do zero
  return <ConversationView key={id} id={id} />;
}
