"use client";

import { useState } from "react";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

const FUNNEL_COLORS = ["var(--viz-funnel-1)", "var(--viz-funnel-2)", "var(--viz-funnel-3)"];

/**
 * Funil do período: conversas → carrinhos finalizados → pedidos pagos.
 * Barras na mesma escala (a primeira etapa = 100%), rampa de um só azul
 * escurecendo pela ordem, e a conversão de uma etapa para a seguinte escrita
 * ao lado (nunca só pela cor).
 */
export function FunnelChart({ stages }: { stages: { label: string; value: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  // Escala pelo maior valor (não pela 1ª etapa) e largura travada em 100%: a barra nunca sai do card.
  const top = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-4">
      {stages.map((stage, i) => {
        const previous = i > 0 ? stages[i - 1].value : null;
        const fromPrevious = previous ? Math.min((stage.value / previous) * 100, 100) : null;
        const ofTop = Math.min((stage.value / top) * 100, 100);
        return (
          <div
            key={stage.label}
            className="relative"
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{stage.label}</span>
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{stage.value}</span>
            </div>
            <div className="h-7 w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800/70">
              <div
                className="h-full rounded transition-[filter] duration-150"
                style={{
                  width: `${stage.value ? Math.max(ofTop, 1.5) : 0}%`,
                  background: FUNNEL_COLORS[i] ?? FUNNEL_COLORS[FUNNEL_COLORS.length - 1],
                  filter: hovered === i ? "brightness(1.1)" : undefined,
                }}
              />
            </div>
            {fromPrevious !== null && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {percent.format(fromPrevious)}% da etapa anterior
              </p>
            )}
            {hovered === i && (
              <div className="pointer-events-none absolute -top-2 right-0 z-10 -translate-y-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{stage.label}</p>
                <p className="text-zinc-600 dark:text-zinc-300">
                  {stage.value} {stage.value === 1 ? "cliente" : "clientes"}
                  {i > 0 && stages[0].value > 0 && ` • ${percent.format(Math.min((stage.value / stages[0].value) * 100, 100))}% de quem conversou`}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Produtos que mais faturaram no período (uma série: barras do mesmo azul, rótulos em texto). */
export function TopProductsChart({ products }: { products: { name: string; revenue: number; quantity: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (products.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">Nenhum produto vendido neste período ainda.</p>;
  }

  const max = Math.max(...products.map((p) => p.revenue), 1);
  const total = products.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div className="flex flex-col gap-3">
      {products.map((product, i) => (
        <div
          key={product.name}
          className="relative"
          onPointerEnter={() => setHovered(i)}
          onPointerLeave={() => setHovered(null)}
        >
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-zinc-700 dark:text-zinc-300">{product.name}</span>
            <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {currency.format(product.revenue)}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/70">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((product.revenue / max) * 100, 2)}%`,
                background: "var(--viz-series)",
                filter: hovered === i ? "brightness(1.1)" : undefined,
              }}
            />
          </div>
          {hovered === i && (
            <div className="pointer-events-none absolute -top-2 right-0 z-10 -translate-y-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{product.name}</p>
              <p className="text-zinc-600 dark:text-zinc-300">
                {product.quantity} {product.quantity === 1 ? "unidade" : "unidades"} •{" "}
                {percent.format(total ? (product.revenue / total) * 100 : 0)}% do faturamento destes produtos
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
