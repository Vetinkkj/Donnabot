"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

/** Um ponto por dia ou por mês; `label` vai no eixo e `tooltip` na caixa de detalhes. */
type Point = { key: string; label: string; tooltip: string; revenue: number; orders: number };

const HEIGHT = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 64 };

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Escala do eixo y com passos "redondos" (1; 2; 2,5; 5 × 10^n) e ~4 intervalos: rótulos limpos sem desperdiçar altura. */
function niceScale(value: number) {
  if (value <= 0) return { max: 100, ticks: [0, 25, 50, 75, 100] };
  const raw = value / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * power >= raw) ?? 10) * power;
  const max = Math.ceil(value / step) * step;
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) };
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/** Faturamento por dia: área + linha (uma série), linha-guia e caixa de detalhes ao passar o mouse. */
export function RevenueChart({ data, granularity }: { data: Point[]; granularity: "day" | "month" }) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const { max, ticks } = niceScale(Math.max(...data.map((d) => d.revenue)));
  const plotWidth = Math.max(width - PAD.left - PAD.right, 1);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const y = (value: number) => PAD.top + plotHeight - (value / max) * plotHeight;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const labelEvery = Math.ceil(data.length / Math.max(Math.floor(plotWidth / 70), 1));
  const empty = data.every((d) => d.revenue === 0);

  function onMove(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setHovered(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
  }

  const point = hovered !== null ? data[hovered] : null;

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={`Faturamento por ${granularity === "month" ? "mês" : "dia"} no período`}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke={tick === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--viz-muted)">
                {compactCurrency.format(tick)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            // o último dia sempre aparece; o rótulo regular colado nele é pulado para não encavalar
            (i % labelEvery === 0 && data.length - 1 - i >= labelEvery / 2) || i === data.length - 1 ? (
              <text
                key={d.key}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                fontSize={11}
                fill="var(--viz-muted)"
              >
                {d.label}
              </text>
            ) : null,
          )}

          <path d={area} fill="var(--viz-series-fill)" />
          <path d={line} fill="none" stroke="var(--viz-series)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Um ponto só (ex.: "Hoje") não forma linha — mostra o marcador. */}
          {data.length === 1 && (
            <circle cx={x(0)} cy={y(data[0].revenue)} r={5} fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth={2} />
          )}

          {point && hovered !== null && (
            <g>
              <line x1={x(hovered)} x2={x(hovered)} y1={PAD.top} y2={y(0)} stroke="var(--viz-axis)" strokeWidth={1} />
              <circle
                cx={x(hovered)}
                cy={y(point.revenue)}
                r={5}
                fill="var(--viz-series)"
                stroke="var(--viz-surface)"
                strokeWidth={2}
              />
            </g>
          )}

          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHovered(null)}
          />
        </svg>
      )}

      {empty && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center pl-16 text-sm text-zinc-500">
          Nenhuma venda paga neste período ainda.
        </p>
      )}

      {point && hovered !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md dark:border-zinc-700 dark:bg-zinc-900"
          style={{
            left: Math.min(Math.max(x(hovered) - 80, 0), Math.max(width - 168, 0)),
          }}
        >
          <p className="mb-1 font-medium text-zinc-500 dark:text-zinc-400">{point.tooltip}</p>
          <p className="flex items-center justify-between gap-4 text-zinc-900 dark:text-zinc-50">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: "var(--viz-series)" }} />
              Faturamento
            </span>
            <span className="font-semibold tabular-nums">{currency.format(point.revenue)}</span>
          </p>
          <p className="mt-0.5 flex items-center justify-between gap-4 text-zinc-600 dark:text-zinc-300">
            <span className="pl-3.5">Pedidos pagos</span>
            <span className="tabular-nums">{point.orders}</span>
          </p>
        </div>
      )}

      <table className="sr-only">
        <caption>Faturamento por {granularity === "month" ? "mês" : "dia"}</caption>
        <thead>
          <tr>
            <th>{granularity === "month" ? "Mês" : "Dia"}</th>
            <th>Faturamento</th>
            <th>Pedidos pagos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <td>{d.label}</td>
              <td>{currency.format(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
