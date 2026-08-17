import { NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { listCategories } from "@/services/stock";

export async function GET() {
  try {
    const storeId = await getCurrentStoreId();
    const categories = await listCategories(storeId);
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("[GET /api/admin/categories]", error);
    return NextResponse.json({ error: "Erro ao listar categorias" }, { status: 500 });
  }
}
