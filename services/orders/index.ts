import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { listProducts } from "@/services/stock";

export type CartItemInput = { productId: string; quantity: number };

export type StockValidationError = {
  productId: string;
  productName: string;
  requestedQuantity: number;
  availableQuantity: number;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Cria um pedido (status PENDING) a partir do carrinho, revalidando o
 * estoque de cada item no momento do checkout (o carrinho pode ter ficado
 * "parado" na conversa por um tempo, então o estoque real pode ter mudado).
 *
 * Importante: NÃO dá baixa no estoque aqui. O estoque só é debitado quando o
 * pagamento é confirmado via webhook (Etapa 5) — assim não reduzimos o
 * estoque só porque o cliente iniciou uma compra.
 */
export async function createOrderFromCart(storeId: string, customerId: string, items: CartItemInput[]) {
  const products = await db.product.findMany({
    where: { id: { in: items.map((item) => item.productId) }, storeId, active: true },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const errors: StockValidationError[] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || product.stockQuantity < item.quantity) {
      errors.push({
        productId: item.productId,
        productName: product?.name ?? "produto",
        requestedQuantity: item.quantity,
        availableQuantity: product?.stockQuantity ?? 0,
      });
    }
  }
  if (errors.length > 0) return { order: null, errors };

  const total = round2(
    items.reduce((sum, item) => sum + Number(productById.get(item.productId)!.price) * item.quantity, 0)
  );

  const order = await db.order.create({
    data: {
      storeId,
      customerId,
      status: "PENDING",
      total,
      items: {
        create: items.map((item) => {
          const product = productById.get(item.productId)!;
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal: round2(Number(product.price) * item.quantity),
          };
        }),
      },
    },
    include: { items: { include: { product: true } } },
  });

  return { order, errors: [] as StockValidationError[] };
}

export async function getOrder(storeId: string, id: string) {
  return db.order.findFirst({
    where: { id, storeId },
    include: {
      items: { include: { product: { include: { category: true } } } },
      customer: true,
      payment: true,
      store: true,
    },
  });
}

/** Só cancela pedidos ainda PENDING — um pedido já pago não deve virar cancelado por aqui. */
export async function cancelOrder(storeId: string, id: string) {
  const existing = await db.order.findFirst({ where: { id, storeId } });
  if (!existing || existing.status !== "PENDING") return null;
  return db.order.update({ where: { id }, data: { status: "CANCELLED" } });
}

export type OrderStatusFilter = OrderStatus | "all";

export async function listOrders(storeId: string, statusFilter: OrderStatusFilter = "all") {
  return db.order.findMany({
    where: { storeId, ...(statusFilter !== "all" ? { status: statusFilter } : {}) },
    include: { items: { include: { product: true } }, customer: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
}

// Shape mínimo que serializeOrder precisa — assim tanto getOrder() (que
// inclui category/store) quanto listOrders() (que não inclui) servem aqui,
// já que ambos têm pelo menos esses campos.
type OrderForSerialization = {
  id: string;
  status: OrderStatus;
  total: Prisma.Decimal | number;
  createdAt: Date;
  updatedAt: Date;
  customer: { id: string; name: string | null; whatsappPhone: string };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal | number;
    subtotal: Prisma.Decimal | number;
    product: { name: string };
  }>;
  payment: {
    id: string;
    provider: string;
    externalId: string | null;
    status: string;
    amount: Prisma.Decimal | number;
    paidAt: Date | null;
  } | null;
};

export function serializeOrder(order: OrderForSerialization) {
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      whatsappPhone: order.customer.whatsappPhone,
    },
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          externalId: order.payment.externalId,
          status: order.payment.status,
          amount: Number(order.payment.amount),
          paidAt: order.payment.paidAt,
        }
      : null,
  };
}

export type SerializedOrder = ReturnType<typeof serializeOrder>;

export async function getDashboardStats(storeId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [productsCount, pendingOrders, paidOrders, salesToday, revenueToday, lowStock] = await Promise.all([
    db.product.count({ where: { storeId, active: true } }),
    db.order.count({ where: { storeId, status: "PENDING" } }),
    db.order.count({ where: { storeId, status: "PAID" } }),
    db.order.count({ where: { storeId, status: "PAID", payment: { paidAt: { gte: todayStart } } } }),
    db.order.aggregate({
      where: { storeId, status: "PAID", payment: { paidAt: { gte: todayStart } } },
      _sum: { total: true },
    }),
    listProducts(storeId, { stockStatus: "low_stock", activeOnly: true }),
  ]);

  return {
    productsCount,
    pendingOrders,
    paidOrders,
    salesToday,
    revenueToday: Number(revenueToday._sum.total ?? 0),
    lowStockCount: lowStock.length,
  };
}
