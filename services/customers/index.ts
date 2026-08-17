import { db } from "@/lib/db";

export async function listCustomers(storeId: string) {
  const customers = await db.customer.findMany({
    where: { storeId },
    include: {
      _count: { select: { orders: true } },
      conversations: { orderBy: { lastMessageAt: "desc" }, take: 1, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    whatsappPhone: customer.whatsappPhone,
    ordersCount: customer._count.orders,
    conversationId: customer.conversations[0]?.id ?? null,
    createdAt: customer.createdAt,
  }));
}
