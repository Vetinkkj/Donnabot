"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

/** Falha ao carregar os números (ex: banco fora do ar): explica e deixa tentar de novo, sem derrubar o painel. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Visão geral</h1>
      <div className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-zinc-900/50 px-6 py-14 text-center">
        <span className="grid size-11 place-items-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-300">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <p className="mt-4 font-medium text-zinc-100">Não conseguimos carregar os números agora</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Pode ser uma instabilidade momentânea. Seus dados estão seguros. Tente de novo em alguns segundos.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-zinc-50 transition-all hover:bg-white/15 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-emerald-500"
        >
          <RotateCcw className="size-4" aria-hidden />
          Tentar de novo
        </button>
      </div>
    </div>
  );
}
