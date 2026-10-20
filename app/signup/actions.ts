"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { signupSchema } from "@/lib/validations/auth";
import { createStoreWithOwner } from "@/services/store";

/**
 * Cadastro público de loja — usado pela página /signup e pelo formulário da
 * página inicial. O campo oculto `origin` diz para onde voltar com o erro.
 */
export async function signupAction(formData: FormData) {
  const errorUrl = (message: string) =>
    formData.get("origin") === "landing"
      ? `/?erro=${encodeURIComponent(message)}#cadastro`
      : `/signup?error=${encodeURIComponent(message)}`;

  const parsed = signupSchema.safeParse({
    storeName: formData.get("storeName"),
    ownerName: formData.get("ownerName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    plan: formData.get("plan") || undefined,
    acceptTerms: formData.get("acceptTerms"),
  });

  if (!parsed.success) {
    redirect(errorUrl(parsed.error.issues[0]?.message ?? "Dados inválidos"));
  }

  try {
    await createStoreWithOwner(parsed.data);
  } catch (error) {
    redirect(errorUrl(error instanceof Error ? error.message : "Erro ao criar loja"));
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${error.type}`);
    }
    throw error;
  }
}
