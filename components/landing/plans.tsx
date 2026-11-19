"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { signupAction } from "@/app/signup/actions";
import { cn } from "@/lib/cn";
import { PRICING } from "@/lib/marketing-config";
import {
  PLAN_FOOTNOTE,
  PLAN_TIERS,
  TIERS,
  YEARLY_MONTHS_CHARGED,
  planId,
  yearlyPrice,
  type BillingCycle,
  type PlanTier,
} from "@/lib/plans";
import { SectionHead } from "./primitives";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const currency0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const freeMonths = 12 - YEARLY_MONTHS_CHARGED;

/** Mensal / Anual: o mesmo seletor nos cards e no cadastro. */
function CycleToggle({ cycle, onChange, className }: { cycle: BillingCycle; onChange: (c: BillingCycle) => void; className?: string }) {
  const options: { id: BillingCycle; label: string }[] = [
    { id: "monthly", label: "Mensal" },
    { id: "yearly", label: `Anual · ${freeMonths} meses grátis` },
  ];
  return (
    <div className={cn("inline-flex rounded-full border border-border p-1", className)} role="radiogroup" aria-label="Forma de cobrança">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={cycle === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all sm:px-5",
            cycle === o.id ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PriceLine({ tier, cycle }: { tier: PlanTier; cycle: BillingCycle }) {
  const monthly = TIERS[tier].monthly;
  if (cycle === "monthly") {
    return (
      <p className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{currency.format(monthly)}</span>
        <span className="text-muted-foreground">/mês</span>
      </p>
    );
  }
  const yearly = yearlyPrice(tier);
  return (
    <>
      <p className="mt-5 text-sm text-muted-foreground">
        De <span className="line-through">{currency0.format(monthly * 12)}</span> por
      </p>
      <p className="flex items-baseline gap-1">
        <span className="text-4xl font-semibold tracking-tight">{currency0.format(yearly)}</span>
        <span className="text-muted-foreground">/ano</span>
      </p>
      <p className="mt-1 text-sm text-primary">Sai por {currency.format(yearly / 12)}/mês</p>
    </>
  );
}

function Pricing({ cycle, setCycle, onPick }: { cycle: BillingCycle; setCycle: (c: BillingCycle) => void; onPick: (tier: PlanTier) => void }) {
  const go = (tier: PlanTier) => () => {
    onPick(tier);
    document.getElementById("cadastro")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <section id="planos" className="relative border-t border-border bg-surface/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Planos"
          title="Escolha como sua loja quer começar."
          sub={`Todos com a Donna completa atendendo no WhatsApp. ${PRICING.refundDays} dias de garantia com reembolso.`}
        />
        <div className="mt-10 flex justify-center">
          <CycleToggle cycle={cycle} onChange={setCycle} />
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLAN_TIERS.map((tier) => {
            const t = TIERS[tier];
            const hi = Boolean(t.highlight);
            return (
              <div
                key={tier}
                className={cn(
                  "reveal relative flex flex-col rounded-3xl border p-7",
                  hi ? "border-primary/40 bg-primary/[0.05] shadow-glow" : "border-border bg-card/50",
                )}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {t.highlight}
                  </span>
                )}
                <p className="font-semibold">Donna {t.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
                <PriceLine tier={tier} cycle={cycle} />
                <button
                  type="button"
                  onClick={go(tier)}
                  className={cn(
                    "mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all active:scale-[0.98]",
                    hi ? "bg-gradient-primary text-primary-foreground hover:brightness-110" : "border border-border hover:bg-foreground/5",
                  )}
                >
                  Escolher {t.name} <ArrowRight className="size-4" />
                </button>
                {t.includes && <p className="mt-7 text-sm font-medium">{t.includes}</p>}
                <ul className={cn("space-y-3", t.includes ? "mt-3" : "mt-7")}>
                  {t.bullets.map((f) => (
                    <li key={f} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted-foreground">{PLAN_FOOTNOTE}</p>
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
  tier,
  setTier,
  cycle,
  setCycle,
  error,
  origin,
}: {
  tier: PlanTier;
  setTier: (tier: PlanTier) => void;
  cycle: BillingCycle;
  setCycle: (c: BillingCycle) => void;
  error?: string;
  origin: "landing" | "signup";
}) {
  return (
    <section id="cadastro" className="py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div className="reveal">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">Criar minha loja</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Você escolhe o e-mail e a senha do seu acesso. Depois, é só pagar no painel e a gente ajuda a conectar o WhatsApp.
          </p>
          <CycleToggle cycle={cycle} onChange={setCycle} className="mt-8" />
          <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Plano">
            {PLAN_TIERS.map((id) => {
              const t = TIERS[id];
              const active = tier === id;
              const price = cycle === "yearly" ? `${currency0.format(yearlyPrice(id))}/ano` : `${currency.format(t.monthly)}/mês`;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTier(id)}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-2xl border px-5 py-3.5 text-left transition-all",
                    active ? "border-primary/60 bg-primary/[0.06]" : "border-border hover:border-foreground/20",
                  )}
                >
                  <span>
                    <span className="block text-sm font-semibold">Donna {t.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      Até {t.conversations.toLocaleString("pt-BR")} conversas por mês
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">{price}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {PRICING.refundDays} dias para testar com reembolso garantido. Dá pra trocar de plano depois.
          </p>
        </div>
        <form action={signupAction} className="reveal rounded-3xl border border-border bg-card/60 p-6 shadow-elegant sm:p-8">
          <input type="hidden" name="origin" value={origin} />
          <input type="hidden" name="plan" value={planId(tier, cycle)} />
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
  const [tier, setTier] = useState<PlanTier>("professional");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  return (
    <>
      <Pricing cycle={cycle} setCycle={setCycle} onPick={setTier} />
      <Signup tier={tier} setTier={setTier} cycle={cycle} setCycle={setCycle} error={error} origin={origin} />
    </>
  );
}
