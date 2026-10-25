import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Receipt } from "lucide-react";
import { getCurrentStoreId } from "@/lib/current-store";
import { cn } from "@/lib/cn";
import { getCustomerProfile } from "@/services/customers";
import { Badge } from "@/components/ui/Badge";
import { Avatar, PageHeader, tableStyles } from "@/components/admin/page-ui";
import { EmptyState, Panel, currency } from "@/components/admin/ui";
import { ORDER_STATUS } from "@/components/admin/order-status";
import { STATUS_META, displayName, formatPhone } from "@/components/admin/inbox/shared";

export const dynamic = "force-dynamic";

const SP = "America/Sao_Paulo";
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: SP });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: SP });

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/[0.03] px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tabular-nums text-zinc-50">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const storeId = await getCurrentStoreId();
  const customer = await getCustomerProfile(storeId, id);
  if (!customer) notFound();

  const { stats, conversation } = customer;
  const recurring = stats.paidOrdersCount >= 2;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      <PageHeader
        back={{ href: "/customers", label: "Clientes" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={customer.name} className="size-11 text-sm" />
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                {displayName(customer)}
                {recurring && <Badge tone="success">Recorrente</Badge>}
              </span>
              <span className="block text-sm font-normal text-zinc-500">
                {formatPhone(customer.whatsappPhone)} · cliente desde {dateFmt.format(customer.createdAt).replace(/\./g, "")}
              </span>
            </span>
          </span>
        }
        actions={
          conversation ? (
            <Link
              href={`/conversations/${conversation.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <MessageCircle className="size-4" aria-hidden />
              Abrir conversa
            </Link>
          ) : undefined
        }
      />

      <div className="dash-enter grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pedidos pagos" value={stats.paidOrdersCount} hint={stats.ordersCount > stats.paidOrdersCount ? `${stats.ordersCount} pedidos no total` : undefined} />
        <Stat label="Total gasto" value={currency.format(stats.totalSpent)} />
        <Stat label="Ticket médio" value={stats.averageTicket !== null ? currency.format(stats.averageTicket) : "—"} />
        <Stat label="Última compra" value={stats.lastPurchaseAt ? dateFmt.format(stats.lastPurchaseAt).replace(/\./g, "") : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className={cn(tableStyles.wrap, "dash-enter")} aria-label="Pedidos do cliente">
          <h2 className="border-b border-white/[0.06] px-5 py-4 text-[15px] font-semibold text-zinc-50">Pedidos</h2>
          {customer.orders.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhum pedido ainda"
              description="Quando este cliente finalizar um carrinho com a Donna, o pedido aparece aqui."
            />
          ) : (
            <ul>
              {customer.orders.map((order) => {
                const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
                return (
                  <li key={order.id} className={tableStyles.row}>
                    <div className="flex items-center gap-4 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <Link href={`/orders/${order.id}`} className={cn("font-mono text-[13px] text-zinc-200", tableStyles.rowLink)}>
                          #{order.id.slice(-6).toUpperCase()}
                        </Link>
                        <p className="truncate text-xs text-zinc-500">{order.summary || "Sem itens"}</p>
                      </div>
                      <span className="hidden text-xs text-zinc-500 sm:block">{dateTimeFmt.format(order.createdAt).replace(/\./g, "")}</span>
                      <Badge tone={status.tone}>{status.short}</Badge>
                      <span className="w-24 text-right text-sm font-medium tabular-nums text-zinc-100">{currency.format(order.total)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <Panel>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Atendimento</h2>
            {conversation ? (
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Situação</dt>
                  <dd>
                    <Badge tone={STATUS_META[conversation.status].tone}>{STATUS_META[conversation.status].label}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Mensagens trocadas</dt>
                  <dd className="tabular-nums text-zinc-200">{conversation.messagesCount}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Última mensagem</dt>
                  <dd className="text-zinc-200">{dateTimeFmt.format(conversation.lastMessageAt).replace(/\./g, "")}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">Nenhuma conversa registrada.</p>
            )}
          </Panel>
          <Panel>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Contato</h2>
            <p className="text-sm text-zinc-200">{formatPhone(customer.whatsappPhone)}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Nome vindo do perfil do WhatsApp do cliente. A Donna não guarda outros dados pessoais.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
