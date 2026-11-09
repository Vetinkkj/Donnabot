"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BellRing, LineChart, PackageSearch, TrendingDown } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { DashboardView } from "@/components/admin/dashboard/DashboardView";
import type { DashboardOverview } from "@/services/dashboard";
import { SectionHead } from "./primitives";

/**
 * Tamanho em que o painel é desenhado antes de ser reduzido para caber na
 * página. No celular usamos a largura de celular: os breakpoints do Tailwind
 * seguem a tela real, então o painel já vem no layout de celular.
 */
const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 390, height: 780 };

/**
 * Dados ILUSTRATIVOS para mostrar o painel na página inicial (o aviso aparece
 * embaixo da imagem). O painel em si é o componente real do produto.
 */
function sampleOverview(): DashboardOverview {
  const days = 30;
  const start = Date.UTC(2026, 9, 1, 12);
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start + i * 86_400_000);
    const revenue = Math.round((Math.sin(i / 3) + 1.3) * 190 + (i % 7 === 5 ? 380 : 0));
    return {
      key: d.toISOString().slice(0, 10),
      label: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      tooltip: d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }),
      revenue,
      orders: Math.max(1, Math.round(revenue / 130)),
      previousRevenue: Math.round(revenue * 0.72 + (i % 5) * 28),
    };
  });
  return {
    range: { from: series[0].key, to: series[days - 1].key, preset: "30d", days, granularity: "day" },
    kpis: {
      revenue: { value: 12840.5, previous: 10200, change: 25.9 },
      paidOrders: { value: 41, previous: 36, change: 13.9 },
      averageTicket: { value: 313.18, previous: 283.33, change: 10.5 },
      conversion: { value: 27.3, previous: 30.1, changePoints: -2.8 },
      conversations: { value: 150, previous: 120, change: 25 },
      newCustomers: { value: 64, previous: 70, change: -8.6 },
    },
    series,
    funnel: [
      { label: "Clientes que conversaram", value: 150 },
      { label: "Finalizaram o carrinho", value: 58 },
      { label: "Pagaram", value: 41 },
    ],
    topProducts: [
      { name: "Tela iPhone 11 (incell)", imageUrl: null, revenue: 3500, quantity: 10, share: 0.273 },
      { name: "Bateria Samsung A15", imageUrl: null, revenue: 2140, quantity: 18, share: 0.167 },
      { name: "Carregador Turbo 25W", imageUrl: null, revenue: 1617, quantity: 27, share: 0.126 },
      { name: "Película 3D iPhone 13", imageUrl: null, revenue: 980, quantity: 49, share: 0.076 },
      { name: "Capinha Silicone Galaxy S23", imageUrl: null, revenue: 718, quantity: 18, share: 0.056 },
    ],
    now: { waitingHuman: 2, withHuman: 1, pendingOrders: 3, lowStockCount: 7, outOfStockCount: 1, productsCount: 38 },
    lowStock: [
      { id: "a", name: "Tela Moto G54", stockQuantity: 0, minStock: 3 },
      { id: "b", name: "Bateria iPhone XR", stockQuantity: 1, minStock: 4 },
      { id: "c", name: "Conector de carga Type-C", stockQuantity: 2, minStock: 3 },
      { id: "d", name: "Fone Bluetooth i12", stockQuantity: 3, minStock: 3 },
      { id: "e", name: "Película privacidade iPhone 14", stockQuantity: 2, minStock: 2 },
    ],
    recentOrders: [
      { id: "ex0000aa0001", status: "PAID", total: 350, createdAt: "2026-10-30T18:12:00Z", customer: "Mariana Souza" },
      { id: "ex0000aa0002", status: "PENDING", total: 89.9, createdAt: "2026-10-30T16:40:00Z", customer: "Rafael Lima" },
      { id: "ex0000aa0003", status: "PAID", total: 1240, createdAt: "2026-10-30T13:05:00Z", customer: "Juliana Prado" },
      { id: "ex0000aa0004", status: "CANCELLED", total: 59.9, createdAt: "2026-10-29T20:51:00Z", customer: "Pedro Henrique" },
      { id: "ex0000aa0005", status: "PAID", total: 199, createdAt: "2026-10-29T11:20:00Z", customer: "Carla Mendes" },
      { id: "ex0000aa0006", status: "PAID", total: 44.9, createdAt: "2026-10-28T09:02:00Z", customer: "Lucas Andrade" },
    ],
  } as DashboardOverview;
}

