import type { WhatsAppButton, WhatsAppProvider } from "./provider";

/**
 * Provider via Twilio (BSP — Business Solution Provider) em vez da API
 * direta da Meta. Alternativa útil quando o cadastro direto na Meta trava
 * (ex: sem CNPJ para verificação de empresa, ou bug no "número de teste"
 * gratuito) — o Twilio Sandbox do WhatsApp funciona sem nenhuma verificação
 * de empresa.
 *
 * Requer TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_NUMBER
 * (ex: "whatsapp:+14155238886", o número do Sandbox) no .env.
 */

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

function authHeader(): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error("TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN não configurados");
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

async function sendTwilioMessage(params: Record<string, string>) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!accountSid || !from) throw new Error("TWILIO_ACCOUNT_SID/TWILIO_WHATSAPP_NUMBER não configurados");

  const body = new URLSearchParams({ From: from, ...params });

  const response = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Twilio respondeu ${response.status}: ${await response.text()}`);
  }
}

function toWhatsAppAddress(phone: string): string {
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone.startsWith("+") ? phone : `+${phone}`}`;
}

export const twilioWhatsAppProvider: WhatsAppProvider = {
  async sendText(to, text) {
    await sendTwilioMessage({ To: toWhatsAppAddress(to), Body: text });
  },

  async sendButtons(to, text, buttons: WhatsAppButton[]) {
    // O Sandbox do Twilio não tem botões interativos nativos (isso exige
    // template aprovado em conta paga) — manda como texto simples.
    const labels = buttons.map((button) => `[${button.label}]`).join(" ");
    await sendTwilioMessage({ To: toWhatsAppAddress(to), Body: `${text}\n${labels}` });
  },

  async sendImage(to, imageUrl, caption) {
    if (imageUrl.startsWith("data:")) {
      console.warn("[twilio-provider] imagem em data: URI não pode ser enviada (precisa de URL pública) — pulando imagem");
      return;
    }
    await sendTwilioMessage({ To: toWhatsAppAddress(to), Body: caption ?? "", MediaUrl: imageUrl });
  },
};
