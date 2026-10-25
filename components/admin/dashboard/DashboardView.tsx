import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Headset,
  MessageCircle,
  PackageX,
  Receipt,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { DASHBOARD_PRESETS, type DashboardOverview } from "@/services/dashboard";
import { DateRangeFilter } from "./DateRangeFilter";
import { RevenueChart } from "./RevenueChart";
import { FunnelChart, TopProductsList } from "./BarCharts";
import {
  Delta,
  EmptyState,
  InfoTip,
  Panel,
  PanelHeader,
  PanelLink,
  currency,
  decimal,
  integer,
} from "./ui";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** Status do pedido: ponto + texto (nunca só a cor). Verde = pago, âmbar = aguardando, vermelho = perdido. */
const ORDER_STATUS: Record<string, { label: string; short: string; dot: string; text: string }> = {
  PENDING: { label: "Aguardando pagamento", short: "Pendente", dot: "bg-amber-400", text: "text-amber-200" },
  PAID: { label: "Pago", short: "Pago", dot: "bg-emerald-400", text: "text-emerald-300" },
  CANCELLED: { label: "Cancelado", short: "Cancelado", dot: "bg-red-400", text: "text-red-300" },
  EXPIRED: { label: "Expirado", short: "Expirado", dot: "bg-zinc-500", text: "text-zinc-400" },
};

function comparisonText(days: number) {
  return days === 1 ? "o dia anterior" : `os ${days} dias anteriores`;
}

// ---------------------------------------------------------------------------
// 1. O que precisa de atenção agora (independe do período)
// ---------------------------------------------------------------------------

function AttentionItem({
  href,
  icon: Icon,
  value,
  label,
  hint,
  tone,
}: {
  href: string;
  icon: typeof Wallet;
  value: number;
  label: string;
  hint: string;
  tone: "alert" | "danger" | "calm";
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-emerald-500"
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl border",
          tone === "alert" && "border-amber-400/20 bg-amber-400/10 text-amber-300",
          tone === "danger" && "border-red-400/20 bg-red-400/10 text-red-300",
          tone === "calm" && "border-white/[0.07] bg-white/[0.03] text-zinc-400"
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold leading-none tabular-nums text-zinc-50">{integer.format(value)}</span>
          <span className="truncate text-sm text-zinc-300">{label}</span>
        </span>
        <span className={cn("mt-1 block truncate text-xs", tone === "calm" ? "text-zinc-500" : tone === "alert" ? "text-amber-300/80" : "text-red-300/80")}>
          {hint}
        </span>
      </span>
    </Link>
  );
}

