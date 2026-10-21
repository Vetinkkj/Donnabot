import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Headset,
  MessageCircle,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { getCurrentStoreId } from "@/lib/current-store";
import { DASHBOARD_PERIODS, getDashboardOverview, type DashboardPeriod } from "@/services/dashboard";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { FunnelChart, TopProductsChart } from "@/components/admin/dashboard/BarCharts";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const dateTime = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const ORDER_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  PENDING: { label: "Pendente", tone: "warning" },
  PAID: { label: "Pago", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  EXPIRED: { label: "Expirado", tone: "danger" },
};

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Variação vs período anterior: seta + texto (a cor nunca carrega o sentido sozinha). */
function Delta({ change, unit = "%" }: { change: number | null; unit?: "%" | " p.p." }) {
  if (change === null) return <span className="text-xs text-zinc-500">novo no período</span>;
  if (Math.abs(change) < 0.05) return <span className="text-xs text-zinc-500">igual ao período anterior</span>;
  const up = change > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-medium"
      style={{ color: up ? "var(--viz-up)" : "var(--viz-down)" }}
    >
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : "−"}
      {decimal.format(Math.abs(change))}
      {unit}
      <span className="ml-1 font-normal text-zinc-500">vs anterior</span>
    </span>
  );
}

function Kpi({ icon: Icon, label, value, delta }: { icon: typeof Wallet; label: string; value: string; delta: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="grid size-7 place-items-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <Icon className="size-4" aria-hidden />
        </span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
      <div className="mt-1">{delta}</div>
    </div>
  );
}

function NowItem({
  icon: Icon,
  label,
  value,
  href,
  alert,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-lg ${
          alert
            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {alert ? <AlertTriangle className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50">{value}</span>
        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      </span>
    </Link>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo } = await searchParams;
  const days = (DASHBOARD_PERIODS as readonly number[]).includes(Number(periodo)) ? (Number(periodo) as DashboardPeriod) : 30;

  const storeId = await getCurrentStoreId();
  const data = await getDashboardOverview(storeId, days);
  const { kpis } = data;

  return (
    <div className="dash-viz flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Últimos {days} dias, comparado com os {days} dias anteriores
          </p>
        </div>
        <nav aria-label="Período" className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {DASHBOARD_PERIODS.map((option) => (
            <Link
              key={option}
              href={`/dashboard?periodo=${option}`}
              aria-current={option === days ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                option === days
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              }`}
            >
              {option} dias
            </Link>
          ))}
        </nav>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Agora</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <NowItem
            icon={Headset}
            label="Aguardando atendente"
            value={data.now.waitingHuman}
            href="/conversations"
            alert={data.now.waitingHuman > 0}
          />
          <NowItem icon={Users} label="Em atendimento humano" value={data.now.withHuman} href="/conversations" />
          <NowItem icon={ShoppingCart} label="Pedidos pendentes" value={data.now.pendingOrders} href="/orders" />
          <NowItem
            icon={Package}
            label={`Estoque baixo (de ${data.now.productsCount} produtos)`}
            value={data.now.lowStockCount}
            href="/products"
            alert={data.now.lowStockCount > 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi icon={Wallet} label="Faturamento" value={currency.format(kpis.revenue.value)} delta={<Delta change={kpis.revenue.change} />} />
        <Kpi icon={Receipt} label="Pedidos pagos" value={String(kpis.paidOrders.value)} delta={<Delta change={kpis.paidOrders.change} />} />
        <Kpi
          icon={TrendingUp}
          label="Ticket médio"
          value={currency.format(kpis.averageTicket.value)}
          delta={<Delta change={kpis.averageTicket.change} />}
        />
        <Kpi
          icon={MessageCircle}
          label="Conversas atendidas"
          value={String(kpis.conversations.value)}
          delta={<Delta change={kpis.conversations.change} />}
        />
        <Kpi
          icon={ShoppingCart}
          label="Conversão (conversa → pedido pago)"
          value={`${decimal.format(kpis.conversion.value)}%`}
          delta={<Delta change={kpis.conversion.changePoints} unit=" p.p." />}
        />
        <Kpi icon={UserPlus} label="Clientes novos" value={String(kpis.newCustomers.value)} delta={<Delta change={kpis.newCustomers.change} />} />
      </div>

      <Card title="Faturamento por dia" subtitle="Pedidos marcados como pagos, pela data do pagamento">
        <RevenueChart data={data.series} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Funil de vendas" subtitle="Do primeiro contato no WhatsApp até o pagamento">
          <FunnelChart stages={data.funnel} />
        </Card>
        <Card
          title="Produtos mais vendidos"
          subtitle="Por faturamento no período"
          action={
            <Link href="/products" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
              Ver produtos →
            </Link>
          }
        >
          <TopProductsChart products={data.topProducts} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card
            title="Últimos pedidos"
            action={
              <Link href="/orders" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
                Ver todos →
              </Link>
            }
          >
            {data.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">Nenhum pedido ainda.</p>
            ) : (
              <div className="-mx-2 divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.recentOrders.map((order) => {
                  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    >
                      <span className="font-mono text-xs text-zinc-500">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-zinc-900 dark:text-zinc-50">{order.customer}</span>
                        <span className="block text-xs text-zinc-500">{dateTime.format(new Date(order.createdAt))}</span>
                      </span>
                      <span className="tabular-nums text-zinc-900 dark:text-zinc-50">{currency.format(order.total)}</span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card
            title="Estoque baixo"
            subtitle="Abaixo ou no estoque mínimo"
            action={
              <Link href="/products" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
                Ver produtos →
              </Link>
            }
          >
            {data.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">Tudo certo com o estoque. 👍</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.lowStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-zinc-900 dark:text-zinc-50">{product.name}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs">
                      <AlertTriangle
                        className={`size-3.5 ${product.stockQuantity === 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}
                        aria-hidden
                      />
                      <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                        {product.stockQuantity === 0 ? "Esgotado" : `${product.stockQuantity} un.`}
                      </span>
                      <span className="text-zinc-400">/ mín. {product.minStock}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
