import type { WhatsAppProvider } from "./provider";
import { mockWhatsAppProvider } from "./mock-provider";
import { metaWhatsAppProvider } from "./meta-provider";

export function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_PROVIDER === "meta") return metaWhatsAppProvider;
  return mockWhatsAppProvider;
}

export type { WhatsAppProvider, WhatsAppButton } from "./provider";
