import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { AsaasError } from "@/lib/asaas";
import { isPlanId, type PlanId } from "@/lib/plans";
import { startCheckout } from "@/services/billing";
import { db } from "@/lib/db";
import { CONTRACT_VERSION } from "@/lib/marketing-config";

const bodySchema = z.object({
  plan: z.string().refine(isPlanId, "Plano inválido").transform((value) => value as PlanId),
  method: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  acceptContract: z.literal(true, { message: "Para assinar, aceite o Contrato de Assinatura" }),
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

    const { plan, method, cpfCnpj } = parsed.data;
    const input = { plan, method, cpfCnpj };
    // Prova do aceite do contrato (data, usuário, IP e versão) antes de gerar a cobrança.
    await db.contractAcceptance.create({
      data: {
        storeId: session.user.storeId,
        userId: session.user.id ?? null,
        userEmail: session.user.email,
        version: CONTRACT_VERSION,
        plan: input.plan,
        cpfCnpj: input.cpfCnpj,
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip"),
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      },
    });

    const result = await startCheckout(session.user.storeId, { ...input, email: session.user.email });
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[POST /api/admin/billing/checkout]", error);
    const message = error instanceof AsaasError ? error.message : "Erro ao gerar a cobrança";
    return NextResponse.json({ error: message }, { status: error instanceof AsaasError ? 400 : 500 });
  }
}
