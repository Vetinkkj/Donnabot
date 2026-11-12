"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Barcode,
  Check,
  CircleCheck,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/Input";
import { PRICING } from "@/lib/marketing-config";

type Plan = "monthly" | "yearly";
type Method = "PIX" | "CREDIT_CARD" | "BOLETO";

type CheckoutResult =
  | { method: "PIX"; value: number; dueDate: string; invoiceUrl: string; qrCodeImage: string; copyPaste: string; expiresAt: string | null }
  | { method: "CREDIT_CARD" | "BOLETO"; value: number; dueDate: string; invoiceUrl: string };

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const PLANS: Record<Plan, { label: string; price: number; per: string; listPrice: number; badge: string; note: string }> = {
  monthly: {
    label: "Mensal",
    price: PRICING.monthly,
    per: "/mês",
    listPrice: PRICING.monthlyListPrice,
    badge: `-${Math.round((1 - PRICING.monthly / PRICING.monthlyListPrice) * 100)}%`,
    note: "Renova todo mês. Cancele quando quiser.",
  },
  yearly: {
    label: "Anual",
    price: PRICING.yearly,
    per: "/ano",
    listPrice: PRICING.monthly * 12,
    badge: "2 meses grátis",
    note: `Sai por ${brl0.format(Math.round(PRICING.yearly / 12))}/mês. Economize ${brl0.format(PRICING.monthly * 12 - PRICING.yearly)}.`,
  },
};

const METHODS: { id: Method; label: string; hint: string; icon: typeof QrCode }[] = [
  { id: "PIX", label: "Pix", hint: "Libera na hora", icon: QrCode },
  { id: "CREDIT_CARD", label: "Cartão de crédito", hint: "Libera na hora", icon: CreditCard },
  { id: "BOLETO", label: "Boleto", hint: "Libera em até 2 dias úteis", icon: Barcode },
];

const INCLUDED = [
  "Donna atendendo no WhatsApp 24 horas",
  "Painel com pedidos, estoque e vendas",
  "Configuração assistida pela equipe",
];

