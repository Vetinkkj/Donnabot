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

/**
 * Leva o lojista ao pagamento: garante o cliente e a assinatura no Asaas e
 * devolve o link da fatura (página do Asaas onde ele escolhe Pix, boleto ou
 * cartão — os dados de cartão nunca passam pelo nosso servidor).
 */
export async function startCheckout(
  storeId: string,
  input: { plan: BillingPlan; cpfCnpj: string; email: string }
): Promise<{ invoiceUrl: string }> {
  const store = await db.store.findUniqueOrThrow({ where: { id: storeId } });
  if (store.status === "SUSPENDED") {
    throw new AsaasError(`O acesso desta loja foi suspenso. Fale com o suporte da ${BRAND_NAME}.`);
  }

  let customerId = store.asaasCustomerId;
  if (customerId) {
    await asaas(`/customers/${customerId}`, { method: "POST", body: { cpfCnpj: input.cpfCnpj } });
  } else {
    const customer = await asaas<{ id: string }>("/customers", {
      method: "POST",
      body: { name: store.name, cpfCnpj: input.cpfCnpj, email: input.email, externalReference: store.id },
    });
    customerId = customer.id;
    await db.store.update({ where: { id: storeId }, data: { asaasCustomerId: customerId } });
  }

  // Já tem assinatura do mesmo plano com fatura em aberto: reaproveita (não gera cobrança duplicada).
  if (store.asaasSubscriptionId) {
    if (store.intendedPlan === input.plan) {
      const open = await findOpenPayment(store.asaasSubscriptionId);
      if (open) return { invoiceUrl: open.invoiceUrl };
    } else {
      // Trocou de plano antes de pagar: cancela a assinatura antiga (o Asaas remove as faturas pendentes dela).
      await asaas(`/subscriptions/${store.asaasSubscriptionId}`, { method: "DELETE" });
      await db.store.update({ where: { id: storeId }, data: { asaasSubscriptionId: null } });
    }
  }

  const subscription = await asaas<{ id: string }>("/subscriptions", {
    method: "POST",
    body: {
      customer: customerId,
      // UNDEFINED = o lojista escolhe na fatura: Pix, boleto ou cartão.
      billingType: "UNDEFINED",
      value: planValue(input.plan),
      nextDueDate: todayKey(),
      cycle: input.plan === "yearly" ? "YEARLY" : "MONTHLY",
      description: `${BRAND_NAME} — plano ${input.plan === "yearly" ? "anual" : "mensal"}`,
      externalReference: store.id,
    },
  });
  await db.store.update({
    where: { id: storeId },
    data: { asaasSubscriptionId: subscription.id, intendedPlan: input.plan },
  });

  const open = await findOpenPayment(subscription.id);
  if (!open) throw new AsaasError("O Asaas não gerou a fatura da assinatura. Tente de novo em instantes.");
  return { invoiceUrl: open.invoiceUrl };
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
