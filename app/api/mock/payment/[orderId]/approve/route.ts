import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { confirmOrderPayment } from "@/services/payment";

/**
 * Simula o gateway avisando que o PIX foi pago. Dispara a mesma lógica que
 * o webhook real usaria: marca o pedido como PAID, dá baixa no estoque e
 * avisa o cliente pelo WhatsApp (mock).
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const storeId = await getCurrentStoreId();

    const result = await confirmOrderPayment(storeId, orderId);
    if (!result.ok) {
      const status = result.reason === "order_not_found" ? 404 : 409;
      return NextResponse.json({ error: result.reason }, { status });
    }

    return NextResponse.json({ data: { confirmed: true, alreadyProcessed: result.alreadyProcessed } });
  } catch (error) {
    console.error("[POST /api/mock/payment/:orderId/approve]", error);
    return NextResponse.json({ error: "Erro ao aprovar pagamento" }, { status: 500 });
  }
}
