import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { AsaasError } from "@/lib/asaas";
import { startCheckout } from "@/services/billing";

const bodySchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
  cpfCnpj: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length === 11 || digits.length === 14, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)"),
});

/**
 * Lojista pendente ou com assinatura vencida vai pagar. Não usa
 * getAdminStoreId de propósito: essa rota existe justamente pra loja que
 * ainda não está liberada. Só o dono da loja contrata.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.storeId || !session.user.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "OWNER" && !session.user.isPlatformAdmin) {
    return NextResponse.json({ error: "Só o dono da loja pode contratar o plano" }, { status: 403 });
  }

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const { invoiceUrl } = await startCheckout(session.user.storeId, { ...parsed.data, email: session.user.email });
    return NextResponse.json({ data: { invoiceUrl } });
  } catch (error) {
    console.error("[POST /api/admin/billing/checkout]", error);
    const message = error instanceof AsaasError ? error.message : "Erro ao gerar a cobrança";
    return NextResponse.json({ error: message }, { status: error instanceof AsaasError ? 400 : 500 });
  }
}
