import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentStoreId } from "@/lib/current-store";
import { handleIncomingMessage } from "@/services/conversation";

/**
 * Webhook do Twilio WhatsApp Sandbox — alternativa à Meta quando o
 * cadastro direto trava (ver services/whatsapp/twilio-provider.ts).
 * Configure esta URL em Twilio Console → Messaging → Try it out →
 * Send a WhatsApp message → Sandbox Settings → "WHEN A MESSAGE COMES IN".
 */

const TWIML_EMPTY_RESPONSE = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>";

function isSignatureValid(url: string, params: Record<string, string>, signature: string | null): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true; // sem token configurado, pula validação (dev)
  if (!signature) return false;

  const sortedData = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", authToken).update(sortedData, "utf-8").digest("base64");

  return expected === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const params = Object.fromEntries(new URLSearchParams(rawBody));

    const signature = request.headers.get("x-twilio-signature");
    const webhookUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/api/webhooks/twilio-whatsapp`
      : request.nextUrl.toString();

    if (!isSignatureValid(webhookUrl, params, signature)) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const from = params.From?.replace("whatsapp:", "");
    const body = params.Body;
    const name = params.ProfileName;

    if (from && body) {
      const storeId = await getCurrentStoreId();
      await handleIncomingMessage(storeId, from, body, name);
    }

    return new NextResponse(TWIML_EMPTY_RESPONSE, { headers: { "Content-Type": "text/xml" } });
  } catch (error) {
    console.error("[POST /api/webhooks/twilio-whatsapp]", error);
    return new NextResponse(TWIML_EMPTY_RESPONSE, { headers: { "Content-Type": "text/xml" } });
  }
}
