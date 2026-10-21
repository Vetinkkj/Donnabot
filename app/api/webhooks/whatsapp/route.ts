import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { handleIncomingMessage, handleOwnerReplyFromPhone } from "@/services/conversation";
import { getStoreByWhatsappPhoneNumberId } from "@/services/store";

/**
 * Webhook real da WhatsApp Business Cloud API (Meta). Enquanto
 * WHATSAPP_PROVIDER="mock", use /api/mock/whatsapp para testar — este
 * endpoint só entra em ação quando você configurar uma conta WhatsApp
 * Business de verdade e registrar esta URL no painel da Meta.
 *
 * Multi-tenant: uma única URL de webhook atende todas as lojas conectadas
 * (via Tech Provider / Embedded Signup, todas usam o mesmo App da Meta). A
 * loja é descoberta pelo `phone_number_id` presente no payload
 * (`entry[].changes[].value.metadata.phone_number_id`); se a loja não tiver
 * número próprio cadastrado, cai no fallback single-store (getCurrentStoreId).
 *
 * Coexistência: além de `messages` (cliente → loja), chegam `message_echoes`
 * (lojista respondendo pelo app no celular), que pausam a Donna naquela
 * conversa. `history` e `smb_app_state_sync` são ignorados por enquanto.
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
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
          interactive?: { type?: string; button_reply?: { id?: string; title?: string } };
          button?: { text?: string; payload?: string };
        }>;
        // Coexistência (field "smb_message_echoes"): o que o lojista mandou
        // pelo app no celular. Aqui `from` é a loja e `to` é o cliente.
        message_echoes?: Array<{ to?: string; type?: string; text?: { body?: string } }>;
      };
    }>;
  }>;
};

type MetaIncomingMessage = NonNullable<
  NonNullable<NonNullable<NonNullable<MetaWebhookPayload["entry"]>[number]["changes"]>[number]["value"]>["messages"]
>[number];

/**
 * Texto que a Donna deve interpretar. Toque em botão de resposta rápida chega
 * como `interactive.button_reply` — usamos o `id`, que é a frase que o NLU já
 * entende (ex: "adicionar ao carrinho"); `button` é o equivalente vindo de
 * template. Outros tipos (áudio, imagem...) são ignorados.
 */
function extractMessageText(message: MetaIncomingMessage): string | undefined {
  if (message.type === "text") return message.text?.body;
  if (message.type === "interactive") return message.interactive?.button_reply?.id ?? message.interactive?.button_reply?.title;
  if (message.type === "button") return message.button?.payload ?? message.button?.text;
  return undefined;
}

function isSignatureValid(rawBody: string, signatureHeader: string | null): boolean {
  // A Meta assina com o segredo do app — o mesmo META_APP_SECRET do Embedded Signup.
  const secret = process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET;
  // Sem segredo só em dev/mock; em produção, recusa tudo (senão qualquer um
  // poderia forjar mensagens de clientes e fazer a Donna responder).
  if (!secret) return process.env.NODE_ENV !== "production";
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

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const phoneNumberId = change.value?.metadata?.phone_number_id;
        const store = phoneNumberId ? await getStoreByWhatsappPhoneNumberId(phoneNumberId) : null;
        // Número sem loja só cai na loja padrão se for o número global do .env
        // (modo single-store). Qualquer outro é ignorado: nunca misturar a
        // conversa de um número desconhecido com os dados de outra loja.
        const isDefaultNumber = !!phoneNumberId && phoneNumberId === process.env.WHATSAPP_PHONE_NUMBER_ID;
        const storeId = store?.id ?? (isDefaultNumber ? await getCurrentStoreId() : null);
        if (!storeId) {
          console.warn("[POST /api/webhooks/whatsapp] phone_number_id sem loja, ignorado:", phoneNumberId);
          continue;
        }

        const messages = change.value?.messages ?? [];
        const contacts = change.value?.contacts ?? [];

        for (const message of messages) {
          const text = extractMessageText(message);
          if (!message.from || !text) continue;

          const contact = contacts.find((c) => c.wa_id === message.from);
          await handleIncomingMessage(storeId, message.from, text, contact?.profile?.name);
        }

        // Lojista respondeu pelo celular → Donna pausa essa conversa.
        for (const echo of change.value?.message_echoes ?? []) {
          if (!echo.to) continue;
          const text = echo.type === "text" && echo.text?.body ? echo.text.body : `[${echo.type ?? "mensagem"} enviada pelo celular]`;
          await handleOwnerReplyFromPhone(storeId, echo.to, text);
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
