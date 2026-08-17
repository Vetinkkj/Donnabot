import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStoreId } from "@/lib/current-store";
import { confirmOrderPayment, markOrderPaymentStatus } from "@/services/payment";

/**
 * Webhook real de pagamento. Cada gateway (Mercado Pago, Efí, Asaas,
 * PagBank...) manda um formato de payload e um esquema de assinatura
 * diferente — este endpoint usa um formato genérico próprio
 * ({ orderId, status }) só para já deixar a estrutura funcionando de ponta a
 * ponta. Ao integrar um gateway de verdade:
 *   1. Troque o parsing do body pelo formato daquele gateway.
 *   2. Troque a validação de assinatura pelo esquema documentado por ele
 *      (a maioria manda um header tipo X-Signature com HMAC do corpo cru).
 *   3. Resolva o orderId a partir do externalId retornado pelo gateway
 *      (salvo em `payments.externalId` na hora de criar a cobrança).
 */

const bodySchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["approved", "cancelled", "expired"]),
});

function isSignatureValid(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return true; // sem segredo configurado, pula validação (ambiente de dev)
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");

    if (!isSignatureValid(rawBody, signature)) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const storeId = await getCurrentStoreId();
    const { orderId, status } = parsed.data;

    if (status === "approved") {
      const result = await confirmOrderPayment(storeId, orderId);
      if (!result.ok) {
        return NextResponse.json({ error: result.reason }, { status: result.reason === "order_not_found" ? 404 : 409 });
      }
      return NextResponse.json({ data: { confirmed: true } });
    }

    await markOrderPaymentStatus(storeId, orderId, status === "cancelled" ? "CANCELLED" : "EXPIRED");
    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    console.error("[POST /api/webhooks/payment]", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