/** Desenha o filho na largura de desktop e reduz proporcionalmente para caber no espaço disponível. */
function ScaledFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<{ scale: number; size: typeof DESKTOP } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const size = window.innerWidth < 768 ? MOBILE : DESKTOP;
      setFrame({ size, scale: Math.min(entry.contentRect.width / size.width, 1) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: frame ? frame.size.height * frame.scale : 0 }}>
      {frame && (
        <div
          style={{
            width: frame.size.width,
            height: frame.size.height,
            transform: `scale(${frame.scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const points = [
  {
    icon: BellRing,
    title: "O que precisa de você agora",
    text: "Clientes esperando um atendente, pedidos aguardando pagamento e produtos acabando aparecem no topo, em destaque.",
  },
  {
    icon: LineChart,
    title: "Vendas com comparação",
    text: "Faturamento, pedidos pagos e ticket médio de qualquer período, com o gráfico lado a lado com o período anterior.",
  },
  {
    icon: TrendingDown,
    title: "Onde o cliente desiste",
    text: "O funil mostra quantos conversaram, quantos fecharam o carrinho e quantos pagaram — e qual etapa perde mais gente.",
  },
  {
    icon: PackageSearch,
    title: "Estoque e pedidos sob controle",
    text: "Os mais vendidos, os produtos no estoque mínimo e os últimos pedidos, a um clique de cada detalhe.",
  },
];

export function DashboardShowcase() {
  return (
    <section id="painel" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          eyebrow="Painel da loja"
          title={
            <>
              Sua loja inteira <span className="text-gradient">em uma tela.</span>
            </>
          }
          sub="Enquanto a Donna atende no WhatsApp, o painel mostra o que está vendendo, o que precisa da sua atenção e onde dá para vender mais."
        />

        <div className="reveal relative mt-14">
          <div className="pointer-events-none absolute -inset-x-10 -top-10 bottom-10 rounded-full bg-glow opacity-70 blur-3xl" aria-hidden />
          <figure className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-elegant">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-foreground/15" />
              <span className="size-2.5 rounded-full bg-foreground/15" />
              <span className="size-2.5 rounded-full bg-foreground/15" />
              <span className="ml-3 rounded-md bg-foreground/[0.05] px-3 py-0.5 font-mono text-[11px] text-muted-foreground">
                donnabot.app.br/dashboard
              </span>
            </div>
            {/* O painel real do produto, só para ver: sem clique, foco nem leitura por leitor de tela. */}
            <div inert aria-hidden className="select-none">
              <ScaledFrame>
                <div className="dark flex h-full flex-col bg-zinc-950 md:flex-row font-sans text-zinc-100 antialiased [color-scheme:dark] [&>nav]:!static md:[&>nav]:!h-full">
                  <Sidebar userLabel="loja@exemplo.com" footer={null} />
                  <main className="min-w-0 flex-1 overflow-hidden px-4 py-6 md:px-8 md:py-8">
                    <DashboardView data={sampleOverview()} today="2026-10-30" />
                  </main>
                </div>
              </ScaledFrame>
            </div>
            {/* Degradê no corte de baixo: a imagem "continua" em vez de terminar seca. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent" aria-hidden />
            <figcaption className="sr-only">
              Painel da Donnabot com faturamento, pedidos, conversão, produtos mais vendidos e estoque baixo.
            </figcaption>
          </figure>
          <p className="mt-3 text-center text-xs text-muted-foreground">Imagem do painel real com dados ilustrativos.</p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((point) => (
            <div key={point.title} className="reveal rounded-2xl border border-border bg-card/50 p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <point.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
