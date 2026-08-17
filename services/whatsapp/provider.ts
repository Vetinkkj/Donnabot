export type WhatsAppButton = { id: string; label: string };

export interface WhatsAppProvider {
  sendText(to: string, text: string): Promise<void>;
  sendButtons(to: string, text: string, buttons: WhatsAppButton[]): Promise<void>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<void>;
}
