"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { signupSchema } from "@/lib/validations/auth";
import { createStoreWithOwner } from "@/services/store";
import { isRateLimited } from "@/lib/rate-limit";

const KNOWN_SIGNUP_ERRORS = new Set(["Já existe uma conta com esse e-mail"]);

/**
 * Cadastro público de loja — usado pela página /signup e pelo formulário da
 * página inicial. O campo oculto `origin` diz para onde voltar com o erro.
 */
export async function signupAction(formData: FormData) {
  const errorUrl = (message: string) =>
    formData.get("origin") === "landing"
      ? `/?erro=${encodeURIComponent(message)}#cadastro`
      : `/signup?error=${encodeURIComponent(message)}`;

  // Contra cadastro em massa por robô: 5 cadastros por IP a cada hora.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  if (isRateLimited(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    redirect(errorUrl("Muitos cadastros em pouco tempo. Tente de novo mais tarde."));
  }

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
    // Só repassa mensagens nossas — erro interno (ex: do banco) não vai pra URL.
    if (!(error instanceof Error && KNOWN_SIGNUP_ERRORS.has(error.message))) console.error("[signupAction]", error);
    redirect(
      errorUrl(error instanceof Error && KNOWN_SIGNUP_ERRORS.has(error.message) ? error.message : "Erro ao criar loja")
    );
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
