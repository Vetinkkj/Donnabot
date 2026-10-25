import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CircleCheck, RotateCcw, Search, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

// Peças de página do painel (Atendimento, Pedidos, Produtos, Clientes,
// Configurações). Sem estado próprio: servem em componentes de servidor e de
// cliente. Painéis, métricas e estados vazios ficam em ./ui.

/** Cabeçalho padrão: título, descrição curta e ações à direita. */
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="dash-enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 rounded text-[13px] text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Campo de busca com ícone e botão de limpar. */
export function SearchField({
  value,
  onChange,
  placeholder,
  className,
  label = "Buscar",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-9 w-full rounded-lg border border-white/10 bg-zinc-950/60 pl-9 pr-8 text-sm text-zinc-50 transition-colors placeholder:text-zinc-600 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-zinc-500 hover:text-zinc-200"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Filtro segmentado (uma opção ativa). `count` mostra quantos itens cada opção tem. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-zinc-900/60 p-1 [scrollbar-width:none]"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[13px] font-medium transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-500",
            option.value === value ? "bg-white/10 text-zinc-50" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn("text-xs tabular-nums", option.value === value ? "text-zinc-300" : "text-zinc-600")}>
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Select compacto no padrão dos filtros. */
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      aria-label={label}
      className="h-9 rounded-lg border border-white/10 bg-zinc-950/60 px-2.5 text-[13px] text-zinc-200 transition-colors hover:border-white/20 focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Erro de carregamento/operação com ação opcional (ex.: tentar de novo). */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200"
    >
      <span className="flex items-center gap-2">
        <TriangleAlert className="size-4 shrink-0 text-red-400" aria-hidden />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-red-200 hover:bg-red-500/10"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Resultado de uma operação. Só deve aparecer depois da resposta do servidor. */
export function StatusMessage({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "dash-enter flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        tone === "success" ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"
      )}
    >
      {tone === "success" ? (
        <CircleCheck className="size-4 shrink-0 text-emerald-400" aria-hidden />
      ) : (
        <TriangleAlert className="size-4 shrink-0 text-red-400" aria-hidden />
      )}
      {children}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-white/[0.06] motion-safe:animate-pulse", className)} />;
}

/** Linhas-esqueleto para listas e tabelas enquanto carregam. */
export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col", className)} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-white/[0.05] px-4 py-3.5 first:border-t-0">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Avatar com iniciais (o sistema não guarda foto de cliente). */
export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const parts = (name ?? "").replace(/^\+/, "").split(/\s+/).filter((p) => /\p{L}/u.test(p));
  const letters = parts.length ? (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase() : "#";
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-300 ring-1 ring-white/[0.06]",
        className
      )}
    >
      {letters}
    </span>
  );
}

/** Interruptor liga/desliga (opções booleanas). É um botão com role="switch" — funciona com teclado. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange(!checked);
      }}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        checked ? "bg-emerald-500" : "bg-white/15"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block rounded-full bg-white shadow transition-transform",
          size === "sm" ? "size-4" : "size-5",
          checked ? (size === "sm" ? "translate-x-[18px]" : "translate-x-[22px]") : "translate-x-0.5"
        )}
      />
    </button>
  );
}

/** Classes compartilhadas das tabelas do painel. */
export const tableStyles = {
  wrap: "overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/50",
  head: "border-b border-white/[0.06] text-left text-xs text-zinc-500",
  th: "px-4 py-3 font-medium",
  row: "group relative border-t border-white/[0.05] transition-colors first:border-t-0 hover:bg-white/[0.025]",
  td: "px-4 py-3",
  /** Link que cobre a linha inteira: clicar em qualquer ponto abre o item. */
  rowLink:
    "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-emerald-500",
};
