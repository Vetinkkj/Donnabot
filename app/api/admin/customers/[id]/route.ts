import { NextRequest, NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/current-store";
import { getCustomerProfile } from "@/services/customers";

/** Perfil do cliente (usado pelo painel lateral do atendimento). Só clientes da loja logada. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storeId = await getAdminStoreId();
    const profile = await getCustomerProfile(storeId, id);
    if (!profile) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("[GET /api/admin/customers/:id]", error);
    return NextResponse.json({ error: "Erro ao carregar cliente" }, { status: 500 });
  }
}
