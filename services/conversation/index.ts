import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAiProvider } from "@/services/ai";
import type { ParsedMessage } from "@/services/ai";
import { getWhatsAppProviderFor, type WhatsAppButton } from "@/services/whatsapp";
import { getCategoryEmoji, getProduct, searchProduct, type SerializedProduct } from "@/services/stock";
import { cancelOrder, createOrderFromCart } from "@/services/orders";
import { isStoreOperational, resolveStoreWhatsAppConfig } from "@/services/store";

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
      `Se quiser levar as ${product.stockQuantity} unidades, toque em "Adicionar" 👇`,
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
  lines.push('Para levar, toque em "Adicionar" 👇');

  return lines.join("\n");
}

/** Vários produtos servem pro que o cliente disse — lista e pergunta o modelo em vez de chutar. */
function buildAmbiguousReply(options: SerializedProduct[]): string {
  const lines = ["Temos algumas opções 🙂"];
  for (const option of options) {
    const emoji = getCategoryEmoji(option.categoryName);
    const stock = option.stockQuantity > 0 ? currency.format(option.price) : "sem estoque";
    lines.push(`${emoji} ${option.name} — ${stock}`);
  }
  lines.push("Qual é o modelo do seu aparelho?");
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
  lines.push('Quer mais alguma peça? É só me dizer qual. Para fechar a compra, toque em "Finalizar carrinho" 👇');
  return lines.join("\n");
}

function shortOrderId(orderId: string): string {
  return orderId.slice(-6).toUpperCase();
}

/**
 * Ao finalizar o carrinho a Donna não gera cobrança sozinha: o pedido fica
 * PENDING e a conversa vai pra fila de atendimento, onde um humano manda o
 * link de pagamento. O resumo fica salvo no histórico, então o atendente vê
 * o pedido ao abrir a conversa no painel.
 */
function buildCheckoutHandoffReply(cart: CartItem[], orderId: string, total: number): string {
  const lines = [`Perfeito! Seu pedido #${shortOrderId(orderId)} ficou:`];
  for (const item of cart) {
    const emoji = getCategoryEmoji(item.categoryName);
    lines.push(`${emoji} ${item.name} — Quantidade: ${item.quantity}`);
  }
  lines.push(`💰 Total: ${currency.format(total)}`);
  lines.push("Vou te transferir para um atendente, que já vai te enviar o link de pagamento 🙋‍♀️");
  return lines.join("\n");
}

function buildPendingOrderHandoffReply(orderId: string): string {
  return `Seu pedido #${shortOrderId(orderId)} já está separado! Vou te passar para um atendente, que vai te enviar o link de pagamento 🙋‍♀️`;
}

const NOT_FOUND_REPLY =
  "Não encontrei essa peça no nosso estoque 😕.\nSe quiser, posso tentar localizar outro modelo ou você pode falar com um atendente.";

const HUMAN_HANDOFF_REPLY =
  "Combinado! Vou te transferir para um atendente humano, só um instante 🙋‍♀️";

const FALLBACK_REPLY =
  'Não entendi muito bem 😅 Pode me dizer o nome da peça e o modelo do aparelho? Ou digite "atendente" para falar com alguém.';

const EMPTY_CART_REPLY =
  "Seu carrinho está vazio ainda. Me diga qual peça você quer que eu te ajudo a montar o pedido.";

const NOTHING_TO_ADD_REPLY =
  "Me diga qual peça você procura (ex: \"tela do iPhone 11\") que eu vejo se temos e coloco no carrinho 🙂";

const NOTHING_TO_CANCEL_REPLY = "Não tem nada pra cancelar no momento 🙂";

// Botões de resposta rápida do WhatsApp (máx. 3 por mensagem, título até 20
// caracteres). O `id` volta no webhook quando o cliente toca e é tratado como
// se ele tivesse digitado esse texto — por isso é uma frase que o NLU entende.
const ADD_TO_CART_BUTTON: WhatsAppButton = { id: "adicionar ao carrinho", label: "🛒 Adicionar" };
const CHECKOUT_BUTTON: WhatsAppButton = { id: "finalizar carrinho", label: "Finalizar carrinho" };
const HUMAN_BUTTON: WhatsAppButton = { id: "atendente", label: "Falar c/ atendente" };

