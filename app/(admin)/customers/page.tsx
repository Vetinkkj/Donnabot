"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, currency, integer } from "@/components/admin/ui";
import { Avatar, ErrorBanner, FilterSelect, PageHeader, SearchField, Segmented, SkeletonRows, tableStyles } from "@/components/admin/page-ui";
import { displayName, formatPhone } from "@/components/admin/inbox/shared";
import { cn } from "@/lib/cn";

type Customer = {
  id: string;
  name: string | null;
  whatsappPhone: string;
  ordersCount: number;
  paidOrdersCount: number;
  totalSpent: number;
  lastPurchaseAt: string | null;
  conversationId: string | null;
  lastInteractionAt: string | null;
  createdAt: string;
};

type Segment = "all" | "buyers" | "recurring" | "no-purchase" | "new";
type Sort = "recent" | "spent" | "last-purchase" | "name";

const NEW_DAYS = 30;
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });

function formatDate(iso: string | null) {
  return iso ? dateFmt.format(new Date(iso)).replace(/\./g, "") : null;
}

function isNew(customer: Customer) {
  return Date.now() - new Date(customer.createdAt).getTime() < NEW_DAYS * 86_400_000;
}

/** Recorrente = 2 ou mais pedidos pagos. Novo = primeiro contato nos últimos 30 dias. */
function CustomerTag({ customer }: { customer: Customer }) {
  if (customer.paidOrdersCount >= 2) return <Badge tone="success">Recorrente</Badge>;
  if (isNew(customer)) return <Badge tone="info">Novo</Badge>;
  return null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar clientes");
      setCustomers(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar clientes");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const searched = useMemo(() => {
    const term = query.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    return (customers ?? []).filter(
      (c) => !term || (c.name ?? "").toLowerCase().includes(term) || (digits.length >= 3 && c.whatsappPhone.includes(digits))
    );
  }, [customers, query]);

  const counts = useMemo(
    () => ({
      all: searched.length,
      buyers: searched.filter((c) => c.paidOrdersCount > 0).length,
      recurring: searched.filter((c) => c.paidOrdersCount >= 2).length,
      "no-purchase": searched.filter((c) => c.paidOrdersCount === 0).length,
      new: searched.filter(isNew).length,
    }),
    [searched]
  );

  const visible = useMemo(() => {
    const list = searched.filter((c) => {
      if (segment === "buyers") return c.paidOrdersCount > 0;
      if (segment === "recurring") return c.paidOrdersCount >= 2;
      if (segment === "no-purchase") return c.paidOrdersCount === 0;
      if (segment === "new") return isNew(c);
      return true;
    });
    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "spent") sorted.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sort === "last-purchase") sorted.sort((a, b) => (b.lastPurchaseAt ?? "").localeCompare(a.lastPurchaseAt ?? ""));
    if (sort === "name") sorted.sort((a, b) => displayName(a).localeCompare(displayName(b), "pt-BR"));
    return sorted;
  }, [searched, segment, sort]);

  const buyers = (customers ?? []).filter((c) => c.paidOrdersCount > 0).length;
  const hasFilters = query !== "" || segment !== "all";

  return (
    <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-5">
      <PageHeader
        title="Clientes"
        description={
          customers === null
            ? "Carregando clientes…"
            : `${integer.format(customers.length)} ${customers.length === 1 ? "pessoa falou" : "pessoas falaram"} com a loja · ${integer.format(buyers)} já compraram`
        }
      />

      <div className="flex flex-col gap-3">
        <Segmented<Segment>
          label="Segmento"
          value={segment}
          onChange={setSegment}
          options={[
            { value: "all", label: "Todos", count: counts.all },
            { value: "buyers", label: "Compraram", count: counts.buyers },
            { value: "recurring", label: "Recorrentes", count: counts.recurring },
            { value: "no-purchase", label: "Sem compras", count: counts["no-purchase"] },
            { value: "new", label: `Novos (${NEW_DAYS} dias)`, count: counts.new },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={query} onChange={setQuery} placeholder="Nome ou telefone" label="Buscar clientes" className="w-full sm:w-64" />
          <FilterSelect<Sort>
            label="Ordenar"
            value={sort}
            onChange={setSort}
            options={[
              { value: "recent", label: "Mais recentes" },
              { value: "spent", label: "Maior gasto" },
              { value: "last-purchase", label: "Última compra" },
              { value: "name", label: "Nome (A–Z)" },
            ]}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setSegment("all");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className={cn(tableStyles.wrap, "dash-enter")}>
        {customers === null && !error && <SkeletonRows rows={8} />}

        {customers && customers.length === 0 && (
          <EmptyState
            icon={Users}
            title="Nenhum cliente ainda"
            description="Cada pessoa que mandar mensagem para o WhatsApp da loja vira um cliente aqui, com o histórico de pedidos."
            className="py-16"
          />
        )}

        {customers && customers.length > 0 && visible.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchX className="size-6 text-zinc-500" aria-hidden />
            <p className="mt-3 text-sm font-medium text-zinc-200">Nenhum cliente com esse filtro</p>
          </div>
        )}

        {visible.length > 0 && (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead className={tableStyles.head}>
                <tr>
                  <th scope="col" className={tableStyles.th}>Cliente</th>
                  <th scope="col" className={cn(tableStyles.th, "text-right")}>Pedidos pagos</th>
                  <th scope="col" className={cn(tableStyles.th, "text-right")}>Total gasto</th>
                  <th scope="col" className={cn(tableStyles.th, "hidden lg:table-cell")}>Última compra</th>
                  <th scope="col" className={cn(tableStyles.th, "hidden xl:table-cell")}>Cliente desde</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => (
                  <tr key={customer.id} className={tableStyles.row}>
                    <td className={tableStyles.td}>
                      <span className="flex items-center gap-3">
                        <Avatar name={customer.name} className="size-8" />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <Link href={`/customers/${customer.id}`} className={cn("truncate font-medium text-zinc-100", tableStyles.rowLink)}>
                              {displayName(customer)}
                            </Link>
                            <CustomerTag customer={customer} />
                          </span>
                          {customer.name && <span className="block text-xs text-zinc-500">{formatPhone(customer.whatsappPhone)}</span>}
                        </span>
                      </span>
                    </td>
                    <td className={cn(tableStyles.td, "text-right tabular-nums text-zinc-300")}>
                      {customer.paidOrdersCount}
                      {customer.ordersCount > customer.paidOrdersCount && (
                        <span className="text-xs text-zinc-600"> / {customer.ordersCount}</span>
                      )}
                    </td>
                    <td className={cn(tableStyles.td, "text-right font-medium tabular-nums", customer.totalSpent ? "text-zinc-100" : "text-zinc-600")}>
                      {customer.totalSpent ? currency.format(customer.totalSpent) : "—"}
                    </td>
                    <td className={cn(tableStyles.td, "hidden text-zinc-400 lg:table-cell")}>
                      {formatDate(customer.lastPurchaseAt) ?? <span className="text-zinc-600">Nunca comprou</span>}
                    </td>
                    <td className={cn(tableStyles.td, "hidden text-zinc-500 xl:table-cell")}>{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="md:hidden">
              {visible.map((customer) => (
                <li key={customer.id} className="border-t border-white/[0.05] first:border-t-0">
                  <Link href={`/customers/${customer.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.03]">
                    <Avatar name={customer.name} className="size-9" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-zinc-100">{displayName(customer)}</span>
                        <CustomerTag customer={customer} />
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {customer.paidOrdersCount} {customer.paidOrdersCount === 1 ? "pedido pago" : "pedidos pagos"}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-200">
                      {customer.totalSpent ? currency.format(customer.totalSpent) : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {customers && customers.length > 0 && (
        <p className="text-xs text-zinc-600">
          Total gasto e pedidos pagos contam só pedidos com pagamento confirmado. “Recorrente” = 2 ou mais pedidos pagos.
        </p>
      )}
    </div>
  );
}
