import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const signupSchema = z
  .object({
    storeName: z.string().trim().min(1, "Nome da loja é obrigatório"),
    ownerName: z.string().trim().min(1, "Seu nome é obrigatório"),
    email: z.string().trim().email("E-mail inválido"),
    password: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
    // Plano escolhido nos cards do site — opcional, só um indicativo.
    plan: z.enum(["monthly", "yearly"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(8, "Senha precisa ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "A nova senha precisa ser diferente da atual",
    path: ["newPassword"],
  });
