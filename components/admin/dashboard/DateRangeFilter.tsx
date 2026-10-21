"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Check } from "lucide-react";

type Preset = { id: string; label: string };

const display = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
function formatKey(key: string) {
  return display.format(new Date(`${key}T12:00:00Z`));
}

/**
 * Atalhos de período (Hoje, 7/30/90 dias, Este mês, Mês passado, Este ano) +
 * "Personalizado": duas datas no calendário (qualquer dia, mês e ano). Tudo
 * vira parâmetro na URL (?periodo=… ou ?de=…&ate=…), então o link é
 * compartilhável e o botão voltar do navegador funciona.
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

  function apply() {
    if (!start || !end) return;
    setOpen(false);
    router.push(`/dashboard?de=${start}&ate=${end}`);
  }

  const invalid = !start || !end || start > end;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {presets.map((preset) => (
          <Link
            key={preset.id}
            href={`/dashboard?periodo=${preset.id}`}
            aria-current={preset.id === active ? "page" : undefined}
            className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              preset.id === active
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            {preset.label}
          </Link>
        ))}

        <div ref={boxRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setStart(from);
              setEnd(to);
              setOpen((value) => !value);
            }}
            aria-expanded={open}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              active === "personalizado"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            <CalendarDays className="size-4" aria-hidden />
            Personalizado
          </button>

          {open && (
            <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Escolher período</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  De
                  <input
                    type="date"
                    value={start}
                    max={end || today}
                    onChange={(e) => setStart(e.target.value)}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:[color-scheme:dark]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Até
                  <input
                    type="date"
                    value={end}
                    min={start}
                    max={today}
                    onChange={(e) => setEnd(e.target.value)}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:[color-scheme:dark]"
                  />
                </label>
              </div>
              {start && end && start > end && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">A data inicial precisa ser antes da final.</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={invalid}
                  onClick={apply}
                  className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
                >
                  <Check className="size-4" aria-hidden />
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {from === to ? formatKey(from) : `${formatKey(from)} até ${formatKey(to)}`}
      </p>
    </div>
  );
}
