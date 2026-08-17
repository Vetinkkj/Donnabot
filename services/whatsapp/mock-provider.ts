import type { WhatsAppButton, WhatsAppProvider } from "./provider";

/**
 * Provider "mock": não envia nada de verdade. O histórico da conversa já é
 * salvo no banco pelo services/conversation, então aqui só simulamos a
 * entrega (log no console) — útil para acompanhar o fluxo durante o
 * desenvolvimento sem precisar de uma conta WhatsApp Business real.
 */
export const mockWhatsAppProvider: WhatsAppProvider = {
  async sendText(to, text) {
    console.log(`[mock-whatsapp] -> ${to}: ${text}`);
  },
  async sendButtons(to, text, buttons: WhatsAppButton[]) {
    const labels = buttons.map((b) => `[${b.label}]`).join(" ");
    console.log(`[mock-whatsapp] -> ${to}: ${text} ${labels}`);
  },
  async sendImage(to, imageUrl, caption) {
    console.log(`[mock-whatsapp] -> ${to}: (imagem: ${imageUrl}) ${caption ?? ""}`);
  },
};
