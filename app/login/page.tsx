import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { ArrowRight } from "lucide-react";
import { signIn } from "@/auth";
import { Nav } from "@/components/landing/hero";
import { Logo } from "@/components/landing/primitives";
import { Footer } from "@/components/landing/sections";
import { BRAND_NAME } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Entrar — ${BRAND_NAME}`,
};

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "E-mail ou senha incorretos.",
};

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-background/60 px-4 text-sm outline-hidden transition-colors focus:border-primary/60 focus:ring-3 focus:ring-primary/20";

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
    <div className="landing flex flex-col">
      <Nav />
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 pb-24 pt-32 sm:pt-40">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-glow blur-3xl" />
        <form
          action={handleLogin}
          className="relative w-full max-w-sm rounded-3xl border border-border bg-card/60 p-6 shadow-elegant sm:p-8"
        >
          <Logo className="text-lg" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Entrar no painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre com sua conta para continuar.</p>

          {errorMessage && (
            <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}

          <label className="mt-6 block">
            <span className="mb-1.5 block text-sm font-medium">E-mail</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium">Senha</span>
            <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
          </label>

          <button
            type="submit"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Entrar <ArrowRight className="size-4" />
          </button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Ainda não tem loja cadastrada?{" "}
            <a href="/signup" className="text-foreground underline">
              Criar loja
            </a>
          </p>
        </form>
      </main>
      <Footer />
    </div>
  );
}
