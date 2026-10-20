import { NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { db } from "@/lib/db";

/**
 * Consulta leve, chamada a cada poucos segundos pelo aviso sonoro do painel
 * (components/admin/WaitingCustomerAlert.tsx): quais conversas estão em
 * "Aguardando atendente" agora.
 */
export async function GET() {
  try {
    const storeId = await getCurrentStoreId();
    const waiting = await db.conversation.findMany({
      where: { storeId, status: "WAITING_HUMAN" },
      select: { id: true, customer: { select: { name: true, whatsappPhone: true } } },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json({
      data: waiting.map((conversation) => ({
        id: conversation.id,
        customerName: conversation.customer.name ?? conversation.customer.whatsappPhone,
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/conversations/waiting]", error);
    return NextResponse.json({ error: "Erro ao buscar conversas aguardando" }, { status: 500 });
  }
}
