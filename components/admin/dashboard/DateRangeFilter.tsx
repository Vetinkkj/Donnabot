"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Preset = { id: string; label: string };

const display = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
function formatKey(key: string) {
  return display.format(new Date(`${key}T12:00:00Z`)).replace(/\./g, "");
}

/**
 * Atalhos de período + "Personalizado" (duas datas, qualquer dia/mês/ano).
 * Tudo vira parâmetro na URL (?periodo=… ou ?de=…&ate=…): o servidor recalcula
 * os números, o link é compartilhável e o voltar do navegador funciona.
 * Enquanto os dados novos chegam, o controle mostra que está carregando.
 */
export function DateRangeFilter({
  presets,
  active,
  from,
  to,
  today,
}: {
  presets: readonly Preset[];
  active: string;
  from: string;
  to: string;
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(id: string, href: string) {
    setTarget(id);
    startTransition(() => router.push(href, { scroll: false }));
  }

  function apply() {
    if (!start || !end) return;
    setOpen(false);
    go("personalizado", `/dashboard?de=${start}&ate=${end}`);
  }

  const invalid = !start || !end || start > end;
  const shown = pending && target ? target : active;

  return (
    <div className="flex min-w-0 flex-col items-start gap-2 xl:items-end">
      <div className="flex max-w-full items-center gap-2">
        <div
          role="group"
          aria-label="Período"
          className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-white/[0.07] bg-zinc-900/60 p-1 [scrollbar-width:none]"
        >
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => go(preset.id, `/dashboard?periodo=${preset.id}`)}
              aria-pressed={preset.id === shown}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-500",
                preset.id === shown
                  ? "bg-white/10 text-zinc-50 shadow-sm shadow-black/20"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div ref={boxRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setStart(from);
              setEnd(to);
              setOpen((value) => !value);
            }}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              "flex h-[38px] items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-500",
              shown === "personalizado"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-white/[0.07] bg-zinc-900/60 text-zinc-300 hover:text-zinc-50"
            )}
          >
            <CalendarDays className="size-4" aria-hidden />
            <span className="hidden sm:inline">Personalizado</span>
          </button>

          {open && (
            <div
              role="dialog"
              aria-label="Escolher período"
              className="dash-enter absolute right-0 z-30 mt-2 w-72 rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl shadow-black/50"
            >
              <p className="mb-3 text-sm font-semibold text-zinc-50">Escolher período</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
                  De
                  <input
                    type="date"
                    value={start}
                    max={end || today}
                    onChange={(e) => setStart(e.target.value)}
                    className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-50 [color-scheme:dark] focus:border-emerald-500/60 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-400">
                  Até
                  <input
                    type="date"
                    value={end}
                    min={start}
                    max={today}
                    onChange={(e) => setEnd(e.target.value)}
                    className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-50 [color-scheme:dark] focus:border-emerald-500/60 focus:outline-none"
                  />
                </label>
              </div>
              {start && end && start > end && (
                <p className="mt-2 text-xs text-red-400">A data inicial precisa ser antes da final.</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={invalid}
                  onClick={apply}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-emerald-950 transition-all hover:bg-emerald-400 active:scale-[0.97] disabled:opacity-40"
                >
                  <Check className="size-4" aria-hidden />
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-zinc-500" aria-live="polite">
        {pending ? (
          <>
            <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden />
            Atualizando os números…
          </>
        ) : from === to ? (
          formatKey(from)
        ) : (
          `${formatKey(from)} – ${formatKey(to)}`
        )}
      </p>
    </div>
  );
}
