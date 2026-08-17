import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { getConversationById } from "@/services/conversation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();

    const conversation = await getConversationById(storeId, id);
    if (!conversation) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

    return NextResponse.json({
      data: {
        id: conversation.id,
        status: conversation.status,
        customer: {
          id: conversation.customer.id,
          name: conversation.customer.name,
          whatsappPhone: conversation.customer.whatsappPhone,
        },
        assignedUser: conversation.assignedUser
          ? { id: conversation.assignedUser.id, name: conversation.assignedUser.name }
          : null,
        messages: conversation.messages.map((message) => ({
          id: message.id,
          direction: message.direction,
          content: message.content,
          messageType: message.messageType,
          createdAt: message.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/conversations/:id]", error);
    return NextResponse.json({ error: "Erro ao buscar conversa" }, { status: 500 });
  }
}
