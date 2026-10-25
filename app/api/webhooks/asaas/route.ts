import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleAsaasPaymentEvent } from "@/services/billing";

/**
 * Webhook do Asaas (cobrança da assinatura das lojas). Configure em
 * Asaas → Integrações → Webhooks, com a URL /api/webhooks/asaas e o mesmo
 * token de ASAAS_WEBHOOK_TOKEN — o Asaas manda esse token no header
 * `asaas-access-token` e qualquer chamada sem ele é recusada.
 *
 * Respondemos 200 também para eventos que não nos interessam: se o Asaas
 * recebe erro várias vezes seguidas, ele pausa a fila de webhooks.
 */
function isTokenValid(received: string | null) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!isTokenValid(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (typeof body?.event !== "string" || !body.payment?.id) {
      return NextResponse.json({ received: true });
    }

    const result = await handleAsaasPaymentEvent(body.event, body.payment);
    if (!result.handled && result.reason === "store_not_found") {
      console.warn("[POST /api/webhooks/asaas] pagamento sem loja:", body.event, body.payment.id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // Erro nosso (ex: banco fora): 500 faz o Asaas tentar de novo depois.
    console.error("[POST /api/webhooks/asaas]", error);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
