import { NextRequest, NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/current-store";
import { confirmOrderPayment } from "@/services/payment";

/**
 * Atendente confirma manualmente que o cliente pagou (link de pagamento
 * enviado na conversa). Mesma lógica do webhook de pagamento: marca PAID,
 * dá baixa no estoque e avisa o cliente pelo WhatsApp da loja.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storeId = await getAdminStoreId();

    const result = await confirmOrderPayment(storeId, id);
    if (!result.ok) {
      const error = result.reason === "order_not_found" ? "Pedido não encontrado" : "Pedido não está mais pendente";
      return NextResponse.json({ error }, { status: result.reason === "order_not_found" ? 404 : 409 });
    }

    return NextResponse.json({ data: { alreadyProcessed: result.alreadyProcessed } });
  } catch (error) {
    console.error("[POST /api/admin/orders/:id/mark-paid]", error);
    return NextResponse.json({ error: "Erro ao marcar pedido como pago" }, { status: 500 });
  }
}