type ResolvedReply = {
  reply: string;
  context: ConversationContext;
  /** true = conversa vai para a fila "Aguardando atendente" e a Donna para de responder. */
  handoff?: boolean;
  buttons?: WhatsAppButton[];
};

/** Pedido do contexto ainda aguardando pagamento? (pode ter sido pago/cancelado pelo atendente no painel) */
async function isOrderStillPending(storeId: string, orderId: string): Promise<boolean> {
  const order = await db.order.findFirst({ where: { id: orderId, storeId }, select: { status: true } });
  return order?.status === "PENDING";
}

async function addLastProductToCart(storeId: string, context: ConversationContext): Promise<ResolvedReply> {
  const lastProduct = context.lastProduct!;
  const fresh = await getProduct(storeId, lastProduct.id);
  if (!fresh || fresh.stockQuantity <= 0) {
    return {
      reply: "Poxa, essa peça acabou de ficar sem estoque 😕 Quer ver outra opção?",
      context: { ...context, lastProduct: undefined },
    };
  }

  const quantity = Math.min(lastProduct.quantity, fresh.stockQuantity);
  const cart = addToCart(context.cart ?? [], {
    productId: fresh.id,
    name: fresh.name,
    categoryName: fresh.categoryName,
    unitPrice: fresh.price,
    quantity,
  });

  return {
    reply: `✅ Adicionado ao carrinho!\n${buildCartReply(cart)}`,
    context: { ...context, cart, lastProduct: undefined },
    buttons: [CHECKOUT_BUTTON],
  };
}

