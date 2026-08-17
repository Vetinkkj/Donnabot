import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { createPixCharge } from "@/services/payment";

/**
 * Consulta (e gera, se ainda não existir) a cobrança PIX de um pedido —
 * útil para testar sem depender só das respostas de texto do chat. Veja
 * também /mock-payment/[orderId] para uma versão visual com QR Code.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const storeId = await getCurrentStoreId();

    const result = await createPixCharge(storeId, orderId);
    if (!result) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        order: { id: result.order.id, status: result.order.status, total: Number(result.order.total) },
        payment: result.payment,
      },
    });
  } catch (error) {
    console.error("[GET /api/mock/payment/:orderId]", error);
    return NextResponse.json({ error: "Erro ao buscar pagamento" }, { status: 500 });
  }
}
