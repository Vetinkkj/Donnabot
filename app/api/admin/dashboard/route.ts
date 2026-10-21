import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/current-store";
import { getDashboardStats } from "@/services/orders";

export async function GET() {
  try {
    const storeId = await getAdminStoreId();
    const stats = await getDashboardStats(storeId);
    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("[GET /api/admin/dashboard]", error);
    return NextResponse.json({ error: "Erro ao carregar dashboard" }, { status: 500 });
  }
}
