"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner, Skeleton } from "@/components/admin/page-ui";
import { currency } from "@/components/admin/ui";
import { ORDER_STATUS } from "@/components/admin/order-status";
import type { CustomerProfile } from "@/services/customers";
import { formatPhone } from "./shared";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

type Profile = Omit<CustomerProfile, "createdAt" | "stats" | "orders" | "conversation"> & {
  createdAt: string;
  stats: Omit<CustomerProfile["stats"], "lastPurchaseAt"> & { lastPurchaseAt: string | null };
  conversation: { lastMessageAt: string } | null;
  orders: (Omit<CustomerProfile["orders"][number], "createdAt" | "paidAt"> & { createdAt: string })[];
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right text-zinc-200">{children}</dd>
    </div>
  );
}

/** Dados do cliente ao lado da conversa (só em telas largas; recolhível). */
export function CustomerPanel({ customerId }: { customerId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/admin/customers/${customerId}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao carregar cliente");
        if (!ignore) {
          setProfile(json.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Erro ao carregar cliente");
      });
    return () => {
      ignore = true;
    };
  }, [customerId, attempt]);

  return (
    <aside
      aria-label="Dados do cliente"
      className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-white/[0.06] 2xl:flex"
    >
      {error && !profile && (
        <div className="p-4">
          <ErrorBanner message={error} onRetry={() => setAttempt((n) => n + 1)} />
        </div>
      )}
      {!profile && !error && (
        <div className="flex flex-col gap-3 p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="mt-4 h-16 w-full rounded-xl" />
        </div>
      )}
      {profile && (
        <div className="flex flex-col gap-6 p-5">
          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Cliente</h2>
            <dl className="mt-2">
              <Row label="WhatsApp">{formatPhone(profile.whatsappPhone)}</Row>
              <Row label="Cliente desde">{dateFmt.format(new Date(profile.createdAt))}</Row>
              {profile.conversation && (
                <Row label="Última mensagem">{dateTimeFmt.format(new Date(profile.conversation.lastMessageAt))}</Row>
              )}
            </dl>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Compras</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-[11px] text-zinc-500">Pedidos pagos</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-50">{profile.stats.paidOrdersCount}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-[11px] text-zinc-500">Total gasto</p>
                <p className="mt-1 truncate text-lg font-semibold tabular-nums text-zinc-50">
                  {currency.format(profile.stats.totalSpent)}
                </p>
              </div>
            </div>
            {profile.stats.lastPurchaseAt && (
              <p className="mt-2 text-xs text-zinc-500">
                Última compra em {dateFmt.format(new Date(profile.stats.lastPurchaseAt))}
              </p>
            )}
          </section>

          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Pedidos</h2>
              {profile.orders.length > 0 && <span className="text-xs text-zinc-600">{profile.orders.length} no total</span>}
            </div>
            {profile.orders.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-zinc-500">
                <Receipt className="size-4" aria-hidden />
                Nenhum pedido ainda
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {profile.orders.slice(0, 5).map((order) => {
                  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.PENDING;
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/orders/${order.id}`}
                        className="block rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-emerald-500"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-zinc-500">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className="text-[13px] font-medium tabular-nums text-zinc-100">{currency.format(order.total)}</span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-zinc-500">{order.summary}</span>
                          <Badge tone={status.tone}>{status.short}</Badge>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <Link
            href={`/customers/${profile.id}`}
            className="inline-flex items-center gap-1 self-start rounded text-[13px] font-medium text-zinc-400 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            Ver perfil completo
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      )}
    </aside>
  );
}
