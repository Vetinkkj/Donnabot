import { z } from "zod";

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Nome da loja é obrigatório"),
  botName: z.string().trim().min(1, "Nome do bot é obrigatório"),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  logoUrl: z.string().trim().url("URL inválida").optional().or(z.literal("")),
  welcomeMessage: z.string().trim().min(1, "Mensagem inicial é obrigatória"),
  paymentMessage: z.string().trim().min(1, "Mensagem de pagamento é obrigatória"),
  orderApprovedMessage: z.string().trim().min(1, "Mensagem de pedido aprovado é obrigatória"),
  defaultMinStock: z.coerce.number().int().min(0, "Estoque mínimo não pode ser negativo"),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
