import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAiProvider } from "@/services/ai";
import type { ParsedMessage } from "@/services/ai";
import { getWhatsAppProvider } from "@/services/whatsapp";
import { findBestProductMatch, getCategoryEmoji, getProduct, type SerializedProduct } from "@/services/stock";
import { cancelOrder, createOrderFromCart } from "@/services/orders";
import { createPixCharge } from "@/services/payment";

type CartItem = {
  productId: string;
  name: string;
  categoryName: string | null;
  unitPrice: number;
  quantity: number;
};

type ConversationContext = {
  lastProduct?: { id: string; name: string; quantity: number };
  cart?: CartItem[];
  pendingOrderId?: string;
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function readContext(raw: Prisma.JsonValue): ConversationContext {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as ConversationContext;
  return {};
}

async function getOrCreateCustomer(storeId: string, phone: string, name?: string) {
  return db.customer.upsert({
    where: { storeId_whatsappPhone: { storeId, whatsappPhone: phone } },
    update: name ? { name } : {},
    create: { storeId, whatsappPhone: phone, name },
  });
}

async function getOrCreateConversation(storeId: string, customerId: string) {
  const existing = await db.conversation.findFirst({
    where: { storeId, customerId },
    orderBy: { lastMessageAt: "desc" },
  });
  if (existing) return existing;

  return db.conversation.create({
    data: { storeId, customerId, status: "BOT", context: {} },
  });
}

async function saveMessage(
  conversationId: string,
  direction: "IN" | "OUT",
  content: string,
  messageType: "TEXT" | "BUTTONS" | "IMAGE" = "TEXT"
) {
  await db.message.create({ data: { conversationId, direction, content, messageType } });
}

function buildProductReply(product: SerializedProduct, requestedQuantity: number): string {
  const emoji = getCategoryEmoji(product.categoryName);

  if (product.stockQuantity <= 0) {
    return [
      "Infelizmente estamos sem estoque dessa peça no momento.",
      `${emoji} ${product.name}`,
      "❌ Disponível: 0 unidades",
      "Deseja falar com um atendente?",
    ].join("\n");
  }

  if (product.stockQuantity < requestedQuantity) {
    return [
      `Temos somente ${product.stockQuantity} unidades disponíveis.`,
      `📦 Estoque atual: ${product.stockQuantity}`,
      `Deseja comprar ${product.stockQuantity} unidades?`,
    ].join("\n");
  }

  const lines = ["Sim! Temos disponível:", `${emoji} ${product.name}`];

  if (requestedQuantity > 1) {
    lines.push(`💰 ${currency.format(product.price)} cada`);
    lines.push(`Quantidade: ${requestedQuantity}`);
    lines.push(`💰 Total: ${currency.format(product.price * requestedQuantity)}`);
  } else {
    lines.push(`💰 ${currency.format(product.price)}`);
  }

  lines.push(`📦 Estoque: ${product.stockQuantity} unidades`);
  lines.push("Deseja comprar?");

  return lines.join("\n");
}

function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function addToCart(cart: CartItem[], item: CartItem): CartItem[] {
  const existingIndex = cart.findIndex((line) => line.productId === item.productId);
  if (existingIndex === -1) return [...cart, item];

  const updated = [...cart];
  updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + item.quantity };
  return updated;
}

function buildCartReply(cart: CartItem[]): string {
  const lines = ["🛒 Seu carrinho:"];
  for (const item of cart) {
    const emoji = getCategoryEmoji(item.categoryName);
    const subtotal = item.unitPrice * item.quantity;
    lines.push(`${emoji} ${item.name} — ${item.quantity}x ${currency.format(item.unitPrice)} = ${currency.format(subtotal)}`);
  }
  lines.push(`💰 Total: ${currency.format(cartTotal(cart))}`);
  lines.push('Digite "finalizar" para fechar o pedido e ir para o pagamento, ou me diga outra peça para adicionar.');
  return lines.join("\n");
}

function buildOrderSummary(cart: CartItem[], orderId: string, total: number): string {
  const lines = [`Perfeito! Seu pedido #${orderId.slice(-6).toUpperCase()} ficou:`];
  for (const item of cart) {
    const emoji = getCategoryEmoji(item.categoryName);
    lines.push(`${emoji} ${item.name} — Quantidade: ${item.quantity}`);
  }
  lines.push(`💰 Total: ${currency.format(total)}`);
  lines.push("Deseja prosseguir para o pagamento?");
  return lines.join("\n");
}

const NOT_FOUND_REPLY =
  "Não encontrei essa peça no nosso estoque 😕.\nSe quiser, posso tentar localizar outro modelo ou você pode falar com um atendente.";

const HUMAN_HANDOFF_REPLY =
  "Combinado! Vou te transferir para um atendente humano, só um instante 🙋‍♀️";

