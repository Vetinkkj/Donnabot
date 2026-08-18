import { z } from "zod";

export const metaIntegrationSchema = z.object({
  provider: z.literal("meta"),
  token: z.string().trim().min(1, "Token de acesso é obrigatório"),
  phoneNumberId: z.string().trim().min(1, "Phone Number ID é obrigatório"),
  businessAccountId: z.string().trim().optional().or(z.literal("")),
  appSecret: z.string().trim().optional().or(z.literal("")),
});

export const twilioIntegrationSchema = z.object({
  provider: z.literal("twilio"),
  accountSid: z.string().trim().min(1, "Account SID é obrigatório"),
  authToken: z.string().trim().min(1, "Auth Token é obrigatório"),
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "Número do WhatsApp é obrigatório")
    .transform((value) => (value.startsWith("whatsapp:") ? value : `whatsapp:${value.startsWith("+") ? value : `+${value}`}`)),
});

export const saveWhatsAppIntegrationSchema = z.discriminatedUnion("provider", [
  metaIntegrationSchema,
  twilioIntegrationSchema,
]);

export type SaveWhatsAppIntegrationInput = z.infer<typeof saveWhatsAppIntegrationSchema>;
