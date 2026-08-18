import type { WhatsAppButton, WhatsAppProvider } from "./provider";

/**
 * Provider via Twilio (BSP — Business Solution Provider) em vez da API
 * direta da Meta. Alternativa útil quando o cadastro direto na Meta trava
 * (ex: sem CNPJ para verificação de empresa) — o Twilio Sandbox do WhatsApp
 * funciona sem verificação de empresa (mas exige upgrade pago pra mandar
 * texto livre, veja README).
 */

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

export type TwilioProviderConfig = {
  accountSid: string;
  authToken: string;
  from: string; // ex: "whatsapp:+14155238886"
};

function toWhatsAppAddress(phone: string): string {
  return phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone.startsWith("+") ? phone : `+${phone}`}`;
}

async function sendTwilioMessage(config: TwilioProviderConfig, params: Record<string, string>) {
  const body = new URLSearchParams({ From: config.from, ...params });

  const response = await fetch(`${TWILIO_API_BASE}/Accounts/${config.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Twilio respondeu ${response.status}: ${await response.text()}`);
  }
}

/** Cria um provider configurado com as credenciais Twilio de uma loja específica. */
export function createTwilioWhatsAppProvider(config: TwilioProviderConfig): WhatsAppProvider {
  return {
    async sendText(to, text) {
      await sendTwilioMessage(config, { To: toWhatsAppAddress(to), Body: text });
    },

    async sendButtons(to, text, buttons: WhatsAppButton[]) {
      // O Sandbox do Twilio não tem botões interativos nativos (isso exige
      // template aprovado em conta paga) — manda como texto simples.
      const labels = buttons.map((button) => `[${button.label}]`).join(" ");
      await sendTwilioMessage(config, { To: toWhatsAppAddress(to), Body: `${text}\n${labels}` });
    },

    async sendImage(to, imageUrl, caption) {
      if (imageUrl.startsWith("data:")) {
        console.warn("[twilio-provider] imagem em data: URI não pode ser enviada (precisa de URL pública) — pulando imagem");
        return;
      }
      await sendTwilioMessage(config, { To: toWhatsAppAddress(to), Body: caption ?? "", MediaUrl: imageUrl });
    },
  };
}

/** Provider usando as variáveis de ambiente globais (TWILIO_ACCOUNT_SID etc.). */
export const twilioWhatsAppProvider: WhatsAppProvider = {
  async sendText(...args) {
    return resolveFromEnv().sendText(...args);
  },
  async sendButtons(...args) {
    return resolveFromEnv().sendButtons(...args);
  },
  async sendImage(...args) {
    return resolveFromEnv().sendImage(...args);
  },
};

function resolveFromEnv(): WhatsAppProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!accountSid || !authToken || !from) {
    throw new Error("TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_NUMBER não configurados");
  }
  return createTwilioWhatsAppProvider({ accountSid, authToken, from });
}
