import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { productInputSchema } from "@/lib/validations/product";
import { createProduct, listProducts, type StockStatus } from "@/services/stock";

const VALID_STOCK_STATUS: (StockStatus | "all")[] = [
  "all",
  "in_stock",
  "low_stock",
  "out_of_stock",
];

export async function GET(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? undefined;
    const stockStatusParam = searchParams.get("stockStatus") ?? "all";
    const stockStatus = VALID_STOCK_STATUS.includes(stockStatusParam as StockStatus | "all")
      ? (stockStatusParam as StockStatus | "all")
      : "all";

    const products = await listProducts(storeId, { search, stockStatus });
    return NextResponse.json({ data: products });
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json({ error: "Erro ao listar produtos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const body = await request.json();
    const parsed = productInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const product = await createProduct(storeId, parsed.data);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um produto com esse SKU" }, { status: 409 });
    }
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