async function resolveReply(
  store: { welcomeMessage: string },
  storeId: string,
  customerId: string,
  conversationContext: Prisma.JsonValue,
  parsed: ParsedMessage
): Promise<ResolvedReply> {
  const context = readContext(conversationContext);

  if (parsed.intent === "human_handoff") {
    return { reply: HUMAN_HANDOFF_REPLY, context, handoff: true };
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

  if (parsed.intent === "add_to_cart") {
    if (context.lastProduct) return addLastProductToCart(storeId, context);
    return { reply: NOTHING_TO_ADD_REPLY, context };
  }

  if (parsed.intent === "view_cart") {
    const cart = context.cart ?? [];
    if (cart.length === 0) return { reply: EMPTY_CART_REPLY, context };
    return { reply: buildCartReply(cart), context, buttons: [CHECKOUT_BUTTON] };
  }

  if (parsed.intent === "checkout") {
    const cart = context.cart ?? [];

    if (context.pendingOrderId && cart.length === 0) {
      if (await isOrderStillPending(storeId, context.pendingOrderId)) {
        return { reply: buildPendingOrderHandoffReply(context.pendingOrderId), context, handoff: true };
      }
      return { reply: EMPTY_CART_REPLY, context: { ...context, pendingOrderId: undefined } };
    }

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

    const reply = buildCheckoutHandoffReply(cart, order.id, Number(order.total));
    return {
      reply,
      context: { ...context, cart: undefined, lastProduct: undefined, pendingOrderId: order.id },
      handoff: true,
    };
  }

  if (parsed.intent === "greeting") {
    return { reply: store.welcomeMessage, context };
  }

  if (parsed.intent === "affirmative") {
    // "sim" depois de uma peça oferecida continua funcionando como "adicionar ao carrinho".
    if (context.lastProduct) return addLastProductToCart(storeId, context);

    if (context.pendingOrderId) {
      if (await isOrderStillPending(storeId, context.pendingOrderId)) {
        return { reply: buildPendingOrderHandoffReply(context.pendingOrderId), context, handoff: true };
      }
      return { reply: FALLBACK_REPLY, context: { ...context, pendingOrderId: undefined } };
    }

    return { reply: FALLBACK_REPLY, context };
  }

  if (parsed.intent === "product_query") {
    const query = parsed.productQuery.trim();

    const searchText = query.length >= 2 ? query : context.lastProduct?.name;
    const result = searchText ? await searchProduct(storeId, searchText) : ({ kind: "not_found" } as const);

    if (result.kind === "not_found") {
      return { reply: NOT_FOUND_REPLY, context: { ...context, lastProduct: undefined }, buttons: [HUMAN_BUTTON] };
    }

    if (result.kind === "ambiguous") {
      return { reply: buildAmbiguousReply(result.options), context: { ...context, lastProduct: undefined } };
    }

    const product = result.product;
    const reply = buildProductReply(product, parsed.quantity);
    const offeredQuantity = Math.min(parsed.quantity, product.stockQuantity);
    const lastProduct =
      product.stockQuantity > 0 ? { id: product.id, name: product.name, quantity: offeredQuantity } : undefined;

    return { reply, context: { ...context, lastProduct }, buttons: [lastProduct ? ADD_TO_CART_BUTTON : HUMAN_BUTTON] };
  }

  return { reply: FALLBACK_REPLY, context };
}

// Corpo de mensagem interativa da Meta aceita no máximo 1024 caracteres.
const INTERACTIVE_BODY_LIMIT = 1024;

/** Texto salvo no histórico: a resposta + os botões oferecidos, pro atendente ver o que o cliente recebeu. */
function withButtonLabels(reply: string, buttons: WhatsAppButton[]): string {
  return `${reply}\n${buttons.map((button) => `[${button.label}]`).join(" ")}`;
}

export async function handleIncomingMessage(storeId: string, phone: string, text: string, name?: string) {
  const store = await db.store.findUniqueOrThrow({ where: { id: storeId } });
  const customer = await getOrCreateCustomer(storeId, phone, name);
  const conversation = await getOrCreateConversation(storeId, customer.id);

  await saveMessage(conversation.id, "IN", text);

  if (!isStoreOperational(store)) {
    // Loja pendente de aprovação, suspensa ou com assinatura vencida — a
    // mensagem fica registrada (o dono vê o histórico quando reativar),
    // mas a Donna não responde.
    await db.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });
    return { reply: null, conversationId: conversation.id, status: conversation.status };
  }

  if (conversation.status !== "BOT") {
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
    return { reply: null, conversationId: conversation.id, status: conversation.status };
  }

  const ai = getAiProvider();
  const parsed = await ai.parseMessage(text);

  const { reply, context, handoff, buttons } = await resolveReply(
    store,
    storeId,
    customer.id,
    conversation.context,
    parsed
  );

  if (buttons?.length) {
    await saveMessage(conversation.id, "OUT", withButtonLabels(reply, buttons), "BUTTONS");
  } else {
    await saveMessage(conversation.id, "OUT", reply);
  }

  const newStatus = handoff ? "WAITING_HUMAN" : conversation.status;
  await db.conversation.update({
    where: { id: conversation.id },
    data: { context: context as Prisma.InputJsonValue, lastMessageAt: new Date(), status: newStatus },
  });

  const whatsapp = getWhatsAppProviderFor(resolveStoreWhatsAppConfig(store));
  if (!buttons?.length) {
    await whatsapp.sendText(phone, reply);
  } else if (reply.length <= INTERACTIVE_BODY_LIMIT) {
    await whatsapp.sendButtons(phone, reply, buttons);
  } else {
    // Carrinho muito grande pra caber no corpo dos botões: manda o texto
    // inteiro e os botões numa mensagem curta logo depois.
    await whatsapp.sendText(phone, reply);
    await whatsapp.sendButtons(phone, "Escolha uma opção 👇", buttons);
  }

  return { reply, conversationId: conversation.id, status: newStatus };
}

/**
 * Coexistência: o lojista respondeu o cliente pelo app WhatsApp Business no
 * celular (webhook `smb_message_echoes`). A conversa passa a ser HUMANA — a
 * Donna fica em silêncio com esse cliente, como se o atendente tivesse
 * clicado em "Assumir atendimento" no painel, até alguém encerrar o
 * atendimento. Se o lojista puxou conversa com um cliente novo, ela já nasce
 * humana, pra Donna não se intrometer quando o cliente responder.
 */
export async function handleOwnerReplyFromPhone(storeId: string, customerPhone: string, text: string) {
  const customer = await getOrCreateCustomer(storeId, customerPhone);
  const conversation = await getOrCreateConversation(storeId, customer.id);

  await saveMessage(conversation.id, "OUT", `📱 ${text}`);
  await db.conversation.update({
    where: { id: conversation.id },
    data: { status: "HUMAN", lastMessageAt: new Date() },
  });

  return { conversationId: conversation.id, pausedBot: conversation.status !== "HUMAN" };
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

  const store = await db.store.findUniqueOrThrow({ where: { id: storeId } });
  const whatsapp = getWhatsAppProviderFor(resolveStoreWhatsAppConfig(store));
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
