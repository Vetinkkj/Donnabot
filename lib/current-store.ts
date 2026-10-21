import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStoreOperational } from "@/services/store";

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

export class StoreBlockedError extends Error {
  constructor() {
    super("Loja sem acesso ao painel (pendente, suspensa ou com assinatura vencida)");
  }
}

/**
 * Loja da sessão para as APIs do painel. Além de exigir login, recusa loja
 * pendente, suspensa ou vencida — o layout do painel já mostra a tela de
 * bloqueio, mas sem isto as APIs continuariam aceitando chamadas diretas
 * (ex: conectar WhatsApp, mandar mensagem a clientes, importar produtos).
 * Quem é isPlatformAdmin nunca é bloqueado.
 */
export async function getAdminStoreId(): Promise<string> {
  const session = await auth();
  const storeId = session?.user?.storeId;
  if (!storeId) throw new StoreBlockedError();
  if (session.user.isPlatformAdmin) return storeId;

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { status: true, subscriptionExpiresAt: true },
  });
  if (!store || !isStoreOperational(store)) throw new StoreBlockedError();
  return storeId;
}
