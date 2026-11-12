import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingStatus } from "@/services/billing";

/**
 * A tela de pagamento consulta aqui a cada poucos segundos para saber quando o
 * Pix caiu (o webhook do Asaas libera a loja). Não usa getAdminStoreId: a loja
 * ainda está bloqueada justamente enquanto espera o pagamento.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    return NextResponse.json({ data: await getBillingStatus(session.user.storeId) });
  } catch (error) {
    console.error("[GET /api/admin/billing/status]", error);
    return NextResponse.json({ error: "Erro ao consultar o pagamento" }, { status: 500 });
  }
}
