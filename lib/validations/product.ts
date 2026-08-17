import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  categoryName: optionalText,
  brand: optionalText,
  model: optionalText,
  compatibility: optionalText,
  description: optionalText,
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  stockQuantity: z.coerce
    .number()
    .int("Estoque deve ser um número inteiro")
    .min(0, "Estoque não pode ser negativo"),
  minStock: z.coerce
    .number()
    .int("Estoque mínimo deve ser um número inteiro")
    .min(0, "Estoque mínimo não pode ser negativo"),
  sku: z.string().trim().min(1, "SKU é obrigatório"),
  imageUrl: z
    .string()
    .trim()
    .url("URL de imagem inválida")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  active: z.coerce.boolean().optional().default(true),
});

export const productUpdateSchema = productInputSchema.partial();

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
