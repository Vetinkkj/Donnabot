import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: "bg-white/[0.06] text-zinc-300", dot: "bg-zinc-400" },
  success: { badge: "bg-emerald-500/10 text-emerald-300", dot: "bg-emerald-400" },
  warning: { badge: "bg-amber-400/10 text-amber-200", dot: "bg-amber-400" },
  danger: { badge: "bg-red-500/10 text-red-300", dot: "bg-red-400" },
  info: { badge: "bg-sky-400/10 text-sky-300", dot: "bg-sky-400" },
};

/** Status discreto: ponto + texto, nunca só a cor. */
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone].badge,
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASSES[tone].dot)} aria-hidden />
      {children}
    </span>
  );
}