const FALLBACK_REPLY =
  'Não entendi muito bem 😅 Pode me dizer o nome da peça e o modelo do aparelho? Ou digite "atendente" para falar com alguém.';

function buildPixReply(orderId: string, total: number, copyPasteCode: string): string {
  return [
    "💳 Pagamento via PIX",
    `💰 Valor: ${currency.format(total)}`,
    "QR Code: enviado como imagem — abra a conversa no WhatsApp para escanear.",
    `(Em modo de teste, veja o QR e simule o pagamento em /mock-payment/${orderId})`,
    "Ou copie e cole:",
    copyPasteCode,
    "Após realizar o pagamento, aguarde a confirmação.",
  ].join("\n");
}

const EMPTY_CART_REPLY =
  "Seu carrinho está vazio ainda. Me diga qual peça você quer que eu te ajudo a montar o pedido.";

const NOTHING_TO_CANCEL_REPLY = "Não tem nada pra cancelar no momento 🙂";

type ResolvedReply = {
  reply: string;
  context: ConversationContext;
  image?: { url: string; caption: string };
};

async function resolveReply(
  store: { welcomeMessage: string },
  storeId: string,
  customerId: string,
  conversationContext: Prisma.JsonValue,
  parsed: ParsedMessage
): Promise<ResolvedReply> {
  const context = readContext(conversationContext);

  if (parsed.intent === "human_handoff") {
    return { reply: HUMAN_HANDOFF_REPLY, context };
  }

  if (parsed.intent === "cancel") {
    if (context.pendingOrderId) {
      await cancelOrder(storeId, context.pendingOrderId);
      return {
        reply: "Seu pedido foi cancelado. Se quiser começar de novo é só me chamar 🙂",
        context: { ...context, pendingOrderId: undefined, cart: undefined, lastProduct: undefined },
      };
    }
    if (context.cart && context.cart.length > 0) {
      return {
        reply: "Cancelei seu carrinho. Bora começar de novo? 🙂",
        context: { ...context, cart: undefined, lastProduct: undefined },
      };
    }
    return { reply: NOTHING_TO_CANCEL_REPLY, context };
  }

  if (parsed.intent === "checkout") {
    if (context.pendingOrderId) {
      const charge = await createPixCharge(storeId, context.pendingOrderId);
      if (charge && !charge.alreadyResolved) {
        return {
          reply: buildPixReply(charge.order.id, Number(charge.order.total), charge.payment?.copyPasteCode ?? ""),
          context,
          image: charge.payment?.qrCode ? { url: charge.payment.qrCode, caption: "Pagamento via PIX" } : undefined,
        };
      }
      return { reply: "Esse pedido já não está mais aguardando pagamento.", context: { ...context, pendingOrderId: undefined } };
    }

    const cart = context.cart ?? [];
    if (cart.length === 0) {
      return { reply: EMPTY_CART_REPLY, context };
    }

    const { order, errors } = await createOrderFromCart(
      storeId,
      customerId,
      cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    );

    if (errors.length > 0 || !order) {
      const lines = ["Ops, o estoque de alguns itens mudou enquanto você decidia:"];
      for (const error of errors) {
        lines.push(`${error.productName}: pedimos ${error.requestedQuantity}, mas agora só tem ${error.availableQuantity} disponível.`);
      }
      lines.push("Quer ajustar e tentar de novo?");
      return { reply: lines.join("\n"), context };
    }

    const reply = buildOrderSummary(cart, order.id, Number(order.total));
    return { reply, context: { ...context, cart: undefined, lastProduct: undefined, pendingOrderId: order.id } };
  }

  if (parsed.intent === "greeting") {
    return { reply: store.welcomeMessage, context };
  }

  if (parsed.intent === "affirmative") {
    if (context.pendingOrderId) {
      const charge = await createPixCharge(storeId, context.pendingOrderId);
      if (!charge) {
        return { reply: "Não encontrei esse pedido. Vamos começar de novo?", context: { ...context, pendingOrderId: undefined } };
      }
      if (charge.alreadyResolved) {
        return {
          reply: "Esse pedido não está mais aguardando pagamento — se quiser, me diga outra peça que eu monto um novo pedido.",
          context: { ...context, pendingOrderId: undefined },
        };
      }
      return {
        reply: buildPixReply(charge.order.id, Number(charge.order.total), charge.payment?.copyPasteCode ?? ""),
        context,
        image: charge.payment?.qrCode ? { url: charge.payment.qrCode, caption: "Pagamento via PIX" } : undefined,
      };
    }

    if (context.lastProduct) {
      const fresh = await getProduct(storeId, context.lastProduct.id);
      if (!fresh || fresh.stockQuantity <= 0) {
        return {
          reply: "Poxa, essa peça acabou de ficar sem estoque 😕 Quer ver outra opção?",
          context: { ...context, lastProduct: undefined },
        };
      }

      const quantity = Math.min(context.lastProduct.quantity, fresh.stockQuantity);
      const cart = addToCart(context.cart ?? [], {
        productId: fresh.id,
        name: fresh.name,
        categoryName: fresh.categoryName,
        unitPrice: fresh.price,
        quantity,
      });

      return { reply: buildCartReply(cart), context: { ...context, cart, lastProduct: undefined } };
    }

    return { reply: FALLBACK_REPLY, context };
  }

  if (parsed.intent === "product_query") {
    const query = parsed.productQuery.trim();

    let product: SerializedProduct | null = null;
    if (query.length >= 2) {
      product = await findBestProductMatch(storeId, query);
    } else if (context.lastProduct) {
      product = await findBestProductMatch(storeId, context.lastProduct.name);
    }

    if (!product) {
      return { reply: NOT_FOUND_REPLY, context: { ...context, lastProduct: undefined } };
    }

    const reply = buildProductReply(product, parsed.quantity);
    const offeredQuantity = Math.min(parsed.quantity, product.stockQuantity);
    const lastProduct =
      product.stockQuantity > 0 ? { id: product.id, name: product.name, quantity: offeredQuantity } : undefined;

    return { reply, context: { ...context, lastProduct } };
  }

  return { reply: FALLBACK_REPLY, context };
}

