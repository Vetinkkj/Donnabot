import { db } from "@/lib/db";
import { listProducts } from "@/services/stock";

/**
 * Números do dashboard por período (7/30/90 dias), sempre comparados com o
 * período anterior de mesmo tamanho. Dias contados no fuso de São Paulo
 * (UTC-3, sem horário de verão desde 2019).
 *
 * - Faturamento / pedidos pagos: pela data do pagamento (Payment.paidAt) —
 *   inclui os pedidos marcados como pagos manualmente pelo atendente.
 * - Conversas: conversas que receberam ao menos uma mensagem do cliente.
 * - Funil: conta CLIENTES distintos em cada etapa (conversou → finalizou
 *   carrinho → pagou). Contar pedidos fazia "carrinhos" passar de
 *   "conversas", porque o mesmo cliente fecha vários pedidos na mesma conversa.
 */

export const DASHBOARD_PERIODS = [7, 30, 90] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

function dayKey(date: Date): string {
  return dayKeyFormatter.format(date); // YYYY-MM-DD
}

function startOfDaySaoPaulo(key: string): Date {
  return new Date(`${key}T00:00:00-03:00`);
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // null = "novo" (sem base de comparação)
  return ((current - previous) / previous) * 100;
}

/**
 * Etapas acumulativas: quem pagou também finalizou carrinho, e quem finalizou
 * também conversou — mesmo que a mensagem tenha sido antes do período.
 * Assim cada etapa nunca passa da anterior.
 */
function funnelStages(talked: Set<string>, finalized: Set<string>, paid: Set<string>) {
  const finalizedAll = new Set([...finalized, ...paid]);
  const talkedAll = new Set([...talked, ...finalizedAll]);
  return [
    { label: "Clientes que conversaram", value: talkedAll.size },
    { label: "Finalizaram o carrinho", value: finalizedAll.size },
    { label: "Pagaram", value: paid.size },
  ];
}

export type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;

export async function getDashboardOverview(storeId: string, days: DashboardPeriod) {
  const todayKey = dayKey(new Date());
  const start = new Date(startOfDaySaoPaulo(todayKey).getTime() - (days - 1) * DAY_MS);
  const previousStart = new Date(start.getTime() - days * DAY_MS);

  const [
    paidOrders,
    cartCustomers,
    conversationsCurrent,
    conversationsPrevious,
    newCustomersCurrent,
    newCustomersPrevious,
    waitingHuman,
    withHuman,
    pendingOrders,
    lowStock,
    recentOrders,
    productsCount,
  ] = await Promise.all([
    db.order.findMany({
      where: { storeId, status: "PAID", payment: { paidAt: { gte: previousStart } } },
      select: {
        total: true,
        customerId: true,
        payment: { select: { paidAt: true } },
        items: { select: { productId: true, quantity: true, subtotal: true, product: { select: { name: true } } } },
      },
    }),
    db.order.findMany({
      where: { storeId, createdAt: { gte: start } },
      distinct: ["customerId"],
      select: { customerId: true },
    }),
    db.conversation.findMany({
      where: { storeId, messages: { some: { direction: "IN", createdAt: { gte: start } } } },
      select: { customerId: true },
    }),
    db.message.groupBy({
      by: ["conversationId"],
      where: { direction: "IN", createdAt: { gte: previousStart, lt: start }, conversation: { storeId } },
    }),
    db.customer.count({ where: { storeId, createdAt: { gte: start } } }),
    db.customer.count({ where: { storeId, createdAt: { gte: previousStart, lt: start } } }),
    db.conversation.count({ where: { storeId, status: "WAITING_HUMAN" } }),
    db.conversation.count({ where: { storeId, status: "HUMAN" } }),
    db.order.count({ where: { storeId, status: "PENDING" } }),
    listProducts(storeId, { stockStatus: "low_stock", activeOnly: true }),
    db.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, status: true, total: true, createdAt: true, customer: { select: { name: true, whatsappPhone: true } } },
    }),
    db.product.count({ where: { storeId, active: true } }),
  ]);

  // Série diária do período atual (dias sem venda ficam com zero).
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    return { day: dayKey(date), revenue: 0, orders: 0 };
  });
  const seriesByDay = new Map(series.map((point) => [point.day, point]));

  let revenueCurrent = 0;
  let revenuePrevious = 0;
  let paidCurrent = 0;
  let paidPrevious = 0;
  const productTotals = new Map<string, { name: string; revenue: number; quantity: number }>();
  const payingCustomers = new Set<string>();
  const payingCustomersPrevious = new Set<string>();

  for (const order of paidOrders) {
    const paidAt = order.payment?.paidAt;
    if (!paidAt) continue;
    const total = Number(order.total);

    if (paidAt >= start) {
      revenueCurrent += total;
      paidCurrent += 1;
      payingCustomers.add(order.customerId);
      const point = seriesByDay.get(dayKey(paidAt));
      if (point) {
        point.revenue += total;
        point.orders += 1;
      }
      for (const item of order.items) {
        const entry = productTotals.get(item.productId) ?? { name: item.product.name, revenue: 0, quantity: 0 };
        entry.revenue += Number(item.subtotal);
        entry.quantity += item.quantity;
        productTotals.set(item.productId, entry);
      }
    } else {
      revenuePrevious += total;
      paidPrevious += 1;
      payingCustomersPrevious.add(order.customerId);
    }
  }

  const ticketCurrent = paidCurrent ? revenueCurrent / paidCurrent : 0;
  const ticketPrevious = paidPrevious ? revenuePrevious / paidPrevious : 0;
  const conversationCount = conversationsCurrent.length;
  const funnel = funnelStages(
    new Set(conversationsCurrent.map((c) => c.customerId)),
    new Set(cartCustomers.map((c) => c.customerId)),
    payingCustomers,
  );
  // Conversão = clientes que pagaram ÷ clientes que conversaram (a mesma conta do funil, nunca passa de 100%).
  const conversionCurrent = funnel[0].value ? (funnel[2].value / funnel[0].value) * 100 : 0;
  const talkedPrevious = conversationsPrevious.length;
  const conversionPrevious = talkedPrevious
    ? (Math.min(payingCustomersPrevious.size, talkedPrevious) / talkedPrevious) * 100
    : 0;

  return {
    days,
    kpis: {
      revenue: { value: revenueCurrent, change: percentChange(revenueCurrent, revenuePrevious) },
      paidOrders: { value: paidCurrent, change: percentChange(paidCurrent, paidPrevious) },
      averageTicket: { value: ticketCurrent, change: percentChange(ticketCurrent, ticketPrevious) },
      // conversão em pontos percentuais (diferença absoluta), não em %
      conversion: { value: conversionCurrent, changePoints: conversionCurrent - conversionPrevious },
      conversations: { value: conversationCount, change: percentChange(conversationCount, conversationsPrevious.length) },
      newCustomers: { value: newCustomersCurrent, change: percentChange(newCustomersCurrent, newCustomersPrevious) },
    },
    series: series.map((point) => ({ ...point, revenue: Math.round(point.revenue * 100) / 100 })),
    funnel,
    topProducts: [...productTotals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    now: { waitingHuman, withHuman, pendingOrders, lowStockCount: lowStock.length, productsCount },
    lowStock: lowStock.slice(0, 5).map((product) => ({
      id: product.id,
      name: product.name,
      stockQuantity: product.stockQuantity,
      minStock: product.minStock,
    })),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      customer: order.customer.name ?? order.customer.whatsappPhone,
    })),
  };
}
