import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Info, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

// Peças visuais compartilhadas do painel (dashboard e demais páginas). Sem
// estado próprio: funcionam em componentes de servidor e de cliente.

export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
export const integer = new Intl.NumberFormat("pt-BR");
export const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Superfície padrão dos blocos do dashboard. */
export function Panel({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <section
      className={cn("dash-enter rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-5 sm:p-6", className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  info,
  action,
}: {
  title: string;
  description?: string;
  info?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-zinc-50">
          {title}
          {info && <InfoTip text={info} />}
        </h2>
        {description && <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

/**
 * Dica de métrica: abre no hover e no foco do teclado (não só no mouse).
 * O texto também fica disponível para leitores de tela pelo aria-label.
 */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="grid size-4 place-items-center rounded-full text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:text-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-500"
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-60 -translate-x-1/2 translate-y-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs font-normal leading-relaxed text-zinc-300 opacity-0 shadow-xl shadow-black/40 transition-all duration-150 group-focus-within/tip:translate-y-0 group-focus-within/tip:opacity-100 group-hover/tip:translate-y-0 group-hover/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

/**
 * Variação contra o período anterior. Seta + sinal + texto: a cor nunca
 * carrega o sentido sozinha. Sem base de comparação, diz isso em vez de
 * inventar uma porcentagem.
 */
export function Delta({
  change,
  hasBaseline,
  unit = "%",
  size = "sm",
}: {
  change: number | null;
  hasBaseline: boolean;
  unit?: "%" | " p.p.";
  size?: "sm" | "md";
}) {
  const text = size === "md" ? "text-[13px]" : "text-xs";
  if (!hasBaseline || change === null) {
    return <span className={cn(text, "text-zinc-500")}>Sem base de comparação</span>;
  }
  if (Math.abs(change) < 0.05) {
    return (
      <span className={cn(text, "inline-flex items-center gap-1 text-zinc-400")}>
        <Minus className="size-3.5" aria-hidden />
        Igual ao período anterior
      </span>
    );
  }
  const up = change > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn(text, "inline-flex flex-wrap items-center gap-x-1.5 gap-y-1")}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular-nums",
          up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {up ? "+" : "−"}
        {decimal.format(Math.abs(change))}
        {unit}
      </span>
      <span className="whitespace-nowrap text-zinc-500">vs. anterior</span>
    </span>
  );
}

/** Estado vazio: compacto, explica o motivo e (se houver) oferece o próximo passo. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: typeof Info;
  title: string;
  description: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 py-8 text-center", className)}>
      <span className="grid size-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-zinc-400">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-medium text-zinc-200">{title}</p>
      <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-zinc-500">{description}</p>
      {action && (
        <div className="mt-3">
          <PanelLink href={action.href}>{action.label}</PanelLink>
        </div>
      )}
    </div>
  );
}
