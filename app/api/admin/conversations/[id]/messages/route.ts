import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStoreId } from "@/lib/current-store";
import { sendAgentMessage } from "@/services/conversation";

const bodySchema = z.object({ text: z.string().trim().min(1, "Mensagem não pode ser vazia") });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const storeId = await getCurrentStoreId();
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
    }

    const sent = await sendAgentMessage(storeId, id, parsed.data.text);
    if (!sent) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

    return NextResponse.json({ data: true });
  } catch (error) {
    console.error("[POST /api/admin/conversations/:id/messages]", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
