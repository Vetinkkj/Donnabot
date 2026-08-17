"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ConversationStatus = "BOT" | "WAITING_HUMAN" | "HUMAN";

type Message = {
  id: string;
  direction: "IN" | "OUT";
  content: string;
  messageType: "TEXT" | "BUTTONS" | "IMAGE";
  createdAt: string;
};

type ConversationDetail = {
  id: string;
  status: ConversationStatus;
  customer: { id: string; name: string | null; whatsappPhone: string };
  assignedUser: { id: string; name: string } | null;
  messages: Message[];
};

const STATUS_BADGE: Record<ConversationStatus, { label: string; tone: "success" | "warning" | "neutral" }> = {
  BOT: { label: "Bot", tone: "neutral" },
  WAITING_HUMAN: { label: "Aguardando atendente", tone: "warning" },
  HUMAN: { label: "Em atendimento", tone: "success" },
};

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadConversation() {
    try {
      const res = await fetch(`/api/admin/conversations/${id}`);
      const json = await res.json();
      if (res.ok) {
        setConversation(json.data);
        setError(null);
      } else {
        setError(json.error ?? "Erro ao carregar conversa");
      }
    } catch {
      setError("Erro de conexão ao carregar conversa");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(loadConversation);
    const interval = setInterval(loadConversation, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  async function handleAssign() {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/conversations/${id}/assign`, { method: "POST" });
      await loadConversation();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClose() {
    setActionLoading(true);
    try {
      await fetch(`/api/admin/conversations/${id}/close`, { method: "POST" });
      await loadConversation();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    const text = draft;
    setDraft("");
    try {
      await fetch(`/api/admin/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      await loadConversation();
    } catch {
      setError("Erro ao enviar mensagem");
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Carregando...</p>;
  if (error && !conversation) return <p className="text-sm text-red-600">{error}</p>;
  if (!conversation) return null;

  const status = STATUS_BADGE[conversation.status];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 md:h-[calc(100vh-6rem)]">
      <div>
        <Link href="/conversations" className="text-sm text-zinc-500 underline">
          ← Voltar para atendimento
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {conversation.customer.name ?? conversation.customer.whatsappPhone}
          </h1>
          <Badge tone={status.tone}>{status.label}</Badge>
          {conversation.assignedUser && (
            <span className="text-xs text-zinc-500">com {conversation.assignedUser.name}</span>
          )}
        </div>
        <p className="text-xs text-zinc-500">{conversation.customer.whatsappPhone}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-black">
        {conversation.messages.map((message) => (
          <div key={message.id} className={`flex ${message.direction === "IN" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.direction === "IN"
                  ? "border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                  : "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {conversation.status === "WAITING_HUMAN" && (
        <Button onClick={handleAssign} disabled={actionLoading}>
          {actionLoading ? "Assumindo..." : "Assumir atendimento"}
        </Button>
      )}

      {conversation.status === "HUMAN" && (
        <div className="flex flex-col gap-2">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <Button type="submit">Enviar</Button>
          </form>
          <Button variant="secondary" onClick={handleClose} disabled={actionLoading}>
            {actionLoading ? "Encerrando..." : "Encerrar atendimento (devolver para o bot)"}
          </Button>
        </div>
      )}

      {conversation.status === "BOT" && (
        <p className="text-center text-sm text-zinc-500">Essa conversa está sendo respondida pelo bot.</p>
      )}
    </div>
  );
}
