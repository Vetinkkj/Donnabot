"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ChatMessage = {
  id: string;
  direction: "IN" | "OUT";
  content: string;
  createdAt: string;
};

const DEFAULT_PHONE = "5511999990000";

export function ChatSimulator() {
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [name, setName] = useState("Cliente Teste");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadHistory(forPhone: string) {
    try {
      const res = await fetch(`/api/mock/whatsapp?phone=${encodeURIComponent(forPhone)}`);
      const json = await res.json();
      if (res.ok) setMessages(json.data);
    } catch {
      // silencioso: histórico é conveniência, não é crítico
    }
  }

  useEffect(() => {
    let ignore = false;

    fetch(`/api/mock/whatsapp?phone=${encodeURIComponent(phone)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) setMessages(json.data ?? []);
      })
      .catch(() => {
        // silencioso: histórico é conveniência, não é crítico
      });

    return () => {
      ignore = true;
    };
  }, [phone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    setError(null);
    const text = draft;
    setDraft("");

    // Otimista: já mostra a mensagem do cliente antes da resposta chegar.
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, direction: "IN", content: text, createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/mock/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: text, name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao enviar mensagem");
        return;
      }
      await loadHistory(phone);
    } catch {
      setError("Erro de conexão ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[80vh] max-w-md flex-col rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Simulador de WhatsApp (mock)
        </h1>
        <div className="flex gap-2">
          <Input
            label="Telefone (identifica o cliente)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1"
          />
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-zinc-50 p-3 dark:bg-black">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-400">
            Mande uma mensagem, ex: &quot;tem tela de iphone 11?&quot;
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.direction === "IN" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.direction === "IN"
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "bg-white text-zinc-900 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-50 dark:border-zinc-800"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <Button type="submit" disabled={sending}>
          {sending ? "..." : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
