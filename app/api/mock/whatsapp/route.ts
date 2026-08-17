import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStoreId } from "@/lib/current-store";
import { getConversationHistory, handleIncomingMessage } from "@/services/conversation";

/**
 * Simula o webhook do WhatsApp: você manda { phone, message } aqui como se
 * fosse o cliente escrevendo, e recebe de volta a resposta da "Dona" — sem
 * precisar de uma conta WhatsApp Business real. Quando a integração de
 * verdade existir (Etapa 7 do roadmap de WhatsApp), o endpoint real em
 * /api/webhooks/whatsapp vai chamar esse mesmo services/conversation.
 */

const bodySchema = z.object({
  phone: z.string().trim().min(6, "Telefone inválido"),
  message: z.string().trim().min(1, "Mensagem não pode ser vazia"),
  name: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const storeId = await getCurrentStoreId();
    const result = await handleIncomingMessage(
      storeId,
      parsed.data.phone,
      parsed.data.message,
      parsed.data.name
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[POST /api/mock/whatsapp]", error);
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    if (!phone) {
      return NextResponse.json({ error: "Informe ?phone=" }, { status: 400 });
    }

    const storeId = await getCurrentStoreId();
    const messages = await getConversationHistory(storeId, phone);
    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error("[GET /api/mock/whatsapp]", error);
    return NextResponse.json({ error: "Erro ao buscar histórico" }, { status: 500 });
  }
}
