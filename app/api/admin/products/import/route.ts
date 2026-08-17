import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStoreId } from "@/lib/current-store";
import { importProducts } from "@/services/stock";

const rowSchema = z.object({
  name: z.string().trim().min(1),
  categoryName: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  compatibility: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: z.number().positive(),
  stockQuantity: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  sku: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const results = await importProducts(storeId, parsed.data.rows);
    const summary = {
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      errors: results.filter((r) => r.action === "error").length,
    };

    return NextResponse.json({ data: { results, summary } });
  } catch (error) {
    console.error("[POST /api/admin/products/import]", error);
    return NextResponse.json({ error: "Erro ao importar planilha" }, { status: 500 });
  }
}
