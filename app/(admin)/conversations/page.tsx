"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";

type ConversationStatus = "BOT" | "WAITING_HUMAN" | "HUMAN";
type StatusFilter = ConversationStatus | "all";

type ConversationListItem = {
  id: string;
  status: ConversationStatus;
  lastMessageAt: string;
  customer: { id: string; name: string | null; whatsappPhone: string };
  assignedUser: { id: string; name: string } | null;
  lastMessage: string | null;
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "WAITING_HUMAN", label: "Aguardando atendente" },
  { value: "HUMAN", label: "Em atendimento" },
  { value: "BOT", label: "Com o bot" },
];

const STATUS_BADGE: Record<ConversationStatus, { label: string; tone: "success" | "warning" | "neutral" }> = {
  BOT: { label: "Bot", tone: "neutral" },
  WAITING_HUMAN: { label: "Aguardando atendente", tone: "warning" },
  HUMAN: { label: "Em atendimento", tone: "success" },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
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
        return fetch(`/api/admin/conversations${params}`).then((res) => res.json());
      })
      .then((json) => {
        if (ignore || !json) return;
        if (json.error) setError(json.error);
        else setConversations(json.data ?? []);
      })
      .catch(() => {
        if (!ignore) setError("Erro ao carregar conversas");
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
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Atendimento</h1>

      <div className="flex flex-wrap gap-1">
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

      <div className="flex flex-col gap-2">
        {loading && <p className="text-sm text-zinc-500">Carregando...</p>}
        {!loading && conversations.length === 0 && (
          <p className="text-sm text-zinc-500">Nenhuma conversa encontrada.</p>
        )}
        {!loading &&
          conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversations/${conversation.id}`}
              className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {conversation.customer.name ?? conversation.customer.whatsappPhone}
                  </span>
                  <Badge tone={STATUS_BADGE[conversation.status].tone}>
                    {STATUS_BADGE[conversation.status].label}
                  </Badge>
                  {conversation.assignedUser && (
                    <span className="text-xs text-zinc-500">com {conversation.assignedUser.name}</span>
                  )}
                </div>
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400 sm:max-w-md">
                  {conversation.lastMessage ?? "Sem mensagens"}
                </p>
              </div>
              <span className="text-xs text-zinc-400">{dateFormatter.format(new Date(conversation.lastMessageAt))}</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
