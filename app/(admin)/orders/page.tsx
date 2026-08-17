"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";

type OrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";
type StatusFilter = OrderStatus | "all";

type OrderListItem = {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  customer: { id: string; name: string | null; whatsappPhone: string };
  items: Array<{ productName: string; quantity: number }>;
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "PAID", label: "Pagos" },
  { value: "CANCELLED", label: "Cancelados" },
  { value: "EXPIRED", label: "Expirados" },
];

const STATUS_BADGE: Record<OrderStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  PENDING: { label: "Pendente", tone: "warning" },
  PAID: { label: "Pago", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  EXPIRED: { label: "Expirado", tone: "danger" },
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function productsSummary(items: OrderListItem["items"]): string {
  if (items.length === 0) return "—";
  const first = `${items[0].productName} (x${items[0].quantity})`;
  return items.length > 1 ? `${first} +${items.length - 1}` : first;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    let ignore = false;
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";

    Promise.resolve()
      .then(() => {
        if (ignore) return undefined;
        setLoading(true);
        setError(null);
        return fetch(`/api/admin/orders${params}`).then((res) => res.json());
      })
      .then((json) => {
        if (ignore || !json) return;
        if (json.error) setError(json.error);
        else setOrders(json.data ?? []);
      })
      .catch(() => {
        if (!ignore) setError("Erro ao carregar pedidos");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Pedidos</h1>

      <div className="flex gap-1">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              {["ID", "Cliente", "Produto", "Quantidade", "Valor", "Status", "Data", "Ações"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-2 font-mono text-xs text-zinc-500">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                    {order.customer.name ?? order.customer.whatsappPhone}
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{productsSummary(order.items)}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{currency.format(order.total)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={STATUS_BADGE[order.status].tone}>{STATUS_BADGE[order.status].label}</Badge>
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {dateFormatter.format(new Date(order.createdAt))}
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/orders/${order.id}`} className="text-sm font-medium text-zinc-900 underline dark:text-zinc-50">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
