import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentStoreId } from "@/lib/current-store";
import { assignConversation } from "@/services/conversation";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const storeId = await getCurrentStoreId();
    const conversation = await assignConversation(storeId, id, session.user.id);
    if (!conversation) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error("[POST /api/admin/conversations/:id/assign]", error);
    return NextResponse.json({ error: "Erro ao assumir conversa" }, { status: 500 });
  }
}
