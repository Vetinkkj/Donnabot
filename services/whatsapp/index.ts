import type { WhatsAppProvider } from "./provider";
import { mockWhatsAppProvider } from "./mock-provider";
import { metaWhatsAppProvider, createMetaWhatsAppProvider } from "./meta-provider";
import { twilioWhatsAppProvider, createTwilioWhatsAppProvider } from "./twilio-provider";

/** Provider usando só as variáveis de ambiente globais (modo single-store). */
export function getWhatsAppProvider(): WhatsAppProvider {
  if (process.env.WHATSAPP_PROVIDER === "meta") return metaWhatsAppProvider;
  if (process.env.WHATSAPP_PROVIDER === "twilio") return twilioWhatsAppProvider;
  return mockWhatsAppProvider;
}

export type ResolvedWhatsAppConfig =
  | { provider: "mock" }
  | { provider: "meta"; token: string; phoneNumberId: string }
  | { provider: "twilio"; accountSid: string; authToken: string; from: string };

/** Provider a partir de uma configuração já resolvida (ex: credenciais de uma loja específica). */
export function getWhatsAppProviderFor(config: ResolvedWhatsAppConfig): WhatsAppProvider {
  if (config.provider === "meta") {
    return createMetaWhatsAppProvider({ token: config.token, phoneNumberId: config.phoneNumberId });
  }
  if (config.provider === "twilio") {
    return createTwilioWhatsAppProvider({ accountSid: config.accountSid, authToken: config.authToken, from: config.from });
  }
  return mockWhatsAppProvider;
}

export type { WhatsAppProvider, WhatsAppButton } from "./provider";
