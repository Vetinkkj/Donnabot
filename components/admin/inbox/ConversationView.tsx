"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, Bot, Hand, Headset, Loader2, PanelRightClose, PanelRightOpen, SendHorizontal, Undo2, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar, ErrorBanner, Skeleton } from "@/components/admin/page-ui";
import { CustomerPanel } from "./CustomerPanel";
import {
  STATUS_META,
  displayName,
  formatDaySeparator,
  formatPhone,
  formatTime,
  parseMessage,
  sameDay,
  type ConversationDetail,
  type Message,
} from "./shared";

const REFRESH_MS = 4000;
/** Mensagens do mesmo lado com menos que isso de intervalo viram um "grupo" visual. */
const GROUP_GAP_MS = 5 * 60 * 1000;
const PANEL_KEY = "donna:inbox-customer-panel";

type Pending = { id: string; content: string; state: "sending" | "failed" };

function MessageBubble({ message, grouped, last }: { message: Message; grouped: boolean; last: boolean }) {
  const outgoing = message.direction === "OUT";
  const { text, buttons, imageUrl } = parseMessage(message);
  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-3")}>
      <div
        className={cn(
          "max-w-[min(78%,560px)] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          outgoing
            ? "bg-emerald-500/[0.14] text-emerald-50 ring-1 ring-inset ring-emerald-400/15"
            : "bg-zinc-800/80 text-zinc-100",
          outgoing ? (grouped ? "rounded-tr-md" : "rounded-tr-sm") : grouped ? "rounded-tl-md" : "rounded-tl-sm"
        )}
      >
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="mb-1.5 block overflow-hidden rounded-lg">
            {/* Foto do produto enviada pela Donna (URL cadastrada pela loja). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={text || "Foto enviada"} className="max-h-56 w-full object-cover" loading="lazy" />
          </a>
        )}
        {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
        {buttons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Botões enviados ao cliente">
            {buttons.map((label) => (
              <span key={label} className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-zinc-200">
                {label}
              </span>
            ))}
          </div>
        )}
        {last && (
          <p className={cn("mt-1 text-right text-[10px] tabular-nums", outgoing ? "text-emerald-200/60" : "text-zinc-500")}>
            {formatTime(message.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}

export function ConversationView({ id }: { id: string }) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [action, setAction] = useState<"assign" | "close" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [hasNew, setHasNew] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(0);
  const sendSeq = useRef(0);

  // Preferência salva só no navegador (lida depois da montagem para não divergir do HTML do servidor).
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(PANEL_KEY) === "hidden") setShowPanel(false);
      } catch {
        // sem localStorage (modo privado): painel fica visível
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function togglePanel() {
    setShowPanel((value) => {
      try {
        localStorage.setItem(PANEL_KEY, value ? "hidden" : "shown");
      } catch {}
      return !value;
    });
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/conversations/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar conversa");
      setConversation(json.data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erro de conexão ao carregar conversa");
    }
  }, [id]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [load]);

  // Rolagem inteligente: desce sozinha na abertura e quando chega mensagem nova
  // se você já estava no fim; se estava lendo mais acima, mostra "novas mensagens".
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const count = (conversation?.messages.length ?? 0) + pending.length;
    if (!el || count === 0) return;
    const firstPaint = lastCount.current === 0;
    if (count > lastCount.current) {
      if (firstPaint || atBottom) el.scrollTo({ top: el.scrollHeight, behavior: firstPaint ? "auto" : "smooth" });
      else setHasNew(true);
    }
    lastCount.current = count;
  }, [conversation?.messages.length, pending.length, atBottom]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAtBottom(near);
    if (near) setHasNew(false);
  }

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setHasNew(false);
  }

  async function runAction(kind: "assign" | "close") {
    setAction(kind);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/conversations/${id}/${kind}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir a ação");
      await load();
      if (kind === "assign") setTimeout(() => composerRef.current?.focus(), 50);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro de conexão");
    } finally {
      setAction(null);
    }
  }

  async function send(content: string, retryId?: string) {
    const tempId = retryId ?? `tmp-${++sendSeq.current}`;
    setPending((list) =>
      retryId
        ? list.map((p) => (p.id === retryId ? { ...p, state: "sending" } : p))
        : [...list, { id: tempId, content, state: "sending" }]
    );
    try {
      const res = await fetch(`/api/admin/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Falha ao enviar");
      await load();
      setPending((list) => list.filter((p) => p.id !== tempId));
    } catch {
      setPending((list) => list.map((p) => (p.id === tempId ? { ...p, state: "failed" } : p)));
    }
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void send(text);
    requestAnimationFrame(() => {
      if (composerRef.current) composerRef.current.style.height = "auto";
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-medium text-zinc-200">Conversa não encontrada</p>
        <p className="text-sm text-zinc-500">Ela pode ter sido removida ou não pertence a esta loja.</p>
        <Link href="/conversations" className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
          Voltar para as conversas
        </Link>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-6">
          {loadError ? (
            <ErrorBanner message={loadError} onRetry={load} />
          ) : (
            ["w-3/5", "w-2/5", "w-2/3", "w-1/2"].map((width, i) => (
              <Skeleton key={width} className={cn("h-10 rounded-2xl", width, i % 2 ? "self-end" : "self-start")} />
            ))
          )}
        </div>
      </div>
    );
  }

  const meta = STATUS_META[conversation.status];
  const name = displayName(conversation.customer);
  const messages = conversation.messages;

  return (
    <div className="flex min-w-0 flex-1">
      <section aria-label={`Conversa com ${name}`} className="flex min-w-0 flex-1 flex-col">
        {/* Cabeçalho da conversa */}
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-3 sm:px-5">
          <Link
            href="/conversations"
            aria-label="Voltar para as conversas"
            className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 md:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <Avatar name={conversation.customer.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-zinc-50">{name}</p>
            <p className="truncate text-xs text-zinc-500">
              {formatPhone(conversation.customer.whatsappPhone)}
              {conversation.assignedUser && ` · com ${conversation.assignedUser.name}`}
            </p>
          </div>
          <Badge tone={meta.tone} className="hidden lg:inline-flex">
            {meta.label}
          </Badge>
          {conversation.status === "HUMAN" ? (
            <Button variant="secondary" size="sm" onClick={() => runAction("close")} loading={action === "close"}>
              <Undo2 className="size-3.5" aria-hidden />
              <span className="hidden lg:inline">Devolver para a Donna</span>
              <span className="lg:hidden">Devolver</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => runAction("assign")} loading={action === "assign"}>
              <Hand className="size-3.5" aria-hidden />
              Assumir
            </Button>
          )}
          {/* Telas menores que 2xl não têm espaço para o painel: atalho para o perfil. */}
          <Link
            href={`/customers/${conversation.customer.id}`}
            aria-label="Ver perfil do cliente"
            title="Ver perfil do cliente"
            className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500 2xl:hidden"
          >
            <UserRound className="size-4" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={togglePanel}
            aria-label={showPanel ? "Esconder dados do cliente" : "Mostrar dados do cliente"}
            aria-pressed={showPanel}
            className="hidden size-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-500 2xl:grid"
          >
            {showPanel ? <PanelRightClose className="size-4" aria-hidden /> : <PanelRightOpen className="size-4" aria-hidden />}
          </button>
        </header>

        {actionError && (
          <div className="px-4 pt-3">
            <ErrorBanner message={actionError} />
          </div>
        )}

        {/* Mensagens */}
        <div className="relative min-h-0 flex-1">
          <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto px-3 pb-4 sm:px-6" aria-live="polite">
            {messages.length === 0 && pending.length === 0 && (
              <p className="py-16 text-center text-sm text-zinc-500">Nenhuma mensagem nesta conversa ainda.</p>
            )}
            {messages.map((message, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const newDay = !prev || !sameDay(prev.createdAt, message.createdAt);
              const grouped =
                !newDay &&
                !!prev &&
                prev.direction === message.direction &&
                new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS;
              const last =
                !next ||
                next.direction !== message.direction ||
                !sameDay(message.createdAt, next.createdAt) ||
                new Date(next.createdAt).getTime() - new Date(message.createdAt).getTime() >= GROUP_GAP_MS;
              return (
                <Fragment key={message.id}>
                  {newDay && (
                    <div className="sticky top-0 z-10 flex justify-center pb-1 pt-4">
                      <span className="rounded-full border border-white/[0.06] bg-zinc-950/90 px-3 py-1 text-[11px] font-medium text-zinc-400 backdrop-blur">
                        {formatDaySeparator(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={message} grouped={grouped} last={last} />
                </Fragment>
              );
            })}
            {pending.map((p) => (
              <div key={p.id} className="mt-1 flex flex-col items-end">
                <div className="max-w-[min(78%,560px)] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-emerald-500/[0.08] px-3.5 py-2 text-sm text-emerald-50/80 ring-1 ring-inset ring-emerald-400/10">
                  {p.content}
                </div>
                {p.state === "sending" ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500">
                    <Loader2 className="size-3 motion-safe:animate-spin" aria-hidden />
                    Enviando…
                  </span>
                ) : (
                  <span className="mt-1 text-[11px] text-red-400">
                    Não foi enviada.{" "}
                    <button type="button" onClick={() => send(p.content, p.id)} className="font-medium underline">
                      Tentar de novo
                    </button>{" "}
                    ·{" "}
                    <button
                      type="button"
                      onClick={() => setPending((list) => list.filter((x) => x.id !== p.id))}
                      className="underline"
                    >
                      Descartar
                    </button>
                  </span>
                )}
              </div>
            ))}
          </div>
          {hasNew && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="dash-enter absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 shadow-lg shadow-black/40 hover:bg-zinc-800"
            >
              <ArrowDown className="size-3.5" aria-hidden />
              Novas mensagens
            </button>
          )}
        </div>

        {/* Rodapé: quem está respondendo + campo de mensagem */}
        <footer className="border-t border-white/[0.06] p-3 sm:px-5">
          {conversation.status === "HUMAN" ? (
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor="composer" className="sr-only">
                Mensagem para {name}
              </label>
              <textarea
                id="composer"
                ref={composerRef}
                value={draft}
                rows={1}
                maxLength={4096}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Escreva uma mensagem…  (Enter envia · Shift+Enter quebra linha)"
                className="max-h-40 min-h-[42px] flex-1 resize-none rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/15"
              />
              <Button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim()} className="h-[42px] w-[42px] rounded-xl px-0">
                <SendHorizontal className="size-4" aria-hidden />
              </Button>
            </form>
          ) : (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
                conversation.status === "WAITING_HUMAN" ? "bg-amber-400/[0.08] text-amber-100" : "bg-white/[0.03] text-zinc-400"
              )}
            >
              {conversation.status === "WAITING_HUMAN" ? (
                <Headset className="size-4 shrink-0 text-amber-300" aria-hidden />
              ) : (
                <Bot className="size-4 shrink-0 text-zinc-500" aria-hidden />
              )}
              <p className="flex-1">
                {conversation.status === "WAITING_HUMAN"
                  ? `${name} pediu para falar com um atendente. Assuma para responder por aqui.`
                  : "A Donna está respondendo automaticamente. Assuma a conversa para escrever você mesmo."}
              </p>
            </div>
          )}
        </footer>
      </section>

      {showPanel && <CustomerPanel customerId={conversation.customer.id} />}
    </div>
  );
}
