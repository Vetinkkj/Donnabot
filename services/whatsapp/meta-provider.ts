import type { WhatsAppButton, WhatsAppProvider } from "./provider";

/**
 * Provider real para a WhatsApp Business Cloud API (Meta). Não usa scraping
 * nem automação não-oficial — apenas a API HTTP documentada pela Meta.
 *
 * Requer WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no .env. Como este
 * projeto não usa credenciais reais, esta implementação não foi testada
 * contra a API de verdade — trate como um ponto de partida a validar quando
 * você tiver uma conta WhatsApp Business aprovada.
 */

const GRAPH_API_VERSION = "v20.0";

function endpoint() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID não configurado");
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
}

async function callGraphApi(body: Record<string, unknown>) {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN não configurado");

  const response = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Meta WhatsApp API respondeu ${response.status}: ${errorBody}`);
  }
}

export const metaWhatsAppProvider: WhatsAppProvider = {
  async sendText(to, text) {
    await callGraphApi({
      to,
      type: "text",
      text: { body: text },
    });
  },

  async sendButtons(to, text, buttons: WhatsAppButton[]) {
    // A API da Meta permite no máximo 3 botões de resposta rápida por mensagem.
    await callGraphApi({
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.slice(0, 3).map((button) => ({
            type: "reply",
            reply: { id: button.id, title: button.label.slice(0, 20) },
          })),
        },
      },
    });
  },

  async sendImage(to, imageUrl, caption) {
    if (imageUrl.startsWith("data:")) {
      console.warn("[meta-provider] imagem em data: URI não pode ser enviada (precisa de URL pública) — pulando imagem");
      return;
    }
    await callGraphApi({
      to,
      type: "image",
      image: { link: imageUrl, caption },
    });
  },
};
