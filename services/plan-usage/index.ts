import { db } from "@/lib/db";
import { TIERS, storePlan } from "@/lib/plans";

const SP = "America/Sao_Paulo";

/** Primeiro instante do mês corrente no horário de Brasília (UTC-3, sem horário de verão). */
function monthStart() {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: SP, year: "numeric", month: "2-digit" })
    .format(new Date())
    .split("-");
  return new Date(`${year}-${month}-01T00:00:00-03:00`);
}

/**
 * Conversas atendidas no mês: cada cliente que mandou mensagem num dia conta
 * uma vez naquele dia (é a definição que aparece na tabela de planos).
 */
export async function countMonthlyConversations(storeId: string) {
  const rows = await db.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*)::bigint AS total FROM (
      SELECT DISTINCT c."customerId", (m."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${SP})::date AS day
      FROM messages m
      JOIN conversations c ON c.id = m."conversationId"
      WHERE c."storeId" = ${storeId} AND m.direction = 'IN' AND m."createdAt" >= ${monthStart()}
    ) t`;
  return Number(rows[0]?.total ?? 0);
}

/** Plano da loja e quanto do limite de conversas do mês já foi usado. */
export async function getPlanUsage(storeId: string) {
  const store = await db.store.findUniqueOrThrow({ where: { id: storeId }, select: { intendedPlan: true } });
  const plan = storePlan(store.intendedPlan);
  const used = await countMonthlyConversations(storeId).catch(() => null);
  return { ...plan, name: TIERS[plan.tier].name, limit: TIERS[plan.tier].conversations, used };
}