function AttentionStrip({ now }: { now: DashboardOverview["now"] }) {
  const allClear = now.waitingHuman === 0 && now.pendingOrders === 0 && now.lowStockCount === 0;
  return (
    <Panel className="p-2 sm:p-2" delay={40}>
      <div className="flex items-center justify-between gap-3 px-3 pb-1 pt-2">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Agora na sua loja</h2>
        {allClear && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Tudo em dia
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-4">
        <AttentionItem
          href="/conversations"
          icon={Headset}
          value={now.waitingHuman}
          label={now.waitingHuman === 1 ? "cliente esperando" : "clientes esperando"}
          hint={now.waitingHuman ? "Pediram um atendente" : "Ninguém esperando atendente"}
          tone={now.waitingHuman ? "alert" : "calm"}
        />
        <AttentionItem
          href="/orders"
          icon={Receipt}
          value={now.pendingOrders}
          label={now.pendingOrders === 1 ? "pedido pendente" : "pedidos pendentes"}
          hint={now.pendingOrders ? "Aguardando pagamento" : "Nenhum aguardando pagamento"}
          tone={now.pendingOrders ? "alert" : "calm"}
        />
        <AttentionItem
          href="/products?estoque=baixo"
          icon={now.outOfStockCount ? PackageX : AlertTriangle}
          value={now.lowStockCount}
          label={now.lowStockCount === 1 ? "produto acabando" : "produtos acabando"}
          hint={
            now.outOfStockCount
              ? `${now.outOfStockCount} esgotado${now.outOfStockCount === 1 ? "" : "s"}, sem venda pela Donna`
              : now.lowStockCount
                ? "No estoque mínimo ou abaixo dele"
                : `Estoque ok nos ${integer.format(now.productsCount)} produtos ativos`
          }
          tone={now.outOfStockCount ? "danger" : now.lowStockCount ? "alert" : "calm"}
        />
        <AttentionItem
          href="/conversations"
          icon={MessageCircle}
          value={now.withHuman}
          label="em atendimento humano"
          hint={now.withHuman ? "A Donna está pausada nessas conversas" : "A Donna está atendendo todo mundo"}
          tone="calm"
        />
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 2. Desempenho de vendas
// ---------------------------------------------------------------------------

function SecondaryStat({ label, value, delta, info }: { label: string; value: string; delta: ReactNode; info?: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[13px] text-zinc-400">
        {label}
        {info && <InfoTip text={info} />}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-zinc-50">{value}</p>
      <div className="mt-1.5">{delta}</div>
    </div>
  );
}

function SalesPanel({ data }: { data: DashboardOverview }) {
  const { kpis, series, range, now } = data;
  const hasCurrent = series.some((p) => p.revenue > 0);
  const hasPrevious = series.some((p) => p.previousRevenue > 0);

  return (
    <Panel delay={90}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-0 lg:divide-x lg:divide-white/[0.06]">
        <div className="lg:pr-8">
          <p className="flex items-center gap-1.5 text-[13px] text-zinc-400">
            <Wallet className="size-4 text-zinc-500" aria-hidden />
            Faturamento
            <InfoTip text="Soma dos pedidos pagos no período, pela data do pagamento. Inclui os pedidos marcados como pagos manualmente." />
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-zinc-50 sm:text-[44px] sm:leading-none">
            {currency.format(kpis.revenue.value)}
          </p>
          <div className="mt-2.5">
            <Delta change={kpis.revenue.change} hasBaseline={kpis.revenue.previous > 0} size="md" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 lg:col-span-2 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-white/[0.06]">
          <div className="lg:px-8">
            <SecondaryStat
              label="Pedidos pagos"
              value={integer.format(kpis.paidOrders.value)}
              delta={<Delta change={kpis.paidOrders.change} hasBaseline={kpis.paidOrders.previous > 0} />}
            />
          </div>
          <div className="lg:pl-8">
            <SecondaryStat
              label="Ticket médio"
              info="Faturamento dividido pelo número de pedidos pagos no período."
              value={kpis.paidOrders.value ? currency.format(kpis.averageTicket.value) : "—"}
              delta={
                kpis.paidOrders.value ? (
                  <Delta change={kpis.averageTicket.change} hasBaseline={kpis.averageTicket.previous !== null} />
                ) : (
                  <span className="text-xs text-zinc-500">Sem pedidos pagos no período</span>
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-7 border-t border-white/[0.06] pt-6">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-zinc-50">
            Faturamento por {range.granularity === "month" ? "mês" : "dia"}
          </h2>
          <span className="text-xs text-zinc-500">vs. {comparisonText(range.days)}</span>
        </div>
        {hasCurrent || hasPrevious ? (
          <RevenueChart data={series} granularity={range.granularity} showPrevious={hasPrevious} />
        ) : (
          <EmptyState
            icon={Wallet}
            title="Nenhuma venda paga neste período"
            description="Assim que um pedido for marcado como pago, o faturamento aparece aqui, dia a dia, comparado com o período anterior."
            action={
              now.pendingOrders
                ? { href: "/orders", label: `Ver ${now.pendingOrders} pedido${now.pendingOrders === 1 ? "" : "s"} aguardando pagamento` }
                : { href: "/conversations", label: "Ver atendimentos" }
            }
            className="py-10"
          />
        )}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 3. Conversão e funil · produtos mais vendidos
// ---------------------------------------------------------------------------

function ConversionPanel({ data }: { data: DashboardOverview }) {
  const { kpis, funnel } = data;
  const talked = funnel[0]?.value ?? 0;
  return (
    <Panel className="xl:col-span-7" delay={140}>
      <PanelHeader
        title="Conversão"
        description="Do primeiro “oi” no WhatsApp até o pagamento"
        info="Clientes que pagaram ÷ clientes que conversaram no período. Cada cliente conta uma vez, mesmo com vários pedidos."
      />
      {talked === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Nenhuma conversa neste período"
          description="Quando clientes mandarem mensagem para a loja, você vê aqui quantos chegaram a finalizar o carrinho e a pagar."
          action={{ href: "/conversations", label: "Ir para o atendimento" }}
        />
      ) : (
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-4xl font-semibold tracking-tight tabular-nums text-zinc-50">{decimal.format(kpis.conversion.value)}%</p>
              <p className="mt-1 text-[13px] text-zinc-400">dos clientes que conversaram pagaram</p>
              <div className="mt-2">
                <Delta change={kpis.conversion.changePoints} hasBaseline={kpis.conversion.previous !== null} unit=" p.p." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-5">
              <SecondaryStat
                label="Conversas"
                info="Conversas em que o cliente mandou ao menos uma mensagem no período."
                value={integer.format(kpis.conversations.value)}
                delta={<Delta change={kpis.conversations.change} hasBaseline={kpis.conversations.previous > 0} />}
              />
              <SecondaryStat
                label="Clientes novos"
                info="Pessoas que falaram com a loja pela primeira vez no período."
                value={integer.format(kpis.newCustomers.value)}
                delta={<Delta change={kpis.newCustomers.change} hasBaseline={kpis.newCustomers.previous > 0} />}
              />
            </div>
          </div>
          <FunnelChart stages={funnel} />
        </div>
      )}
    </Panel>
  );
}

function TopProductsPanel({ data }: { data: DashboardOverview }) {
  return (
    <Panel className="xl:col-span-5" delay={190}>
      <PanelHeader
        title="Mais vendidos"
        description="Por faturamento no período"
        info="Receita de cada produto nos pedidos pagos. A porcentagem é a participação no faturamento de todos os produtos vendidos."
        action={<PanelLink href="/products">Produtos</PanelLink>}
      />
      {data.topProducts.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nenhum produto vendido ainda"
          description="Os produtos que mais faturam no período aparecem aqui, com unidades vendidas e participação nas vendas."
        />
      ) : (
        <TopProductsList products={data.topProducts} />
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// 4. Últimos pedidos · estoque baixo
// ---------------------------------------------------------------------------

function RecentOrdersPanel({ orders }: { orders: DashboardOverview["recentOrders"] }) {
  return (
    <Panel className="xl:col-span-7" delay={240}>
      <PanelHeader title="Últimos pedidos" description="Os mais recentes, de qualquer período" action={<PanelLink href="/orders">Todos os pedidos</PanelLink>} />
      {orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhum pedido ainda"
          description="Quando um cliente finalizar o carrinho com a Donna, o pedido aparece aqui na hora."
        />
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full text-sm sm:min-w-[520px]">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th scope="col" className="hidden px-2 pb-2 font-medium sm:table-cell">Pedido</th>
                <th scope="col" className="px-2 pb-2 font-medium">Cliente</th>
                <th scope="col" className="hidden px-2 pb-2 font-medium sm:table-cell">Data</th>
                <th scope="col" className="px-2 pb-2 text-right font-medium">Valor</th>
                <th scope="col" className="hidden px-2 pb-2 pl-6 font-medium sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
                return (
                  <tr key={order.id} className="group relative border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]">
                    <td className="hidden px-2 py-3 font-mono text-xs text-zinc-500 group-hover:text-zinc-300 sm:table-cell">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="w-full max-w-0 px-2 py-3 sm:w-auto sm:max-w-[200px]">
                      {/* O link cobre a linha inteira (after:inset-0): clicar em qualquer ponto abre o pedido. */}
                      <Link
                        href={`/orders/${order.id}`}
                        className="block truncate text-zinc-100 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-emerald-500"
                      >
                        {order.customer}
                      </Link>
                      <span className="block text-xs text-zinc-500 sm:hidden">{dateTime.format(new Date(order.createdAt))}</span>
                    </td>
                    <td className="hidden whitespace-nowrap px-2 py-3 text-zinc-400 sm:table-cell">
                      {dateTime.format(new Date(order.createdAt)).replace(".", "")}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right font-medium tabular-nums text-zinc-50">
                      {currency.format(order.total)}
                      {/* No celular o status vem embaixo do valor (a coluna Status some). */}
                      <span className={cn("mt-0.5 flex items-center justify-end gap-1.5 text-xs font-medium sm:hidden", status.text)}>
                        <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
                        {status.short}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-2 py-3 pl-6 sm:table-cell">
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", status.text)}>
                        <span className={cn("size-1.5 rounded-full", status.dot)} aria-hidden />
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/** Urgência: esgotado (vermelho) > crítico, metade do mínimo ou menos (âmbar) > baixo (neutro). */
function stockUrgency(quantity: number, min: number) {
  if (quantity <= 0) return { label: "Esgotado", className: "bg-red-400/10 text-red-300", bar: "bg-red-400" };
  if (quantity <= Math.floor(min / 2)) return { label: "Crítico", className: "bg-amber-400/10 text-amber-300", bar: "bg-amber-400" };
  return { label: "Baixo", className: "bg-white/[0.06] text-zinc-300", bar: "bg-zinc-400" };
}

function LowStockPanel({ data }: { data: DashboardOverview }) {
  const { lowStock, now } = data;
  return (
    <Panel className="xl:col-span-5" delay={290}>
      <PanelHeader
        title="Estoque baixo"
        description={
          now.lowStockCount > lowStock.length
            ? `Mostrando ${lowStock.length} de ${now.lowStockCount} produtos`
            : "Produtos no estoque mínimo ou abaixo"
        }
        action={now.lowStockCount > 0 ? <PanelLink href="/products?estoque=baixo">Ver todos</PanelLink> : undefined}
      />
      {lowStock.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Estoque em dia"
          description="Nenhum produto ativo está no estoque mínimo. Avisamos aqui quando algum começar a acabar."
        />
      ) : (
        <ul className="-mx-2 flex flex-col">
          {lowStock.map((product) => {
            const urgency = stockUrgency(product.stockQuantity, product.minStock);
            const fill = product.minStock ? Math.min(Math.max(product.stockQuantity, 0) / product.minStock, 1) * 100 : 0;
            return (
              <li key={product.id}>
                <Link
                  href={`/products?busca=${encodeURIComponent(product.name)}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-emerald-500"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-zinc-100">{product.name}</span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                        <span className={cn("block h-full rounded-full", urgency.bar)} style={{ width: `${fill}%` }} />
                      </span>
                      <span className="text-xs tabular-nums text-zinc-500">
                        {Math.max(product.stockQuantity, 0)} de mín. {product.minStock}
                      </span>
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs font-medium", urgency.className)}>{urgency.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------

/** Dashboard completo a partir dos dados já calculados (a página busca; este componente só desenha). */
export function DashboardView({ data, today }: { data: DashboardOverview; today: string }) {
  const { range } = data;
  const presetLabel = DASHBOARD_PRESETS.find((p) => p.id === range.preset)?.label;

  return (
    <div className="dash-viz mx-auto flex w-full max-w-[1360px] flex-col gap-5">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="dash-enter">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Visão geral</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {presetLabel ?? "Período personalizado"} · comparado com {comparisonText(range.days)}
          </p>
        </div>
        <DateRangeFilter presets={DASHBOARD_PRESETS} active={range.preset} from={range.from} to={range.to} today={today} />
      </header>

      {/* key: refaz as animações de entrada ao trocar de período */}
      <div key={`${range.from}:${range.to}`} className="flex flex-col gap-5">
        <AttentionStrip now={data.now} />
        <SalesPanel data={data} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <ConversionPanel data={data} />
          <TopProductsPanel data={data} />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <RecentOrdersPanel orders={data.recentOrders} />
          <LowStockPanel data={data} />
        </div>
      </div>
    </div>
  );
}
