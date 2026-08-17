import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Resolve a loja "atual". Se houver uma sessão de admin logada, usa a loja
 * dela (`session.user.storeId`) — preparado para quando o sistema tiver
 * várias lojas de verdade. Rotas públicas (webhook, mock do WhatsApp) não
 * têm sessão, então caem no fallback de pegar a primeira loja cadastrada
 * (hoje só existe uma).
 */
export async function getCurrentStoreId(): Promise<string> {
  const session = await auth();
  if (session?.user?.storeId) return session.user.storeId;

  const store = await db.store.findFirstOrThrow();
  return store.id;
}
