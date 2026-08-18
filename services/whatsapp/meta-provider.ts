import type { WhatsAppButton, WhatsAppProvider } from "./provider";

/**
 * Provider real para a WhatsApp Business Cloud API (Meta). Não usa scraping
 * nem automação não-oficial — apenas a API HTTP documentada pela Meta.
 *
 * Como este projeto não usa credenciais reais por padrão, esta
 * implementação não foi testada contra a API de verdade — trate como um
 * ponto de partida a validar quando você tiver uma conta WhatsApp Business
 * aprovada.
 */

const GRAPH_API_VERSION = "v20.0";

export type MetaProviderConfig = {
  token: string;
  phoneNumberId: string;
};

async function callGraphApi(config: MetaProviderConfig, body: Record<string, unknown>) {
  const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Meta WhatsApp API respondeu ${response.status}: ${errorBody}`);
  }
}

/** Cria um provider configurado com o token/phoneNumberId de uma loja específica. */
export function createMetaWhatsAppProvider(config: MetaProviderConfig): WhatsAppProvider {
  return {
    async sendText(to, text) {
      await callGraphApi(config, { to, type: "text", text: { body: text } });
    },

    async sendButtons(to, text, buttons: WhatsAppButton[]) {
      // A API da Meta permite no máximo 3 botões de resposta rápida por mensagem.
      await callGraphApi(config, {
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
      await callGraphApi(config, { to, type: "image", image: { link: imageUrl, caption } });
    },
  };
}

/** Provider usando as variáveis de ambiente globais (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID). */
export const metaWhatsAppProvider: WhatsAppProvider = {
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
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID não configurados");
  }
  return createMetaWhatsAppProvider({ token, phoneNumberId });
}
