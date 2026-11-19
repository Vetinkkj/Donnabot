import { Lock, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { CONTACT_EMAIL } from "@/lib/marketing-config";
import { TIERS } from "@/lib/plans";

/** Recurso de um plano acima do atual: explica o que é e como liberar. */
export function UpgradeNotice({ title, description, className }: { title: string; description: string; className?: string }) {
  return (
    <div
      className={cn(
        "dash-enter flex flex-col items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 sm:flex-row sm:items-center",
        className
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300">
        <Lock className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-50">{title}</p>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      <a
        href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Quero mudar para o plano ${TIERS.professional.name}`)}`}
        className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
      >
        Mudar para o {TIERS.professional.name}
      </a>
    </div>
  );
}

/** Quantas conversas a loja já usou do limite do mês. Só informa; a Donna não para de atender. */
export function ConversationUsage({ name, used, limit }: { name: string; used: number | null; limit: number }) {
  if (used === null) return null;
  const ratio = Math.min(used / limit, 1);
  const tone = used >= limit ? "bg-red-400" : ratio >= 0.8 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex min-w-[220px] flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-zinc-900/50 px-3.5 py-2.5">
      <p className="flex items-center justify-between gap-3 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <MessagesSquare className="size-3.5" aria-hidden />
          Plano {name} · conversas no mês
        </span>
        <span className="tabular-nums text-zinc-200">
          {used.toLocaleString("pt-BR")} / {limit.toLocaleString("pt-BR")}
        </span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} aria-label="Conversas usadas no mês">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
