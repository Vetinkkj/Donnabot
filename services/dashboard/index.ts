import { db } from "@/lib/db";
import { listProducts } from "@/services/stock";

/**
 * Números do dashboard para um intervalo de datas qualquer (atalhos como
 * "7 dias" ou "Este mês", ou datas escolhidas no calendário), sempre
 * comparados com o período anterior de mesmo tamanho. Dias contados no fuso
 * de São Paulo (UTC-3, sem horário de verão desde 2019).
 *
 * - Faturamento / pedidos pagos: pela data do pagamento (Payment.paidAt) —
 *   inclui os pedidos marcados como pagos manualmente pelo atendente.
 * - Conversas: conversas que receberam ao menos uma mensagem do cliente.
 * - Funil: conta CLIENTES distintos em cada etapa (conversou → finalizou
 *   carrinho → pagou). Contar pedidos fazia "carrinhos" passar de
 *   "conversas", porque o mesmo cliente fecha vários pedidos na mesma conversa.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
// Acima disso o gráfico agrupa por mês, para continuar legível.
const MAX_DAILY_POINTS = 92;
// Limite de segurança para não varrer anos de dados de uma vez.
const MAX_RANGE_DAYS = 3 * 366;

function dayKey(date: Date): string {
  return dayKeyFormatter.format(date); // YYYY-MM-DD
}

function startOfDaySaoPaulo(key: string): Date {
  return new Date(`${key}T00:00:00-03:00`);
}

function addDays(key: string, amount: number): string {
  return dayKey(new Date(startOfDaySaoPaulo(key).getTime() + amount * DAY_MS + 12 * 60 * 60 * 1000));
}

export const DASHBOARD_PRESETS = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "mes", label: "Este mês" },
  { id: "mes-passado", label: "Mês passado" },
  { id: "ano", label: "Este ano" },
] as const;
export type DashboardPresetId = (typeof DASHBOARD_PRESETS)[number]["id"];

export type DashboardRange = { from: string; to: string; preset: DashboardPresetId | "personalizado" };

function presetRange(id: DashboardPresetId, today: string): { from: string; to: string } {
  const [year, month] = today.split("-");
  switch (id) {
    case "hoje":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "ontem": {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "mes":
      return { from: `${year}-${month}-01`, to: today };
    case "mes-passado": {
      const firstOfMonth = `${year}-${month}-01`;
      const lastOfPrevious = addDays(firstOfMonth, -1);
      return { from: `${lastOfPrevious.slice(0, 7)}-01`, to: lastOfPrevious };
    }
    case "ano":
      return { from: `${year}-01-01`, to: today };
    case "30d":
    default:
      return { from: addDays(today, -29), to: today };
  }
}

/**
 * Lê ?periodo=… (atalho) ou ?de=AAAA-MM-DD&ate=AAAA-MM-DD (personalizado).
 * Datas inválidas, invertidas ou no futuro são corrigidas em vez de dar erro.
 */
export function resolveDashboardRange(params: { periodo?: string; de?: string; ate?: string }): DashboardRange {
  const today = dayKey(new Date());

  if (params.de && params.ate && DATE_KEY.test(params.de) && DATE_KEY.test(params.ate)) {
    let from = params.de < params.ate ? params.de : params.ate;
    let to = params.de < params.ate ? params.ate : params.de;
    if (to > today) to = today;
    if (from > to) from = to;
    if (from < addDays(to, -(MAX_RANGE_DAYS - 1))) from = addDays(to, -(MAX_RANGE_DAYS - 1));
    return { from, to, preset: "personalizado" };
  }

  const preset = DASHBOARD_PRESETS.find((p) => p.id === params.periodo)?.id ?? "30d";
  return { ...presetRange(preset, today), preset };
}

const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function utcNoon(key: string) {
  return new Date(`${key.length === 7 ? `${key}-01` : key}T12:00:00Z`);
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

export async function getDashboardOverview(storeId: string, range: DashboardRange) {
  const start = startOfDaySaoPaulo(range.from);
  const end = new Date(startOfDaySaoPaulo(range.to).getTime() + DAY_MS); // exclusivo
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const previousStart = new Date(start.getTime() - days * DAY_MS);
  const current = { gte: start, lt: end };

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
      where: { storeId, status: "PAID", payment: { paidAt: { gte: previousStart, lt: end } } },
      select: {
        total: true,
        customerId: true,
        payment: { select: { paidAt: true } },
        items: { select: { productId: true, quantity: true, subtotal: true, product: { select: { name: true } } } },
      },
    }),
    db.order.findMany({
      where: { storeId, createdAt: current },
      distinct: ["customerId"],
      select: { customerId: true },
    }),
    db.conversation.findMany({
      where: { storeId, messages: { some: { direction: "IN", createdAt: current } } },
      select: { customerId: true },
    }),
    db.message.groupBy({
      by: ["conversationId"],
      where: { direction: "IN", createdAt: { gte: previousStart, lt: start }, conversation: { storeId } },
    }),
    db.customer.count({ where: { storeId, createdAt: current } }),
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

  // Série do período (dias/meses sem venda ficam com zero). Até ~3 meses: por
  // dia; acima disso: por mês. Rótulos já prontos para o gráfico.
  const monthly = days > MAX_DAILY_POINTS;
  const bucketOf = (key: string) => (monthly ? key.slice(0, 7) : key);
  const bucketKeys: string[] = [];
  for (let key = range.from; key <= range.to; key = addDays(key, 1)) {
    const bucket = bucketOf(key);
    if (bucketKeys[bucketKeys.length - 1] !== bucket) bucketKeys.push(bucket);
  }
  const series = bucketKeys.map((key) => ({
    key,
    label: monthly ? monthShort.format(utcNoon(key)).replace(".", "") : shortDate.format(utcNoon(key)),
    tooltip: capitalize(monthly ? monthLong.format(utcNoon(key)) : longDate.format(utcNoon(key))),
    revenue: 0,
    orders: 0,
  }));
  const seriesByDay = new Map(series.map((point) => [point.key, point]));

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
      const point = seriesByDay.get(bucketOf(dayKey(paidAt)));
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
    range: { ...range, days, granularity: monthly ? ("month" as const) : ("day" as const) },
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
