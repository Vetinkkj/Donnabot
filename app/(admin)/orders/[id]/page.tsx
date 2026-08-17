import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStoreId } from "@/lib/current-store";
import { getOrder, serializeOrder } from "@/services/orders";
import { Badge } from "@/components/ui/Badge";
import { CancelOrderButton } from "@/components/admin/CancelOrderButton";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" });

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  PENDING: { label: "Pendente", tone: "warning" },
  PAID: { label: "Pago", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  EXPIRED: { label: "Expirado", tone: "danger" },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = await getCurrentStoreId();
  const order = await getOrder(storeId, id);

  if (!order) notFound();

  const data = serializeOrder(order);
  const status = STATUS_LABEL[data.status] ?? STATUS_LABEL.PENDING;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/orders" className="text-sm text-zinc-500 underline">
          ← Voltar para pedidos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Pedido #{data.id.slice(-6).toUpperCase()}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">Cliente</h2>
          <p className="text-zinc-900 dark:text-zinc-50">{data.customer.name ?? "Sem nome"}</p>
          <p className="text-sm text-zinc-500">{data.customer.whatsappPhone}</p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">Status e data</h2>
          <Badge tone={status.tone}>{status.label}</Badge>
          <p className="mt-2 text-sm text-zinc-500">{dateFormatter.format(new Date(data.createdAt))}</p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:col-span-2">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">Produtos</h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">
                  {item.productName} x{item.quantity}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">{currency.format(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-sm font-semibold dark:border-zinc-800">
            <span>Total</span>
            <span>{currency.format(data.total)}</span>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:col-span-2">
          <h2 className="mb-2 text-sm font-medium text-zinc-500">Pagamento</h2>
          {data.payment ? (
            <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              <span>Forma: PIX ({data.payment.provider})</span>
              <span>Status: {data.payment.status}</span>
              <span className="break-all">ID da transação: {data.payment.externalId ?? "—"}</span>
              {data.payment.paidAt && <span>Pago em: {dateFormatter.format(new Date(data.payment.paidAt))}</span>}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Nenhuma cobrança gerada ainda.</p>
          )}
        </section>
      </div>

      {data.status === "PENDING" && <CancelOrderButton orderId={data.id} />}
    </div>
  );
}
