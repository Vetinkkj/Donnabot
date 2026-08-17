import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { closeConversation } from "@/services/conversation";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();

    const conversation = await closeConversation(storeId, id);
    if (!conversation) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error("[POST /api/admin/conversations/:id/close]", error);
    return NextResponse.json({ error: "Erro ao encerrar atendimento" }, { status: 500 });
  }
}
