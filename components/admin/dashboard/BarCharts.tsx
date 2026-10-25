import { ImageIcon, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { currency, decimal, integer } from "./ui";

/**
 * Funil do período: conversaram → finalizaram o carrinho → pagaram. Todas as
 * barras na mesma escala (a 1ª etapa = 100%) e, entre uma etapa e a seguinte,
 * quantos clientes ficaram pelo caminho. As etapas são acumulativas no serviço
 * (quem pagou também finalizou), então cada uma nunca passa da anterior.
 */
export function FunnelChart({ stages }: { stages: { label: string; value: number }[] }) {
  const top = Math.max(stages[0]?.value ?? 0, 1);
  const drops = stages.slice(1).map((stage, i) => {
    const from = stages[i].value;
    const lost = Math.max(from - stage.value, 0);
    return { lost, rate: from ? (lost / from) * 100 : 0 };
  });
  const worst = drops.reduce((best, drop, i) => (drop.lost > 0 && drop.rate > (drops[best]?.rate ?? -1) ? i : best), -1);

  return (
    <ol className="flex flex-col">
      {stages.map((stage, i) => {
        const ofTop = Math.min((stage.value / top) * 100, 100);
        const drop = i > 0 ? drops[i - 1] : null;
        return (
          <li key={stage.label}>
            {drop && (
              <div className="flex items-center gap-2 py-2 pl-3 text-xs">
                <span className="h-4 w-px bg-white/10" aria-hidden />
                {drop.lost > 0 ? (
                  <span className={cn("inline-flex items-center gap-1", worst === i - 1 ? "text-amber-300/90" : "text-zinc-500")}>
                    <TrendingDown className="size-3.5" aria-hidden />
                    {integer.format(drop.lost)} {drop.lost === 1 ? "cliente não seguiu" : "clientes não seguiram"} (
                    {decimal.format(drop.rate)}%)
                    {worst === i - 1 && <span className="ml-1 rounded bg-amber-400/10 px-1.5 py-0.5 text-[11px] font-medium">maior perda</span>}
                  </span>
                ) : (
                  <span className="text-zinc-500">Ninguém ficou pelo caminho nesta etapa</span>
                )}
              </div>
            )}
            <div className="group">
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-zinc-300">{stage.label}</span>
                <span className="flex items-baseline gap-2">
                  <span className="text-xs tabular-nums text-zinc-500">{decimal.format(ofTop)}%</span>
                  <span className="min-w-8 text-right font-semibold tabular-nums text-zinc-50">{integer.format(stage.value)}</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="dash-grow h-full rounded-full transition-[filter] group-hover:brightness-125"
                  style={{
                    width: `${stage.value ? Math.max(ofTop, 1.5) : 0}%`,
                    // mesma medida (clientes) em todas as etapas: uma cor só, a largura conta a história
                    background: "var(--viz-series)",
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Produtos que mais faturaram: posição, foto, unidades, receita e participação no faturamento de produtos. */
export function TopProductsList({
  products,
}: {
  products: { name: string; imageUrl: string | null; revenue: number; quantity: number; share: number }[];
}) {
  const max = Math.max(...products.map((p) => p.revenue), 1);
  return (
    <ol className="flex flex-col gap-4">
      {products.map((product, i) => (
        <li key={product.name} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-center text-xs font-medium tabular-nums text-zinc-500">{i + 1}</span>
          <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-500">
            {product.imageUrl ? (
              // Fotos vêm de qualquer URL cadastrada pela loja — <img> evita configurar domínios no next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              <ImageIcon className="size-4" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-zinc-200">{product.name}</span>
              <span className="shrink-0 font-semibold tabular-nums text-zinc-50">{currency.format(product.revenue)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="dash-grow h-full rounded-full"
                  style={{ width: `${Math.max((product.revenue / max) * 100, 2)}%`, background: "var(--viz-series)", animationDelay: `${i * 70}ms` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                {integer.format(product.quantity)} un. · {decimal.format(product.share * 100)}%
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