export async function handleIncomingMessage(storeId: string, phone: string, text: string, name?: string) {
  const store = await db.store.findUniqueOrThrow({ where: { id: storeId } });
  const customer = await getOrCreateCustomer(storeId, phone, name);
  const conversation = await getOrCreateConversation(storeId, customer.id);

  await saveMessage(conversation.id, "IN", text);

  if (conversation.status !== "BOT") {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
    return { reply: null, conversationId: conversation.id, status: conversation.status };
  }

  const ai = getAiProvider();
  const parsed = await ai.parseMessage(text);

  const { reply, context, image } = await resolveReply(store, storeId, customer.id, conversation.context, parsed);

  if (image) await saveMessage(conversation.id, "OUT", image.caption, "IMAGE");
  await saveMessage(conversation.id, "OUT", reply);

  const newStatus = parsed.intent === "human_handoff" ? "WAITING_HUMAN" : conversation.status;
  await db.conversation.update({
    where: { id: conversation.id },
    data: { context: context as Prisma.InputJsonValue, lastMessageAt: new Date(), status: newStatus },
  });

  const whatsapp = getWhatsAppProvider();
  if (image) await whatsapp.sendImage(phone, image.url, image.caption);
  await whatsapp.sendText(phone, reply);

  return { reply, conversationId: conversation.id, status: newStatus };
}

// ---------------------------------------------------------------------------
// PAINEL ADMIN — ATENDIMENTO HUMANO
// ---------------------------------------------------------------------------

export type ConversationStatusFilter = "all" | "BOT" | "WAITING_HUMAN" | "HUMAN";

export async function listConversations(storeId: string, statusFilter: ConversationStatusFilter = "all") {
  return db.conversation.findMany({
    where: { storeId, ...(statusFilter !== "all" ? { status: statusFilter } : {}) },
    include: {
      customer: true,
      assignedUser: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getConversationById(storeId: string, id: string) {
  return db.conversation.findFirst({
    where: { id, storeId },
    include: {
      customer: true,
      assignedUser: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

/** Atendente assume a conversa: bot para de responder, conversa some da fila de espera. */
export async function assignConversation(storeId: string, id: string, userId: string) {
  const existing = await db.conversation.findFirst({ where: { id, storeId } });
  if (!existing) return null;

  return db.conversation.update({
    where: { id },
    data: { status: "HUMAN", assignedUserId: userId, lastMessageAt: new Date() },
  });
}

/** Atendente encerra o atendimento: conversa volta a ser respondida pelo bot. */
export async function closeConversation(storeId: string, id: string) {
  const existing = await db.conversation.findFirst({ where: { id, storeId } });
  if (!existing) return null;

  return db.conversation.update({
    where: { id },
    data: { status: "BOT", assignedUserId: null },
  });
}

/** Mensagem enviada pelo atendente humano (não passa pela IA nem pelo services/stock). */
export async function sendAgentMessage(storeId: string, id: string, text: string) {
  const conversation = await db.conversation.findFirst({ where: { id, storeId }, include: { customer: true } });
  if (!conversation) return null;

  await saveMessage(conversation.id, "OUT", text);
  await db.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });

  const whatsapp = getWhatsAppProvider();
  await whatsapp.sendText(conversation.customer.whatsappPhone, text);

  return true;
}

export async function getConversationHistory(storeId: string, phone: string) {
  const customer = await db.customer.findUnique({
    where: { storeId_whatsappPhone: { storeId, whatsappPhone: phone } },
  });
  if (!customer) return [];

  const conversation = await db.conversation.findFirst({
    where: { storeId, customerId: customer.id },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return conversation?.messages ?? [];
}
