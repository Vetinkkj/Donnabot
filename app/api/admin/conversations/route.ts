import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { listConversations, type ConversationStatusFilter } from "@/services/conversation";

const VALID_STATUSES: ConversationStatusFilter[] = ["all", "BOT", "WAITING_HUMAN", "HUMAN"];

export async function GET(request: NextRequest) {
  try {
    const storeId = await getCurrentStoreId();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "all";
    const status = VALID_STATUSES.includes(statusParam as ConversationStatusFilter)
      ? (statusParam as ConversationStatusFilter)
      : "all";

    const conversations = await listConversations(storeId, status);
    const data = conversations.map((conversation) => ({
      id: conversation.id,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      customer: {
        id: conversation.customer.id,
        name: conversation.customer.name,
        whatsappPhone: conversation.customer.whatsappPhone,
      },
      assignedUser: conversation.assignedUser ? { id: conversation.assignedUser.id, name: conversation.assignedUser.name } : null,
      lastMessage: conversation.messages[0]?.content ?? null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[GET /api/admin/conversations]", error);
    return NextResponse.json({ error: "Erro ao listar conversas" }, { status: 500 });
  }
}
