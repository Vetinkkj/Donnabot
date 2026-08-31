import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { BRAND_NAME } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Entrar — ${BRAND_NAME}`,
};

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "E-mail ou senha incorretos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? (ERROR_MESSAGES[params.error] ?? "Não foi possível entrar.") : null;

  async function handleLogin(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: params.callbackUrl || "/dashboard",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/login?error=${error.type}`);
      }
      throw error;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <MarketingNav />
      <div className="flex flex-1 items-center justify-center p-4">
        <form
          action={handleLogin}
          className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{BRAND_NAME} — Painel Admin</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Entre com sua conta para continuar.</p>
          </div>

          {errorMessage && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {errorMessage}
            </p>
          )}

          <Input label="E-mail" name="email" type="email" required autoComplete="email" />
          <Input label="Senha" name="password" type="password" required autoComplete="current-password" />

          <Button type="submit">Entrar</Button>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Ainda não tem loja cadastrada?{" "}
            <a href="/signup" className="underline">
              Criar loja
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
