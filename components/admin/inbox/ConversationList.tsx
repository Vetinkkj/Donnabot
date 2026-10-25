"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessagesSquare, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, ErrorBanner, SearchField, Segmented, SkeletonRows } from "@/components/admin/page-ui";
import { EmptyState } from "@/components/admin/ui";
import {
  STATUS_META,
  displayName,
  formatListTime,
  type ConversationListItem,
  type ConversationStatus,
} from "./shared";

type Filter = "all" | ConversationStatus;

const REFRESH_MS = 8000;

/**
 * Coluna de conversas. Fica no layout de /conversations, então continua
 * montada (com busca e filtro) enquanto você troca de conversa.
 */
export function ConversationList() {
  const params = useParams<{ id?: string }>();
  const selectedId = params?.id;
  const [conversations, setConversations] = useState<ConversationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/conversations", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar conversas");
      setConversations(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conversas");
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [load]);

  const counts = useMemo(() => {
    const list = conversations ?? [];
    return {
      all: list.length,
      WAITING_HUMAN: list.filter((c) => c.status === "WAITING_HUMAN").length,
      HUMAN: list.filter((c) => c.status === "HUMAN").length,
      BOT: list.filter((c) => c.status === "BOT").length,
    };
  }, [conversations]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    return (conversations ?? []).filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!term) return true;
      return (
        (c.customer.name ?? "").toLowerCase().includes(term) ||
        (digits.length >= 3 && c.customer.whatsappPhone.includes(digits)) ||
        (c.lastMessage ?? "").toLowerCase().includes(term)
      );
    });
  }, [conversations, filter, query]);

  return (
    <aside
      aria-label="Conversas"
      className={cn(
        "flex min-h-0 w-full shrink-0 flex-col border-white/[0.06] md:w-[320px] md:border-r xl:w-[340px]",
        selectedId && "hidden md:flex"
      )}
    >
      <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">Atendimento</h1>
          {counts.WAITING_HUMAN > 0 && (
            <span className="text-xs font-medium text-amber-300">
              {counts.WAITING_HUMAN} aguardando
            </span>
          )}
        </div>
        <SearchField value={query} onChange={setQuery} placeholder="Nome, telefone ou mensagem" label="Buscar conversa" />
        <Segmented<Filter>
          label="Filtrar conversas"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todas", count: counts.all },
            { value: "WAITING_HUMAN", label: "Aguardando", count: counts.WAITING_HUMAN },
            { value: "HUMAN", label: "Atendente", count: counts.HUMAN },
            { value: "BOT", label: "Donna", count: counts.BOT },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && !conversations && (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={load} />
          </div>
        )}
        {!conversations && !error && <SkeletonRows rows={7} />}
        {conversations && conversations.length === 0 && (
          <EmptyState
            icon={MessagesSquare}
            title="Nenhuma conversa ainda"
            description="Quando um cliente mandar mensagem para o WhatsApp da loja, a conversa aparece aqui."
            className="py-16"
          />
        )}
        {conversations && conversations.length > 0 && visible.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="Nada encontrado"
            description="Nenhuma conversa com esse filtro ou busca."
            className="py-16"
          />
        )}
        <ul className="flex flex-col p-2">
          {visible.map((conversation) => {
            const meta = STATUS_META[conversation.status];
            const active = conversation.id === selectedId;
            const waiting = conversation.status === "WAITING_HUMAN";
            return (
              <li key={conversation.id}>
                <Link
                  href={`/conversations/${conversation.id}`}
                  scroll={false}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex gap-3 rounded-xl px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500",
                    active ? "bg-white/[0.07]" : "hover:bg-white/[0.035]"
                  )}
                >
                  <span className="relative">
                    <Avatar name={conversation.customer.name ?? undefined} />
                    {waiting && (
                      <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-amber-400 ring-2 ring-zinc-950" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("truncate text-sm", waiting ? "font-semibold text-zinc-50" : "font-medium text-zinc-200")}>
                        {displayName(conversation.customer)}
                      </span>
                      <span className={cn("shrink-0 text-[11px] tabular-nums", waiting ? "text-amber-300" : "text-zinc-500")}>
                        {formatListTime(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-500">
                        {conversation.lastMessage?.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim() ||
                          "Sem mensagens"}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-px text-[10px] font-medium uppercase tracking-wide",
                          meta.tone === "warning" && "bg-amber-400/10 text-amber-300",
                          meta.tone === "success" && "bg-emerald-500/10 text-emerald-300",
                          meta.tone === "neutral" && "bg-white/[0.05] text-zinc-500"
                        )}
                      >
                        {meta.short}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
