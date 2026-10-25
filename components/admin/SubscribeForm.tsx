"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PRICING } from "@/lib/marketing-config";

type Plan = "monthly" | "yearly";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const PLANS: { id: Plan; label: string; price: string; note: string }[] = [
  { id: "monthly", label: "Mensal", price: `${currency.format(PRICING.monthly)}/mês`, note: "Cobrança todo mês" },
  {
    id: "yearly",
    label: "Anual",
    price: `${currency.format(PRICING.yearly)}/ano`,
    note: `2 meses grátis — economize ${currency.format(PRICING.monthly * 12 - PRICING.yearly)}`,
  },
];

/** Assinatura pelo Asaas: o lojista escolhe o plano e paga na fatura (Pix, boleto ou cartão). */
export function SubscribeForm({ defaultPlan }: { defaultPlan: Plan }) {
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cpfCnpj }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao gerar a cobrança");
        setLoading(false);
        return;
      }
      window.location.href = json.data.invoiceUrl;
    } catch {
      setError("Erro de conexão. Tente de novo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">Plano</legend>
        {PLANS.map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
              plan === p.id
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          >
            <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} />
            <span className="flex-1">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.label}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">{p.note}</span>
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">{p.price}</span>
          </label>
        ))}
      </fieldset>

      <Input
        label="CPF ou CNPJ de quem paga"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Só os números"
        value={cpfCnpj}
        onChange={(e) => setCpfCnpj(e.target.value)}
        required
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Gerando cobrança..." : "Ir para o pagamento"}
      </Button>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Você paga com Pix, boleto ou cartão na página segura do Asaas. Pix e cartão liberam a loja na hora; boleto,
        em até 1 dia útil. Depois de pagar, volte aqui e atualize a página. Garantia de {PRICING.refundDays} dias.
      </p>
    </form>
  );
}
