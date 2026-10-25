import { db } from "@/lib/db";

/**
 * Lista de clientes com números calculados a partir dos pedidos reais:
 * - paidOrdersCount / totalSpent: só pedidos PAGOS (pendentes e cancelados não entram);
 * - lastPurchaseAt: data do último pagamento confirmado;
 * - lastInteractionAt: última mensagem trocada na conversa mais recente.
 */
export async function listCustomers(storeId: string) {
  const customers = await db.customer.findMany({
    where: { storeId },
    include: {
      _count: { select: { orders: true } },
      conversations: { orderBy: { lastMessageAt: "desc" }, take: 1, select: { id: true, lastMessageAt: true } },
      orders: {
        where: { status: "PAID" },
        select: { total: true, createdAt: true, payment: { select: { paidAt: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((customer) => {
    const paidDates = customer.orders.map((order) => (order.payment?.paidAt ?? order.createdAt).getTime());
    return {
      id: customer.id,
      name: customer.name,
      whatsappPhone: customer.whatsappPhone,
      ordersCount: customer._count.orders,
      paidOrdersCount: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.total), 0),
      lastPurchaseAt: paidDates.length ? new Date(Math.max(...paidDates)) : null,
      conversationId: customer.conversations[0]?.id ?? null,
      lastInteractionAt: customer.conversations[0]?.lastMessageAt ?? null,
      createdAt: customer.createdAt,
    };
  });
}

export type CustomerListItem = Awaited<ReturnType<typeof listCustomers>>[number];

/** Perfil de um cliente da loja: contato, pedidos e conversa. Sempre filtrado pela loja (nunca vaza outro cliente). */
export async function getCustomerProfile(storeId: string, id: string) {
  const customer = await db.customer.findFirst({
    where: { id, storeId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          payment: { select: { provider: true, status: true, paidAt: true } },
          items: { select: { quantity: true, product: { select: { name: true } } } },
        },
      },
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 1,
        select: { id: true, status: true, lastMessageAt: true, _count: { select: { messages: true } } },
      },
    },
  });
  if (!customer) return null;

  const paid = customer.orders.filter((order) => order.status === "PAID");
  const totalSpent = paid.reduce((sum, order) => sum + Number(order.total), 0);
  const paidDates = paid.map((order) => (order.payment?.paidAt ?? order.createdAt).getTime());
  const conversation = customer.conversations[0] ?? null;

  return {
    id: customer.id,
    name: customer.name,
    whatsappPhone: customer.whatsappPhone,
    createdAt: customer.createdAt,
    stats: {
      ordersCount: customer.orders.length,
      paidOrdersCount: paid.length,
      totalSpent,
      averageTicket: paid.length ? totalSpent / paid.length : null,
      lastPurchaseAt: paidDates.length ? new Date(Math.max(...paidDates)) : null,
    },
    conversation: conversation
      ? {
          id: conversation.id,
          status: conversation.status,
          lastMessageAt: conversation.lastMessageAt,
          messagesCount: conversation._count.messages,
        }
      : null,
    orders: customer.orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
      paidAt: order.payment?.paidAt ?? null,
      paymentProvider: order.payment?.provider ?? null,
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      summary: order.items.map((item) => `${item.quantity}× ${item.product.name}`).join(", "),
    })),
  };
}

export type CustomerProfile = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;