/** 000.000.000-00 ou 00.000.000/0000-00, conforme a quantidade de dígitos. */
function maskDocument(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2.5 text-sm font-semibold text-zinc-100">
        <span className="grid size-6 place-items-center rounded-full bg-white/[0.07] text-xs text-zinc-300">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Pix na própria tela: QR Code, copia e cola e confirmação automática. */
function PixPayment({ result, onBack }: { result: Extract<CheckoutResult, { method: "PIX" }>; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (paid) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/billing/status", { cache: "no-store" });
        const json = await res.json();
        if (json.data?.active) setPaid(true);
      } catch {
        // rede instável: tenta de novo no próximo ciclo
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [paid]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  if (paid) {
    return (
      <div className="dash-enter flex flex-col items-center gap-3 py-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CircleCheck className="size-7" aria-hidden />
        </span>
        <p className="text-lg font-semibold text-zinc-50">Pagamento confirmado!</p>
        <p className="max-w-xs text-sm text-zinc-400">Sua loja está liberada. A Donna já pode atender seus clientes.</p>
        <Button className="mt-2" onClick={() => window.location.reload()}>
          Entrar no painel
        </Button>
      </div>
    );
  }

  return (
    <div className="dash-enter flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 self-start text-[13px] text-zinc-500 hover:text-zinc-200"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Escolher outra forma de pagamento
      </button>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="rounded-2xl bg-white p-3 shadow-lg shadow-black/30">
          {/* QR Code gerado pelo Asaas (imagem base64) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${result.qrCodeImage}`} alt="QR Code Pix para pagar a assinatura" className="size-48" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <p className="text-sm text-zinc-400">Valor</p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-50">{brl.format(result.value)}</p>
          </div>
          <ol className="list-decimal space-y-1 pl-4 text-[13px] text-zinc-400">
            <li>Abra o app do seu banco e escolha pagar com Pix.</li>
            <li>Aponte a câmera para o QR Code ou use o código abaixo.</li>
            <li>Pronto: esta tela confirma sozinha em alguns segundos.</li>
          </ol>
          <div className="flex gap-2">
            <input readOnly value={result.copyPaste} aria-label="Código Pix copia e cola" className={cn(fieldClass, "font-mono text-xs")} onFocus={(e) => e.target.select()} />
            <Button type="button" variant="secondary" onClick={copy} className="shrink-0">
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      </div>
      <p className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] px-4 py-3 text-sm text-zinc-300" aria-live="polite">
        <Loader2 className="size-4 text-emerald-400 motion-safe:animate-spin" aria-hidden />
        Aguardando o pagamento…
      </p>
    </div>
  );
}

/** Boleto: abre o boleto e explica o prazo de compensação. */
function BoletoPayment({ result, onBack }: { result: CheckoutResult; onBack: () => void }) {
  return (
    <div className="dash-enter flex flex-col gap-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 self-start text-[13px] text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="size-3.5" aria-hidden />
        Escolher outra forma de pagamento
      </button>
      <p className="text-lg font-semibold text-zinc-50">Seu boleto de {brl.format(result.value)} está pronto</p>
      <p className="text-sm leading-relaxed text-zinc-400">
        Depois de pago, o banco leva até 2 dias úteis para confirmar. Assim que confirmar, a loja é liberada
        automaticamente e você recebe o aviso por e-mail.
      </p>
      <a
        href={result.invoiceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-400"
      >
        Abrir boleto
        <ExternalLink className="size-4" aria-hidden />
      </a>
      <p className="text-xs text-zinc-500">Quer liberar agora? Volte e pague com Pix ou cartão.</p>
    </div>
  );
}

/** Checkout da assinatura (Asaas): plano, CPF/CNPJ e forma de pagamento, com resumo ao lado. */
export function SubscribeForm({ defaultPlan, storeName }: { defaultPlan: Plan; storeName: string }) {
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [method, setMethod] = useState<Method>("PIX");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const selected = PLANS[plan];
  const digits = document.replace(/\D/g, "");
  const validDocument = digits.length === 11 || digits.length === 14;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validDocument) {
      setError("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).");
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cpfCnpj: digits, method }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível gerar a cobrança");
      const data = json.data as CheckoutResult;
      // Cartão: os dados são digitados na página segura do Asaas, nunca aqui.
      if (data.method === "CREDIT_CARD") {
        window.location.href = data.invoiceUrl;
        return;
      }
      setResult(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro de conexão. Tente de novo.");
      setLoading(false);
    }
  }

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-5 sm:p-7">
        {result?.method === "PIX" ? (
          <PixPayment result={result} onBack={() => setResult(null)} />
        ) : result?.method === "BOLETO" ? (
          <BoletoPayment result={result} onBack={() => setResult(null)} />
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
            <Step n={1} title="Escolha o plano">
              <div role="radiogroup" aria-label="Plano" className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(PLANS) as Plan[]).map((id) => {
                  const p = PLANS[id];
                  const active = plan === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPlan(id)}
                      className={cn(
                        "relative flex flex-col items-start rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500",
                        active ? "border-emerald-500/60 bg-emerald-500/[0.06]" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-200">{p.label}</span>
                        <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300">{p.badge}</span>
                      </span>
                      <span className="mt-2 text-xs text-zinc-500 line-through">{brl0.format(p.listPrice)}</span>
                      <span className="text-2xl font-semibold tabular-nums text-zinc-50">
                        {brl0.format(p.price)}
                        <span className="text-sm font-normal text-zinc-500">{p.per}</span>
                      </span>
                      <span className="mt-1 text-xs text-zinc-400">{p.note}</span>
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step n={2} title="Dados de quem paga">
              <label className="flex flex-col gap-1.5 sm:max-w-xs">
                <span className="text-[13px] font-medium text-zinc-300">CPF ou CNPJ</span>
                <input
                  value={document}
                  onChange={(e) => setDocument(maskDocument(e.target.value))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  className={fieldClass}
                  aria-invalid={error && !validDocument ? true : undefined}
                />
                <span className="text-xs text-zinc-500">Exigido pelo Asaas para emitir a cobrança.</span>
              </label>
            </Step>

            <Step n={3} title="Forma de pagamento">
              <div role="radiogroup" aria-label="Forma de pagamento" className="grid gap-2 sm:grid-cols-3">
                {METHODS.map((m) => {
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 sm:flex-col sm:items-start sm:gap-2",
                        active ? "border-emerald-500/60 bg-emerald-500/[0.06]" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <m.icon className={cn("size-5", active ? "text-emerald-400" : "text-zinc-500")} aria-hidden />
                      <span>
                        <span className="block text-sm font-medium text-zinc-100">{m.label}</span>
                        <span className="block text-xs text-zinc-500">{m.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {method === "CREDIT_CARD" && (
                <p className="text-xs text-zinc-500">Você vai para a página segura do Asaas para digitar os dados do cartão.</p>
              )}
            </Step>

            {error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

            <Button type="submit" loading={loading} className="h-12 text-[15px]">
              {method === "PIX" ? "Gerar Pix" : method === "CREDIT_CARD" ? "Pagar com cartão" : "Gerar boleto"} · {brl.format(selected.price)}
            </Button>
          </form>
        )}
      </div>

      <aside className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-zinc-900/30 p-5 lg:sticky lg:top-8 lg:self-start">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Resumo</p>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-zinc-300">Donnabot · {selected.label}</span>
          <span className="text-sm text-zinc-500 line-through">{brl0.format(selected.listPrice)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] pb-4">
          <span className="text-sm text-zinc-500">Loja</span>
          <span className="truncate text-sm text-zinc-300">{storeName}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-zinc-100">Total hoje</span>
          <span className="text-xl font-semibold tabular-nums text-zinc-50">{brl.format(selected.price)}</span>
        </div>
        <ul className="flex flex-col gap-2 border-t border-white/[0.06] pt-4">
          {INCLUDED.map((item) => (
            <li key={item} className="flex gap-2 text-[13px] text-zinc-400">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <div className="flex gap-2.5 rounded-xl bg-emerald-500/[0.07] p-3 text-[13px] leading-relaxed text-emerald-100/90">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
          <span>
            <strong className="font-semibold">Garantia de {PRICING.refundDays} dias.</strong> Não gostou? Devolvemos o valor
            integral.
          </span>
        </div>
        <p className="text-xs text-zinc-600">Pagamento processado pelo Asaas. Seus dados de cartão não passam pela Donnabot.</p>
      </aside>
    </div>
  );
}
