import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { handleIncomingMessage } from "@/services/conversation";

/**
 * Webhook real da WhatsApp Business Cloud API (Meta). Enquanto
 * WHATSAPP_PROVIDER="mock", use /api/mock/whatsapp para testar — este
 * endpoint só entra em ação quando você configurar uma conta WhatsApp
 * Business de verdade e registrar esta URL no painel da Meta.
 *
 * Modo single-store: assume que existe uma única loja (getCurrentStoreId).
 * Se este projeto vier a atender várias lojas de verdade, o storeId
 * precisaria vir do `WHATSAPP_PHONE_NUMBER_ID` presente no payload
 * (`entry[].changes[].value.metadata.phone_number_id`), mapeado para a loja
 * dona daquele número.
 */

// Meta chama esta rota com GET uma vez, na hora de configurar o webhook,
// só para confirmar que você é dono da URL.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verificação inválida" }, { status: 403 });
}

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{ from?: string; type?: string; text?: { body?: string } }>;
      };
    }>;
  }>;
};

function isSignatureValid(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // sem segredo configurado, pula validação (ambiente de dev/mock)
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!isSignatureValid(rawBody, request.headers.get("x-hub-signature-256"))) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const payload: MetaWebhookPayload = JSON.parse(rawBody);
    const storeId = await getCurrentStoreId();

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const messages = change.value?.messages ?? [];
        const contacts = change.value?.contacts ?? [];

        for (const message of messages) {
          if (message.type !== "text" || !message.from || !message.text?.body) continue;

          const contact = contacts.find((c) => c.wa_id === message.from);
          await handleIncomingMessage(storeId, message.from, message.text.body, contact?.profile?.name);
        }
      }
    }

    // A Meta espera 200 rápido — se demorar ou responder erro, ela reenvia o webhook.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[POST /api/webhooks/whatsapp]", error);
    // Ainda respondemos 200 para não entrar em loop de reenvio por um payload
    // que não sabemos processar; o erro já fica registrado no log acima.
    return NextResponse.json({ received: true });
  }
}
