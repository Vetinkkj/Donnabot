import type { WhatsAppProvider } from "./provider";
import { mockWhatsAppProvider } from "./mock-provider";
import { metaWhatsAppProvider } from "./meta-provider";
import { twilioWhatsAppProvider } from "./twilio-provider";

export function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_PROVIDER === "meta") return metaWhatsAppProvider;
  if (process.env.WHATSAPP_PROVIDER === "twilio") return twilioWhatsAppProvider;
  return mockWhatsAppProvider;
}

export type { WhatsAppProvider, WhatsAppButton } from "./provider";
