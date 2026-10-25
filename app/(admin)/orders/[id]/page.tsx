import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, MessageCircle, UserRound } from "lucide-react";
import { getCurrentStoreId } from "@/lib/current-store";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";
import { getOrder, serializeOrder } from "@/services/orders";
import { Badge } from "@/components/ui/Badge";
import { OrderActions } from "@/components/admin/OrderActions";
import { PageHeader } from "@/components/admin/page-ui";
import { Panel, currency } from "@/components/admin/ui";
import { ORDER_STATUS, paymentMethodLabel } from "@/components/admin/order-status";
import { formatPhone } from "@/components/admin/inbox/shared";

export const dynamic = "force-dynamic";

const SP = "America/Sao_Paulo";
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: SP });

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">{children}</h2>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-right text-zinc-100">{children}</dd>
    </div>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = await getCurrentStoreId();
  const order = await getOrder(storeId, id);
  if (!order) notFound();

  const data = serializeOrder(order);
  const conversation = await db.conversation.findFirst({
    where: { storeId, customerId: data.customer.id },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true },
  });

  const status = ORDER_STATUS[data.status] ?? ORDER_STATUS.PENDING;
  const code = `#${data.id.slice(-6).toUpperCase()}`;
  const customerName = data.customer.name ?? formatPhone(data.customer.whatsappPhone);
  const units = data.items.reduce((sum, item) => sum + item.quantity, 0);

  // Linha do tempo só com o que o sistema registra de verdade.
  const timeline: { label: string; at: Date; tone: "neutral" | "success" | "danger" }[] = [
    { label: "Pedido criado pela Donna no WhatsApp", at: new Date(data.createdAt), tone: "neutral" },
  ];
  if (data.payment?.paidAt) {
    timeline.push({
      label: data.payment.provider === "manual" ? "Pagamento confirmado pelo atendente" : "Pagamento confirmado",
      at: new Date(data.payment.paidAt),
      tone: "success",
    });
  } else if (data.status === "CANCELLED" || data.status === "EXPIRED") {
    timeline.push({ label: data.status === "CANCELLED" ? "Pedido cancelado" : "Pedido expirou", at: new Date(data.updatedAt), tone: "danger" });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      <PageHeader
        back={{ href: "/orders", label: "Pedidos" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Pedido <span className="font-mono">{code}</span>
            <Badge tone={status.tone} className="text-[13px]">
              {status.label}
            </Badge>
          </span>
        }
        description={`Criado em ${dateTimeFmt.format(new Date(data.createdAt))}`}
        actions={data.status === "PENDING" ? <OrderActions orderId={data.id} total={data.total} customerName={customerName} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <Panel>
            <SectionTitle>
              Itens · {units} {units === 1 ? "unidade" : "unidades"}
            </SectionTitle>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-zinc-500">
                <tr>
                  <th scope="col" className="pb-2 font-medium">Produto</th>
                  <th scope="col" className="pb-2 text-right font-medium">Qtd.</th>
                  <th scope="col" className="hidden pb-2 text-right font-medium sm:table-cell">Unitário</th>
                  <th scope="col" className="pb-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-t border-white/[0.05]">
                    <td className="py-3 pr-3 text-zinc-100">{item.productName}</td>
                    <td className="py-3 text-right tabular-nums text-zinc-300">{item.quantity}</td>
                    <td className="hidden py-3 text-right tabular-nums text-zinc-400 sm:table-cell">{currency.format(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium tabular-nums text-zinc-100">{currency.format(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td colSpan={2} className="pt-4 text-[15px] font-semibold text-zinc-50 sm:hidden">Total</td>
                  <td colSpan={3} className="hidden pt-4 text-[15px] font-semibold text-zinc-50 sm:table-cell">Total</td>
                  <td className="pt-4 text-right text-lg font-semibold tabular-nums text-zinc-50">{currency.format(data.total)}</td>
                </tr>
              </tfoot>
            </table>
          </Panel>

          <Panel>
            <SectionTitle>Histórico</SectionTitle>
            <ol className="relative flex flex-col gap-5 pl-5 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-white/10">
              {timeline.map((event) => (
                <li key={event.label} className="relative">
                  <span
                    className={cn(
                      "absolute -left-5 top-1.5 size-[11px] rounded-full ring-4 ring-zinc-950",
                      event.tone === "success" ? "bg-emerald-400" : event.tone === "danger" ? "bg-red-400" : "bg-zinc-500"
                    )}
                    aria-hidden
                  />
                  <p className="text-sm text-zinc-100">{event.label}</p>
                  <p className="text-xs text-zinc-500">{dateTimeFmt.format(event.at)}</p>
                </li>
              ))}
              {data.status === "PENDING" && (
                <li className="relative">
                  <span className="absolute -left-5 top-1.5 size-[11px] rounded-full border border-dashed border-amber-400/60 bg-zinc-950" aria-hidden />
                  <p className="text-sm text-zinc-400">Aguardando o pagamento</p>
                </li>
              )}
            </ol>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel>
            <SectionTitle>Status</SectionTitle>
            <Badge tone={status.tone} className="text-[13px]">
              {status.label}
            </Badge>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{status.description}</p>
          </Panel>

          <Panel>
            <SectionTitle>Cliente</SectionTitle>
            <p className="font-medium text-zinc-50">{data.customer.name ?? "Sem nome no WhatsApp"}</p>
            <p className="mt-0.5 text-sm text-zinc-500">{formatPhone(data.customer.whatsappPhone)}</p>
            <div className="mt-4 flex flex-col gap-1">
              {conversation && (
                <Link
                  href={`/conversations/${conversation.id}`}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
                >
                  <MessageCircle className="size-4 text-zinc-500" aria-hidden />
                  Abrir conversa
                  <ArrowUpRight className="ml-auto size-3.5 text-zinc-600" aria-hidden />
                </Link>
              )}
              <Link
                href={`/customers/${data.customer.id}`}
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
              >
                <UserRound className="size-4 text-zinc-500" aria-hidden />
                Ver perfil do cliente
                <ArrowUpRight className="ml-auto size-3.5 text-zinc-600" aria-hidden />
              </Link>
            </div>
          </Panel>

          <Panel>
            <SectionTitle>Pagamento</SectionTitle>
            {data.payment ? (
              <dl className="-my-2 divide-y divide-white/[0.05]">
                <Field label="Forma">{paymentMethodLabel(data.payment.provider)}</Field>
                <Field label="Valor">{currency.format(data.payment.amount)}</Field>
                {data.payment.paidAt && <Field label="Pago em">{dateTimeFmt.format(new Date(data.payment.paidAt))}</Field>}
                {data.payment.externalId && data.payment.provider !== "manual" && (
                  <Field label="ID da transação">
                    <span className="break-all font-mono text-xs">{data.payment.externalId}</span>
                  </Field>
                )}
              </dl>
            ) : data.status === "PENDING" ? (
              <p className="text-sm leading-relaxed text-zinc-400">
                Nenhum pagamento registrado. Depois que o cliente pagar pelo link enviado no atendimento, use{" "}
                <span className="text-zinc-200">Marcar como pago</span>.
              </p>
            ) : (
              <p className="text-sm text-zinc-500">Nenhum pagamento registrado para este pedido.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
