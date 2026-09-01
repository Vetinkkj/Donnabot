"use client";

import { useState } from "react";
import { PRICING } from "@/lib/marketing-config";

type Plan = "monthly" | "yearly";

/**
 * Cards de plano clicáveis — o valor selecionado vai num input escondido
 * (name="plan") dentro do <form> de cadastro, junto com o resto dos dados.
 */
export function PlanSelector({ defaultPlan = "yearly" }: { defaultPlan?: Plan }) {
  const [plan, setPlan] = useState<Plan>(defaultPlan);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="plan" value={plan} />

      <button
        type="button"
        onClick={() => setPlan("monthly")}
        aria-pressed={plan === "monthly"}
        className={`rounded-2xl border-2 bg-white p-6 text-center transition-colors dark:bg-zinc-900 ${
          plan === "monthly"
            ? "border-[#075E54] ring-2 ring-[#075E54]/20"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        }`}
      >
        <p className="text-sm font-medium text-zinc-500">Mensal</p>
        <p className="my-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          R$ {PRICING.monthly}
          <span className="text-base font-normal text-zinc-500">/mês</span>
        </p>
        <p className="text-xs text-zinc-500">{PRICING.trialDays} dias grátis pra testar</p>
      </button>

      <button
        type="button"
        onClick={() => setPlan("yearly")}
        aria-pressed={plan === "yearly"}
        className={`relative rounded-2xl border-2 bg-white p-6 text-center transition-colors dark:bg-zinc-900 ${
          plan === "yearly"
            ? "border-[#075E54] ring-2 ring-[#075E54]/20"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        }`}
      >
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#075E54] px-3 py-0.5 text-xs font-medium whitespace-nowrap text-white">
          economize 2 meses
        </span>
        <p className="text-sm font-medium text-zinc-500">Anual</p>
        <p className="my-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          R$ {PRICING.yearly.toLocaleString("pt-BR")}
          <span className="text-base font-normal text-zinc-500">/ano</span>
        </p>
        <p className="text-xs text-zinc-500">{PRICING.trialDays} dias grátis pra testar</p>
      </button>
    </div>
  );
}
