import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { cancelOrder, getOrder, serializeOrder } from "@/services/orders";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();

    const order = await getOrder(storeId, id);
    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    return NextResponse.json({ data: serializeOrder(order) });
  } catch (error) {
    console.error("[GET /api/admin/orders/:id]", error);
    return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();

    const cancelled = await cancelOrder(storeId, id);
    if (!cancelled) {
      return NextResponse.json({ error: "Pedido não encontrado ou não está pendente" }, { status: 409 });
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error("[DELETE /api/admin/orders/:id]", error);
    return NextResponse.json({ error: "Erro ao cancelar pedido" }, { status: 500 });
  }
}
