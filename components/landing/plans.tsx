"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { signupAction } from "@/app/signup/actions";
import { cn } from "@/lib/cn";
import { PRICING } from "@/lib/marketing-config";
import { SectionHead } from "./primitives";

type Plan = "monthly" | "yearly";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const yearlySavings = PRICING.monthly * 12 - PRICING.yearly;

const PLANS = [
  {
    id: "monthly" as Plan,
    name: "Mensal",
    price: currency.format(PRICING.monthly),
    per: "/mês",
    cta: "Começar agora",
    note: "Cobrança mensal",
  },
  {
    id: "yearly" as Plan,
    name: "Anual",
    price: currency.format(PRICING.yearly),
    per: "/ano",
    cta: "Escolher plano anual",
    note: `Economize ${currency.format(yearlySavings)}, o equivalente a 2 mensalidades`,
  },
];

function Pricing({ onPick }: { onPick: (plan: Plan) => void }) {
  const features = [
    `Garantia de ${PRICING.refundDays} dias: não gostou, devolvemos o valor`,
    "Acesso às funcionalidades do plano atual",
    "Configuração assistida pela equipe",
  ];
  const go = (plan: Plan) => () => {
    onPick(plan);
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section id="planos" className="relative border-t border-border bg-surface/40 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Planos"
          title="Escolha como sua loja quer começar."
          sub={`Experimente a Donnabot por ${PRICING.refundDays} dias com reembolso garantido.`}
        />
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {PLANS.map((p) => {
            const hi = p.id === "yearly";
            return (
              <div
                key={p.id}
                className={cn(
                  "reveal relative rounded-3xl border p-8",
                  hi ? "border-primary/40 bg-primary/[0.05] shadow-glow" : "border-border bg-card/50",
                )}
              >
                {hi && (
                  <span className="absolute -top-3 left-8 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    2 meses de economia
                  </span>
                )}
                <p className="font-medium text-muted-foreground">{p.name}</p>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tight">{p.price}</span>
                  <span className="text-muted-foreground">{p.per}</span>
                </p>
                <p className={cn("mt-2 text-sm", hi ? "text-primary" : "text-muted-foreground")}>{p.note}</p>
                <ul className="mt-8 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <Check className="size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={go(p.id)}
                  className={cn(
                    "mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all active:scale-[0.98]",
                    hi ? "bg-gradient-primary text-primary-foreground hover:brightness-110" : "border border-border hover:bg-foreground/5",
                  )}
                >
                  {p.cta} <ArrowRight className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const fields = [
  ["storeName", "Nome da loja", "text", undefined],
  ["ownerName", "Seu nome", "text", "name"],
  ["email", "E-mail", "email", "email"],
  ["password", "Senha (mínimo 8 caracteres)", "password", "new-password"],
  ["confirmPassword", "Confirmar senha", "password", "new-password"],
] as const;

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-background/60 px-4 text-sm outline-hidden transition-colors focus:border-primary/60 focus:ring-3 focus:ring-primary/20";

/** Formulário de cadastro real: envia para o mesmo cadastro da página /signup. */
function Signup({
  plan,
  setPlan,
  error,
  origin,
}: {
  plan: Plan;
  setPlan: (plan: Plan) => void;
  error?: string;
  origin: "landing" | "signup";
}) {
  return (
    <section id="cadastro" className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div className="reveal">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">Criar minha loja</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Você escolhe o e-mail e a senha do seu acesso. Depois, nossa equipe confirma o plano e ajuda a conectar o
            WhatsApp.
          </p>
          <div className="mt-8 inline-flex flex-wrap rounded-full border border-border p-1" role="radiogroup" aria-label="Plano">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={plan === p.id}
                onClick={() => setPlan(p.id)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-all",
                  plan === p.id ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.name} · {p.price}
                {p.per}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {PRICING.refundDays} dias para testar com reembolso garantido. Dá pra trocar de plano depois com a gente.
          </p>
        </div>
        <form action={signupAction} className="reveal rounded-3xl border border-border bg-card/60 p-6 shadow-elegant sm:p-8">
          <input type="hidden" name="origin" value={origin} />
          <input type="hidden" name="plan" value={plan} />
          {fields.map(([name, label, type, autoComplete]) => (
            <label key={name} className="mb-4 block">
              <span className="mb-1.5 block text-sm font-medium">{label}</span>
              <input
                name={name}
                type={type}
                required
                minLength={type === "password" ? 8 : undefined}
                autoComplete={autoComplete}
                className={inputClass}
              />
            </label>
          ))}
          <label className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="acceptTerms" required className="mt-1 accent-primary" />
            <span>
              Li e aceito os{" "}
              <a href="/termos" target="_blank" className="text-foreground underline">
                Termos de Uso
              </a>{" "}
              e a{" "}
              <a href="/privacidade" target="_blank" className="text-foreground underline">
                Política de Privacidade
              </a>
              .
            </span>
          </label>
          {error && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Criar minha loja <ArrowRight className="size-4" />
          </button>
          <p id="entrar" className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <a href="/login" className="text-foreground underline">
              Entrar
            </a>
          </p>
        </form>
      </div>
    </section>
  );
}

/** Planos + cadastro dividem o plano escolhido (clicar num card já marca no formulário). */
export function PlansAndSignup({ error, origin = "landing" }: { error?: string; origin?: "landing" | "signup" }) {
  const [plan, setPlan] = useState<Plan>("yearly");
  return (
    <>
      <Pricing onPick={setPlan} />
      <Signup plan={plan} setPlan={setPlan} error={error} origin={origin} />
    </>
  );
}
