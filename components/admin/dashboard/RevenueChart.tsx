"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";

/** Um ponto por dia ou por mês; `label` vai no eixo e `tooltip` na caixa de detalhes. */
type Point = { key: string; label: string; tooltip: string; revenue: number; orders: number; previousRevenue: number };

const HEIGHT = 232;
const PAD = { top: 12, right: 8, bottom: 28, left: 56 };

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

/**
 * Faturamento no período (área + linha verde) contra o mesmo trecho do período
 * anterior (linha cinza fina, de fundo). Uma escala só para as duas séries.
 * Linha-guia e caixa de detalhes ao passar o mouse; tabela para leitores de tela.
 */
export function RevenueChart({
  data,
  granularity,
  showPrevious,
}: {
  data: Point[];
  granularity: "day" | "month";
  showPrevious: boolean;
}) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const peak = Math.max(...data.map((d) => Math.max(d.revenue, showPrevious ? d.previousRevenue : 0)));
  const { max, ticks } = niceScale(peak);
  const plotWidth = Math.max(width - PAD.left - PAD.right, 1);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const y = (value: number) => PAD.top + plotHeight - (value / max) * plotHeight;

  const path = (pick: (d: Point) => number) =>
    data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(pick(d)).toFixed(1)}`).join(" ");
  const line = path((d) => d.revenue);
  const previousLine = path((d) => d.previousRevenue);
  const area = `${line} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const labelEvery = Math.ceil(data.length / Math.max(Math.floor(plotWidth / 72), 1));
  const unit = granularity === "month" ? "mês" : "dia";

  function onMove(event: PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setHovered(Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1)))));
  }

  const point = hovered !== null ? data[hovered] : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400" aria-hidden>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3.5 rounded-full" style={{ background: "var(--viz-series)" }} />
          Período atual
        </span>
        {showPrevious && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 rounded-full" style={{ background: "var(--viz-previous)" }} />
            Período anterior
          </span>
        )}
      </div>

      <div ref={ref} className="relative w-full">
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label={`Faturamento por ${unit} no período`}>
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
                <text x={PAD.left - 10} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--viz-muted)">
                  {compactCurrency.format(tick)}
                </text>
              </g>
            ))}
            {data.map((d, i) =>
              // o último ponto sempre aparece; o rótulo regular colado nele é pulado para não encavalar
              (i % labelEvery === 0 && data.length - 1 - i >= labelEvery / 2) || i === data.length - 1 ? (
                <text
                  key={d.key}
                  x={x(i)}
                  y={HEIGHT - 8}
                  textAnchor={data.length === 1 ? "middle" : i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                  fontSize={11}
                  fill="var(--viz-muted)"
                >
                  {d.label}
                </text>
              ) : null
            )}

            {showPrevious && data.length > 1 && (
              <path
                d={previousLine}
                pathLength={1}
                className="dash-draw"
                fill="none"
                stroke="var(--viz-previous)"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            <path d={area} fill="var(--viz-series-fill)" className="dash-fade" />
            <path
              d={line}
              pathLength={1}
              className="dash-draw"
              fill="none"
              stroke="var(--viz-series)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Um ponto só (ex.: "Hoje") não forma linha — mostra o marcador. */}
            {data.length === 1 && (
              <circle cx={x(0)} cy={y(data[0].revenue)} r={5} fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth={2} />
            )}

            {point && hovered !== null && (
              <g>
                <line x1={x(hovered)} x2={x(hovered)} y1={PAD.top} y2={y(0)} stroke="var(--viz-axis)" strokeWidth={1} />
                {showPrevious && (
                  <circle
                    cx={x(hovered)}
                    cy={y(point.previousRevenue)}
                    r={4}
                    fill="var(--viz-previous)"
                    stroke="var(--viz-surface)"
                    strokeWidth={2}
                  />
                )}
                <circle cx={x(hovered)} cy={y(point.revenue)} r={5} fill="var(--viz-series)" stroke="var(--viz-surface)" strokeWidth={2} />
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

        {point && hovered !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-48 rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2.5 text-xs shadow-xl shadow-black/40 backdrop-blur"
            style={{ left: Math.min(Math.max(x(hovered) - 96, 0), Math.max(width - 200, 0)) }}
          >
            <p className="mb-1.5 font-medium text-zinc-300">{point.tooltip}</p>
            <p className="flex items-center justify-between gap-4 text-zinc-50">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="size-2 rounded-full" style={{ background: "var(--viz-series)" }} />
                Faturamento
              </span>
              <span className="font-semibold tabular-nums">{currency.format(point.revenue)}</span>
            </p>
            <p className="mt-0.5 flex items-center justify-between gap-4">
              <span className="pl-3.5 text-zinc-500">Pedidos pagos</span>
              <span className="tabular-nums text-zinc-300">{point.orders}</span>
            </p>
            {showPrevious && (
              <p className="mt-1.5 flex items-center justify-between gap-4 border-t border-white/5 pt-1.5">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <span className="size-2 rounded-full" style={{ background: "var(--viz-previous)" }} />
                  Período anterior
                </span>
                <span className="tabular-nums text-zinc-300">{currency.format(point.previousRevenue)}</span>
              </p>
            )}
          </div>
        )}

        <table className="sr-only">
          <caption>Faturamento por {unit}</caption>
          <thead>
            <tr>
              <th>{granularity === "month" ? "Mês" : "Dia"}</th>
              <th>Faturamento</th>
              <th>Pedidos pagos</th>
              {showPrevious && <th>Período anterior</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.key}>
                <td>{d.tooltip}</td>
                <td>{currency.format(d.revenue)}</td>
                <td>{d.orders}</td>
                {showPrevious && <td>{currency.format(d.previousRevenue)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
