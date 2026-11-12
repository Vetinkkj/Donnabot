import { db } from "@/lib/db";
import { asaas, AsaasError } from "@/lib/asaas";
import { BRAND_NAME, PRICING } from "@/lib/marketing-config";

// ---------------------------------------------------------------------------
// COBRANÇA DA ASSINATURA DA DONNA (lojas pagando a plataforma) via Asaas
// ---------------------------------------------------------------------------

export type BillingPlan = "monthly" | "yearly";

/** Dias de tolerância depois do vencimento antes de bloquear a loja (boleto compensa em até 1-2 dias úteis). */
const GRACE_DAYS = 3;

type AsaasPayment = {
  id: string;
  status: string;
  dueDate: string;
  invoiceUrl: string;
  value: number;
  subscription?: string | null;
  customer?: string;
};

function todayKey() {
  // Data no fuso de Brasília — é a que o Asaas usa no vencimento.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function planValue(plan: BillingPlan) {
  return plan === "yearly" ? PRICING.yearly : PRICING.monthly;
}

/** Cobrança em aberto (pendente ou vencida) da assinatura, se houver. */
async function findOpenPayment(subscriptionId: string) {
  const { data } = await asaas<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments`);
  return data.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
}

export type PaymentMethod = "PIX" | "CREDIT_CARD" | "BOLETO";

export type CheckoutResult =
  | { method: "PIX"; value: number; dueDate: string; invoiceUrl: string; qrCodeImage: string; copyPaste: string; expiresAt: string | null }
  | { method: "CREDIT_CARD" | "BOLETO"; value: number; dueDate: string; invoiceUrl: string };

/**
 * Prepara o pagamento da assinatura na forma escolhida: garante o cliente e a
 * assinatura no Asaas e devolve o que a tela precisa. Pix → QR Code e
 * "copia e cola" para pagar sem sair da Donna. Cartão → link da página segura
 * do Asaas (os dados do cartão nunca passam pelo nosso servidor). Boleto → link
 * do boleto.
 */
export async function startCheckout(
  storeId: string,
  input: { plan: BillingPlan; cpfCnpj: string; email: string; method: PaymentMethod }
): Promise<CheckoutResult> {
  const store = await db.store.findUniqueOrThrow({ where: { id: storeId } });
  if (store.status === "SUSPENDED") {
    throw new AsaasError(`O acesso desta loja foi suspenso. Fale com o suporte da ${BRAND_NAME}.`);
  }

  let customerId = store.asaasCustomerId;
  if (customerId) {
    await asaas(`/customers/${customerId}`, { method: "PUT", body: { cpfCnpj: input.cpfCnpj } });
  } else {
    const customer = await asaas<{ id: string }>("/customers", {
      method: "POST",
      body: { name: store.name, cpfCnpj: input.cpfCnpj, email: input.email, externalReference: store.id },
    });
    customerId = customer.id;
    await db.store.update({ where: { id: storeId }, data: { asaasCustomerId: customerId } });
  }

  let subscriptionId = store.asaasSubscriptionId;
  if (subscriptionId && store.intendedPlan !== input.plan) {
    // Trocou de plano antes de pagar: cancela a assinatura antiga (o Asaas remove as faturas pendentes dela).
    await asaas(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
    await db.store.update({ where: { id: storeId }, data: { asaasSubscriptionId: null } });
    subscriptionId = null;
  }

  if (subscriptionId) {
    // Mesmo plano: só troca a forma de pagamento, inclusive da fatura que já está em aberto.
    await asaas(`/subscriptions/${subscriptionId}`, {
      method: "PUT",
      body: { billingType: input.method, updatePendingPayments: true },
    });
  } else {
    const subscription = await asaas<{ id: string }>("/subscriptions", {
      method: "POST",
      body: {
        customer: customerId,
        billingType: input.method,
        value: planValue(input.plan),
        nextDueDate: todayKey(),
        cycle: input.plan === "yearly" ? "YEARLY" : "MONTHLY",
        description: `${BRAND_NAME} — plano ${input.plan === "yearly" ? "anual" : "mensal"}`,
        externalReference: store.id,
      },
    });
    subscriptionId = subscription.id;
    await db.store.update({ where: { id: storeId }, data: { asaasSubscriptionId: subscriptionId, intendedPlan: input.plan } });
  }

  const open = await findOpenPayment(subscriptionId);
  if (!open) throw new AsaasError("O Asaas não gerou a fatura da assinatura. Tente de novo em instantes.");
  const base = { value: open.value, dueDate: open.dueDate, invoiceUrl: open.invoiceUrl };

  if (input.method === "PIX") {
    const pix = await asaas<{ encodedImage: string; payload: string; expirationDate?: string }>(`/payments/${open.id}/pixQrCode`);
    return {
      method: "PIX",
      ...base,
      qrCodeImage: pix.encodedImage,
      copyPaste: pix.payload,
      expiresAt: pix.expirationDate ?? null,
    };
  }
  return { method: input.method, ...base };
}

/** Situação da assinatura para a tela de pagamento acompanhar (Pix confirma em segundos). */
export async function getBillingStatus(storeId: string) {
  const store = await db.store.findUniqueOrThrow({
    where: { id: storeId },
    select: { status: true, subscriptionExpiresAt: true },
  });
  const active = store.status === "ACTIVE" && (!store.subscriptionExpiresAt || store.subscriptionExpiresAt > new Date());
  return { active };
}

function addPeriod(dateKey: string, plan: BillingPlan) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  if (plan === "yearly") date.setUTCFullYear(date.getUTCFullYear() + 1);
  else date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(date.getUTCDate() + GRACE_DAYS);
  return date;
}

/**
 * Evento de webhook do Asaas. Pagamento confirmado libera a loja até o fim do
 * período pago (+ tolerância); estorno bloqueia na hora e cancela a assinatura
 * (garantia de 7 dias). Idempotente: o mesmo evento repetido dá o mesmo resultado.
 */
export async function handleAsaasPaymentEvent(event: string, payment: AsaasPayment) {
  const store = await db.store.findFirst({
    where: {
      OR: [
        ...(payment.subscription ? [{ asaasSubscriptionId: payment.subscription }] : []),
        ...(payment.customer ? [{ asaasCustomerId: payment.customer }] : []),
      ],
    },
  });
  if (!store) return { handled: false as const, reason: "store_not_found" };

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    const plan: BillingPlan = store.intendedPlan === "yearly" ? "yearly" : "monthly";
    const paidUntil = addPeriod(payment.dueDate, plan);
    const expiresAt =
      store.subscriptionExpiresAt && store.subscriptionExpiresAt > paidUntil ? store.subscriptionExpiresAt : paidUntil;
    await db.store.update({
      where: { id: store.id },
      data: {
        subscriptionExpiresAt: expiresAt,
        // Suspensão manual (SUSPENDED) continua valendo mesmo com pagamento — só você reativa.
        ...(store.status === "PENDING" ? { status: "ACTIVE" as const } : {}),
      },
    });
    return { handled: true as const };
  }

  if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_CHARGEBACK_REQUESTED") {
    if (store.asaasSubscriptionId) {
      await asaas(`/subscriptions/${store.asaasSubscriptionId}`, { method: "DELETE" }).catch(() => undefined);
    }
    await db.store.update({
      where: { id: store.id },
      data: { subscriptionExpiresAt: new Date(), asaasSubscriptionId: null },
    });
    return { handled: true as const };
  }

  return { handled: false as const, reason: "ignored_event" };
}
