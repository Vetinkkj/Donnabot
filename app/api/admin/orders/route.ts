import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { listOrders, serializeOrder, type OrderStatusFilter } from "@/services/orders";

const VALID_STATUSES: OrderStatusFilter[] = ["all", "PENDING", "PAID", "CANCELLED", "EXPIRED"];

export async function GET(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "all";
    const status = VALID_STATUSES.includes(statusParam as OrderStatusFilter)
      ? (statusParam as OrderStatusFilter)
      : "all";

    const orders = await listOrders(storeId, status);
    return NextResponse.json({ data: orders.map(serializeOrder) });
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json({ error: "Erro ao listar pedidos" }, { status: 500 });
  }
}
