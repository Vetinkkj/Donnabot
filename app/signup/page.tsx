import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signupSchema } from "@/lib/validations/auth";
import { createStoreWithOwner } from "@/services/store";

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <form
        action={handleSignup}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Criar loja no BOTloja</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre sua loja e crie seu acesso de dono — você escolhe o e-mail e a senha.
          </p>
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
    </div>
  );
}
