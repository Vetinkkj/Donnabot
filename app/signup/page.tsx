import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signupSchema } from "@/lib/validations/auth";
import { createStoreWithOwner } from "@/services/store";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { BRAND_NAME, PRICING } from "@/lib/marketing-config";

export const metadata: Metadata = {
  title: `Cadastre sua loja — ${BRAND_NAME}`,
  description: "Crie sua conta e coloque a Donna pra atender sua loja no WhatsApp.",
};

const STEPS = [
  {
    number: "1",
    title: "Crie sua conta",
    description: "Nome da loja, seu nome, e-mail e senha — você escolhe tudo, leva menos de 1 minuto.",
  },
  {
    number: "2",
    title: "Ative seu plano",
    description: `Fale com a gente pra confirmar o pagamento. Você começa com ${PRICING.trialDays} dias grátis pra testar.`,
  },
  {
    number: "3",
    title: "Conecte seu WhatsApp",
    description: "A gente te ajuda a conectar o número da loja e cadastrar seus produtos — a Donna já começa a atender.",
  },
];

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  async function handleSignup(formData: FormData) {
    "use server";

    const parsed = signupSchema.safeParse({
      storeName: formData.get("storeName"),
      ownerName: formData.get("ownerName"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
      redirect(`/signup?error=${encodeURIComponent(message)}`);
    }

    try {
      await createStoreWithOwner(parsed.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar loja";
      redirect(`/signup?error=${encodeURIComponent(message)}`);
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

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <MarketingNav />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 md:py-20">
          <h1 className="mb-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50 md:text-4xl">
            Coloque a Donna pra atender sua loja
          </h1>
          <p className="mx-auto max-w-xl text-zinc-600 dark:text-zinc-400">
            Três passos simples pra sua loja começar a vender pelo WhatsApp sozinha.
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-12 md:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#075E54] text-sm font-semibold text-white">
                  {step.number}
                </div>
                <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-50">{step.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preços */}
        <section className="border-y border-zinc-100 bg-zinc-50 py-12 dark:border-zinc-900 dark:bg-zinc-950">
          <div className="mx-auto grid max-w-2xl gap-4 px-4 sm:grid-cols-2 md:px-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-500">Mensal</p>
              <p className="my-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                R$ {PRICING.monthly}
                <span className="text-base font-normal text-zinc-500">/mês</span>
              </p>
              <p className="text-xs text-zinc-500">{PRICING.trialDays} dias grátis pra testar</p>
            </div>
            <div className="relative rounded-2xl border-2 border-[#075E54] bg-white p-6 text-center dark:bg-zinc-900">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#075E54] px-3 py-0.5 text-xs font-medium text-white">
                economize 2 meses
              </span>
              <p className="text-sm font-medium text-zinc-500">Anual</p>
              <p className="my-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                R$ {PRICING.yearly.toLocaleString("pt-BR")}
                <span className="text-base font-normal text-zinc-500">/ano</span>
              </p>
              <p className="text-xs text-zinc-500">{PRICING.trialDays} dias grátis pra testar</p>
            </div>
          </div>
        </section>

        {/* Formulário */}
        <section className="mx-auto max-w-sm px-4 py-16 md:px-6">
          <form
            action={handleSignup}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Criar minha loja</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Você escolhe o e-mail e a senha do seu acesso.</p>
            </div>

            {params.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {params.error}
              </p>
            )}

            <Input label="Nome da loja" name="storeName" required />
            <Input label="Seu nome" name="ownerName" required autoComplete="name" />
            <Input label="E-mail" name="email" type="email" required autoComplete="email" />
            <Input label="Senha" name="password" type="password" required minLength={8} autoComplete="new-password" />
            <Input
              label="Confirmar senha"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Button type="submit">Criar loja</Button>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Já tem conta?{" "}
              <a href="/login" className="underline">
                Entrar
              </a>
            </p>
          </form>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
