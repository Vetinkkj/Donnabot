"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Receipt, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, currency } from "@/components/admin/ui";
import { ErrorBanner, FilterSelect, PageHeader, SearchField, Segmented, SkeletonRows, tableStyles } from "@/components/admin/page-ui";
import { ORDER_STATUS, paymentMethodLabel } from "@/components/admin/order-status";
import { formatPhone } from "@/components/admin/inbox/shared";
import { cn } from "@/lib/cn";

type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
type StatusFilter = OrderStatus | "all";
type Period = "all" | "today" | "7d" | "30d" | "month";
type Sort = "recent" | "oldest" | "highest" | "lowest";

type OrderListItem = {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  customer: { id: string; name: string | null; whatsappPhone: string };
  items: Array<{ productName: string; quantity: number }>;
  payment: { provider: string; status: string; paidAt: string | null } | null;
};

const PAGE_SIZE = 20;
const SP = "America/Sao_Paulo";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: SP });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "2-digit", timeZone: SP });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: SP });

const STATUS_VALUES: StatusFilter[] = ["all", "PENDING", "PAID", "CANCELLED", "EXPIRED"];

function orderCode(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function itemsSummary(items: OrderListItem["items"]) {
  if (items.length === 0) return "Sem itens";
  const first = `${items[0].quantity}× ${items[0].productName}`;
  return items.length > 1 ? `${first} +${items.length - 1}` : first;
}

/** Início (inclusive) do período, em YYYY-MM-DD no fuso de São Paulo. */
function periodStart(period: Period): string | null {
  const now = new Date();
  const today = dayKey.format(now);
  if (period === "today") return today;
  if (period === "7d") return dayKey.format(new Date(now.getTime() - 6 * 86_400_000));
  if (period === "30d") return dayKey.format(new Date(now.getTime() - 29 * 86_400_000));
  if (period === "month") return `${today.slice(0, 7)}-01`;
  return null;
}

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>(() => {
    const fromUrl = searchParams.get("status") as StatusFilter | null;
    return fromUrl && STATUS_VALUES.includes(fromUrl) ? fromUrl : "all";
  });
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar pedidos");
      setOrders(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pedidos");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Base para as contagens das abas: busca + período (sem o filtro de status).
  const base = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/^#/, "");
    const digits = term.replace(/\D/g, "");
    const start = periodStart(period);
    return (orders ?? []).filter((order) => {
      if (start && dayKey.format(new Date(order.createdAt)) < start) return false;
      if (!term) return true;
      return (
        order.id.slice(-6).toLowerCase().includes(term) ||
        (order.customer.name ?? "").toLowerCase().includes(term) ||
        (digits.length >= 3 && order.customer.whatsappPhone.includes(digits)) ||
        order.items.some((item) => item.productName.toLowerCase().includes(term))
      );
    });
  }, [orders, query, period]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: base.length, PENDING: 0, PAID: 0, CANCELLED: 0, EXPIRED: 0 };
    for (const order of base) c[order.status] += 1;
    return c;
  }, [base]);

  const filtered = useMemo(() => {
    const list = status === "all" ? base : base.filter((order) => order.status === status);
    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "oldest") sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sort === "highest") sorted.sort((a, b) => b.total - a.total);
    if (sort === "lowest") sorted.sort((a, b) => a.total - b.total);
    return sorted;
  }, [base, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pendingTotal = (orders ?? []).filter((o) => o.status === "PENDING").reduce((sum, o) => sum + o.total, 0);
  const pendingCount = (orders ?? []).filter((o) => o.status === "PENDING").length;
  const hasFilters = status !== "all" || query !== "" || period !== "all" || sort !== "recent";

  function resetFilters() {
    setStatus("all");
    setQuery("");
    setPeriod("all");
    setSort("recent");
    setPage(1);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5">
      <PageHeader
        title="Pedidos"
        description={
          orders === null
            ? "Carregando pedidos…"
            : pendingCount > 0
              ? `${pendingCount} aguardando pagamento · ${currency.format(pendingTotal)} a receber`
              : "Nenhum pedido aguardando pagamento"
        }
      />

      <div className="flex flex-col gap-3">
        <Segmented<StatusFilter>
          label="Status do pedido"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: "all", label: "Todos", count: counts.all },
            { value: "PENDING", label: "Pendentes", count: counts.PENDING },
            { value: "PAID", label: "Pagos", count: counts.PAID },
            { value: "CANCELLED", label: "Cancelados", count: counts.CANCELLED },
            { value: "EXPIRED", label: "Expirados", count: counts.EXPIRED },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Nº do pedido, cliente ou produto"
            label="Buscar pedidos"
            className="w-full sm:w-72"
          />
          <FilterSelect<Period>
            label="Período"
            value={period}
            onChange={(value) => {
              setPeriod(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: "Qualquer data" },
              { value: "today", label: "Hoje" },
              { value: "7d", label: "Últimos 7 dias" },
              { value: "30d", label: "Últimos 30 dias" },
              { value: "month", label: "Este mês" },
            ]}
          />
          <FilterSelect<Sort>
            label="Ordenar"
            value={sort}
            onChange={setSort}
            options={[
              { value: "recent", label: "Mais recentes" },
              { value: "oldest", label: "Mais antigos" },
              { value: "highest", label: "Maior valor" },
              { value: "lowest", label: "Menor valor" },
            ]}
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className={cn(tableStyles.wrap, "dash-enter")}>
        {orders === null && !error && <SkeletonRows rows={8} />}

        {orders && orders.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="Nenhum pedido ainda"
            description="Quando um cliente finalizar o carrinho com a Donna no WhatsApp, o pedido aparece aqui na hora."
            className="py-16"
          />
        )}

        {orders && orders.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchX className="size-6 text-zinc-500" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-200">Nenhum pedido com esses filtros</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={resetFilters}>
              Limpar filtros
            </Button>
          </div>
        )}

        {pageItems.length > 0 && (
          <>
            {/* Tabela (tablet para cima) */}
            <table className="hidden w-full text-sm md:table">
              <thead className={tableStyles.head}>
                <tr>
                  <th scope="col" className={tableStyles.th}>Pedido</th>
                  <th scope="col" className={tableStyles.th}>Cliente</th>
                  <th scope="col" className={cn(tableStyles.th, "hidden lg:table-cell")}>Data</th>
                  <th scope="col" className={cn(tableStyles.th, "hidden xl:table-cell")}>Pagamento</th>
                  <th scope="col" className={tableStyles.th}>Status</th>
                  <th scope="col" className={cn(tableStyles.th, "text-right")}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((order) => {
                  const meta = ORDER_STATUS[order.status];
                  return (
                    <tr key={order.id} className={tableStyles.row}>
                      <td className={tableStyles.td}>
                        <Link href={`/orders/${order.id}`} className={cn("font-mono text-[13px] text-zinc-200", tableStyles.rowLink)}>
                          {orderCode(order.id)}
                        </Link>
                        <span className="mt-0.5 block max-w-[240px] truncate text-xs text-zinc-500">{itemsSummary(order.items)}</span>
                      </td>
                      <td className={cn(tableStyles.td, "max-w-[220px]")}>
                        <span className="block truncate text-zinc-100">{order.customer.name ?? formatPhone(order.customer.whatsappPhone)}</span>
                        {order.customer.name && <span className="block truncate text-xs text-zinc-500">{formatPhone(order.customer.whatsappPhone)}</span>}
                      </td>
                      <td className={cn(tableStyles.td, "hidden whitespace-nowrap lg:table-cell")}>
                        <span className="block text-zinc-300">{dateFmt.format(new Date(order.createdAt)).replace(/\./g, "")}</span>
                        <span className="block text-xs text-zinc-500">{timeFmt.format(new Date(order.createdAt))}</span>
                      </td>
                      <td className={cn(tableStyles.td, "hidden text-[13px] text-zinc-400 xl:table-cell")}>
                        {paymentMethodLabel(order.payment?.provider) ?? <span className="text-zinc-600">—</span>}
                      </td>
                      <td className={tableStyles.td}>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className={cn(tableStyles.td, "text-right font-medium tabular-nums text-zinc-50")}>
                        {currency.format(order.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Lista (celular) */}
            <ul className="md:hidden">
              {pageItems.map((order) => {
                const meta = ORDER_STATUS[order.status];
                return (
                  <li key={order.id} className="border-t border-white/[0.05] first:border-t-0">
                    <Link href={`/orders/${order.id}`} className="flex flex-col gap-1.5 px-4 py-3.5 active:bg-white/[0.03]">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-medium text-zinc-100">
                          {order.customer.name ?? formatPhone(order.customer.whatsappPhone)}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-50">{currency.format(order.total)}</span>
                      </span>
                      <span className="truncate text-xs text-zinc-500">
                        {orderCode(order.id)} · {itemsSummary(order.items)}
                      </span>
                      <span className="flex items-center justify-between gap-3">
                        <Badge tone={meta.tone}>{meta.short}</Badge>
                        <span className="text-xs text-zinc-500">
                          {dateFmt.format(new Date(order.createdAt)).replace(/\./g, "")}, {timeFmt.format(new Date(order.createdAt))}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <nav aria-label="Paginação" className="flex items-center justify-between gap-3 text-[13px] text-zinc-500">
          <span>
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <span className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Página anterior">
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pages} aria-label="Próxima página">
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </span>
        </nav>
      )}
    </div>
  );
}
