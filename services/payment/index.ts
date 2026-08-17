import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWhatsAppProvider } from "@/services/whatsapp";
import { getCategoryEmoji } from "@/services/stock";
import { getOrder } from "@/services/orders";
import type { PaymentProvider } from "./provider";
import { mockPaymentProvider } from "./mock-provider";
import { mercadoPagoProvider } from "./mercadopago-provider";

export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "mercadopago") return mercadoPagoProvider;
  return mockPaymentProvider;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Gera (ou reaproveita, se já existir) a cobrança PIX de um pedido PENDING.
 * Idempotente: chamar de novo para o mesmo pedido não cria uma segunda
 * cobrança no gateway.
 */
export async function createPixCharge(storeId: string, orderId: string) {
  const order = await getOrder(storeId, orderId);
  if (!order) return null;
  if (order.status !== "PENDING") return { order, payment: order.payment, alreadyResolved: true as const };
  if (order.payment) return { order, payment: order.payment, alreadyResolved: false as const };

  const provider = getPaymentProvider();
  const charge = await provider.createCharge({
    orderId: order.id,
    amount: Number(order.total),
    description: `Pedido #${order.id.slice(-6).toUpperCase()}`,
  });

  const payment = await db.payment.create({
    data: {
      orderId: order.id,
      provider: process.env.PAYMENT_PROVIDER || "mock",
      externalId: charge.externalId,
      qrCode: charge.qrCode,
      copyPasteCode: charge.copyPasteCode,
      amount: charge.amount,
      status: "PENDING",
    },
  });

  return { order, payment, alreadyResolved: false as const };
}

function buildPaidMessage(orderApprovedMessage: string, order: NonNullable<Awaited<ReturnType<typeof getOrder>>>): string {
  const lines = [orderApprovedMessage, `Pedido #${order.id.slice(-6).toUpperCase()} aprovado.`];
  for (const item of order.items) {
    const emoji = getCategoryEmoji(item.product.category?.name);
    lines.push(`${emoji} ${item.product.name} — Quantidade: ${item.quantity}`);
  }
  lines.push(`💰 Total: ${currency.format(Number(order.total))}`);
  return lines.join("\n");
}

async function notifyCustomer(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>, message: string) {
  const conversation = await db.conversation.findFirst({
    where: { customerId: order.customerId },
    orderBy: { lastMessageAt: "desc" },
  });

  if (conversation) {
    await db.message.create({ data: { conversationId: conversation.id, direction: "OUT", content: message } });
    const context =
      conversation.context && typeof conversation.context === "object" && !Array.isArray(conversation.context)
        ? (conversation.context as Record<string, unknown>)
        : {};
    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        context: { ...context, pendingOrderId: undefined } as Prisma.InputJsonValue,
        lastMessageAt: new Date(),
      },
    });
  }

  const whatsapp = getWhatsAppProvider();
  await whatsapp.sendText(order.customer.whatsappPhone, message);
}

export type ConfirmPaymentResult =
  | { ok: true; alreadyProcessed: boolean }
  | { ok: false; reason: "order_not_found" | "order_not_pending" };

/**
 * Chamado quando o gateway confirma o pagamento (webhook real ou aprovação
 * mock). Dá baixa no estoque e avisa o cliente — só AQUI o estoque é
 * reduzido, nunca antes. Idempotente: se o pedido já estiver PAID, não
 * processa de novo (webhooks podem chegar duplicados).
 */
export async function confirmOrderPayment(storeId: string, orderId: string): Promise<ConfirmPaymentResult> {
  const order = await getOrder(storeId, orderId);
  if (!order) return { ok: false, reason: "order_not_found" };
  if (order.status === "PAID") return { ok: true, alreadyProcessed: true };
  if (order.status !== "PENDING") return { ok: false, reason: "order_not_pending" };

  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
    ...(order.payment
      ? [db.payment.update({ where: { id: order.payment.id }, data: { status: "PAID", paidAt: new Date() } })]
      : []),
    ...order.items.flatMap((item) => [
      db.product.update({ where: { id: item.productId }, data: { stockQuantity: { decrement: item.quantity } } }),
      db.stockMovement.create({
        data: { productId: item.productId, orderId: order.id, type: "OUT", quantity: item.quantity, reason: "Venda" },
      }),
    ]),
  ]);

  const message = buildPaidMessage(order.store.orderApprovedMessage, order);
  await notifyCustomer(order, message);

  return { ok: true, alreadyProcessed: false };
}

/** Usado quando o gateway informa que a cobrança foi cancelada/expirou. */
export async function markOrderPaymentStatus(storeId: string, orderId: string, status: "CANCELLED" | "EXPIRED") {
  const order = await getOrder(storeId, orderId);
  if (!order || order.status !== "PENDING") return null;

  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { status } }),
    ...(order.payment ? [db.payment.update({ where: { id: order.payment.id }, data: { status } })] : []),
  ]);

  return order;
}

export type { PaymentProvider, Charge, ChargeParams } from "./provider";
