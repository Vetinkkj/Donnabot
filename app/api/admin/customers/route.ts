import { NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { listCustomers } from "@/services/customers";

export async function GET() {
  try {
    const storeId = await getCurrentStoreId();
    const customers = await listCustomers(storeId);
    return NextResponse.json({ data: customers });
  } catch (error) {
    console.error("[GET /api/admin/customers]", error);
    return NextResponse.json({ error: "Erro ao listar clientes" }, { status: 500 });
  }
}
