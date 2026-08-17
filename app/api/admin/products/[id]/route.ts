import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { productUpdateSchema } from "@/lib/validations/product";
import { deleteProduct, getProduct, updateProduct } from "@/services/stock";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();

    const product = await getProduct(storeId, id);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("[GET /api/admin/products/:id]", error);
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const product = await updateProduct(storeId, id, parsed.data);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Já existe um produto com esse SKU" }, { status: 409 });
    }
    console.error("[PATCH /api/admin/products/:id]", error);
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();

    const deleted = await deleteProduct(storeId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: true });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Este produto já foi usado em pedidos e não pode ser excluído. Desative-o em vez de excluir.",
        },
        { status: 409 }
      );
    }
    console.error("[DELETE /api/admin/products/:id]", error);
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 });
  }
}
