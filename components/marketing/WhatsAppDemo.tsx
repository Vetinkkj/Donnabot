"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

/**
 * Demonstração INTERATIVA de como a Donna atende — o visitante digita como
 * se fosse o cliente e recebe respostas de um "mini-motor" que roda só no
 * navegador (não fala com o backend nem com o banco de verdade). Usa o
 * mesmo formato de resposta do bot real (ver services/conversation/index.ts),
 * só que com um catálogo fixo de exemplo.
 */

type ChatMessage = { id: string; from: "customer" | "donna"; text: string };

type CartItem = { name: string; price: number; quantity: number };

type DemoState = {
  cart: CartItem[];
  lastProduct: { name: string; price: number; stock: number } | null;
  awaitingPayment: boolean;
};

const DEMO_CATALOG = [
  { name: "Tela iPhone 12", keywords: ["tela do iphone 12", "tela iphone 12", "display iphone 12", "iphone 12"], price: 400, stock: 5 },
  { name: "Bateria iPhone 11", keywords: ["bateria do iphone 11", "bateria iphone 11", "iphone 11"], price: 150, stock: 8 },
  { name: "Câmera iPhone 13", keywords: ["câmera do iphone 13", "camera do iphone 13", "câmera iphone 13", "camera iphone 13", "iphone 13"], price: 350, stock: 3 },
  { name: "Capa iPhone 14", keywords: ["capa do iphone 14", "capinha do iphone 14", "capa iphone 14", "iphone 14"], price: 60, stock: 20 },
  { name: "Conector de Carga Galaxy S21", keywords: ["conector de carga", "conector", "galaxy s21", "s21"], price: 90, stock: 10 },
];

const SUGGESTIONS = ["Tem tela de iPhone 12?", "Quanto custa a bateria do iPhone 11?", "Quero falar com atendente"];

const WELCOME = "Olá! 👋 Sou a Donna, assistente virtual da loja. Me diga qual peça você procura!";

const INITIAL_STATE: DemoState = { cart: [], lastProduct: null, awaitingPayment: false };
const TYPING_DELAY_MS = 900;

function money(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Remove os nomes/números de modelo do catálogo antes de procurar uma
 * quantidade no texto — sem isso, "iPhone 12" vira "quantidade 12" (mesma
 * armadilha que o NLU do bot real já teve, ver lib/text.ts).
 */
function extractQuantity(message: string): number {
  let remainder = message;
  for (const product of DEMO_CATALOG) {
    for (const keyword of product.keywords) {
      remainder = remainder.replaceAll(keyword, " ");
    }
  }
  const match = remainder.match(/\d+/);
  return match ? Math.max(1, parseInt(match[0], 10)) : 1;
}

function getDonnaReply(rawMessage: string, state: DemoState): { reply: string; state: DemoState } {
  const message = normalize(rawMessage);

  if (/atendente|humano|pessoa de verdade|falar com alguem|falar com algu[ée]m/.test(message)) {
    return { reply: "Combinado! Vou te transferir para um atendente humano, só um instante 🙋‍♀️", state };
  }

  if (/cancelar/.test(message)) {
    return { reply: "Cancelei seu carrinho. Bora começar de novo? 🙂", state: INITIAL_STATE };
  }

  if (/finalizar/.test(message)) {
    if (state.cart.length === 0) {
      return { reply: "Seu carrinho está vazio ainda. Me diga qual peça você quer que eu te ajudo a montar o pedido.", state };
    }
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const lines = ["Perfeito! Seu pedido ficou:"];
    for (const item of state.cart) lines.push(`📱 ${item.name} — Quantidade: ${item.quantity}`);
    lines.push(`💰 Total: R$ ${money(total)}`);
    lines.push("Deseja prosseguir para o pagamento?");
    return { reply: lines.join("\n"), state: { ...state, awaitingPayment: true } };
  }

  if (/^(sim|quero|isso|pode ser|manda|bora|claro|com certeza|ok|beleza)\b/.test(message)) {
    if (state.awaitingPayment) {
      const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return {
        reply: `💳 Pagamento via PIX\n💰 Valor: R$ ${money(total)}\nQR Code enviado — é só escanear e pagar 📲\nConfirmo automaticamente assim que cair ✅`,
        state: INITIAL_STATE,
      };
    }
    if (state.lastProduct) {
      const quantity = extractQuantity(message);
      const newCart = [...state.cart, { name: state.lastProduct.name, price: state.lastProduct.price, quantity }];
      const total = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const lines = ["🛒 Seu carrinho:"];
      for (const item of newCart) {
        lines.push(`📱 ${item.name} — ${item.quantity}x R$ ${money(item.price)} = R$ ${money(item.price * item.quantity)}`);
      }
      lines.push(`💰 Total: R$ ${money(total)}`);
      lines.push('Digite "finalizar" para fechar o pedido, ou me diga outra peça.');
      return { reply: lines.join("\n"), state: { cart: newCart, lastProduct: null, awaitingPayment: false } };
    }
  }

  if (/^(oi|ol[áa]|bom dia|boa tarde|boa noite|opa|e a[ií])\b/.test(message)) {
    return { reply: WELCOME, state };
  }

  const product = DEMO_CATALOG.find((item) => item.keywords.some((keyword) => message.includes(keyword)));
  if (product) {
    const requestedQuantity = extractQuantity(message);
    const lines = ["Sim! Temos disponível:", `📱 ${product.name}`];
    if (requestedQuantity > 1) {
      lines.push(`💰 R$ ${money(product.price)} cada`);
      lines.push(`Quantidade: ${requestedQuantity}`);
    } else {
      lines.push(`💰 R$ ${money(product.price)}`);
    }
    lines.push(`📦 Estoque: ${product.stock} unidades`);
    lines.push("Deseja comprar?");
    return {
      reply: lines.join("\n"),
      state: { ...state, lastProduct: { name: product.name, price: product.price, stock: product.stock }, awaitingPayment: false },
    };
  }

  return {
    reply:
      'Não encontrei essa peça no catálogo de exemplo 😕\nTenta perguntar por "tela de iphone 12", "bateria de iphone 11" ou "câmera de iphone 13" pra ver a Donna em ação!',
    state,
  };
}

let messageIdCounter = 0;
function nextId(): string {
  messageIdCounter += 1;
  return `demo-${messageIdCounter}`;
}

export function WhatsAppDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: nextId(), from: "donna", text: WELCOME }]);
  const [state, setState] = useState<DemoState>(INITIAL_STATE);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [...prev, { id: nextId(), from: "customer", text: trimmed }]);
    setDraft("");
    setTyping(true);

    timerRef.current = setTimeout(() => {
      const { reply, state: newState } = getDonnaReply(trimmed, state);
      setState(newState);
      setMessages((prev) => [...prev, { id: nextId(), from: "donna", text: reply }]);
      setTyping(false);
    }, TYPING_DELAY_MS);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(draft);
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessages([{ id: nextId(), from: "donna", text: WELCOME }]);
    setState(INITIAL_STATE);
    setTyping(false);
    setDraft("");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border-8 border-zinc-900 bg-[#e5ddd5] shadow-xl dark:border-zinc-800 dark:bg-[#0b141a]">
      {/* Cabeçalho estilo WhatsApp */}
      <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">🤖</div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Donna</p>
          <p className="text-xs leading-tight text-white/80">{typing ? "digitando..." : "online"}</p>
        </div>
        <button type="button" onClick={reset} className="text-xs text-white/80 underline hover:text-white">
          reiniciar
        </button>
      </div>

      {/* Área da conversa */}
      <div className="flex h-96 flex-col gap-2 overflow-y-auto px-3 py-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.from === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-sm shadow-sm ${
                message.from === "customer"
                  ? "bg-[#d9fdd3] text-zinc-900 dark:bg-[#005c4b] dark:text-white"
                  : "bg-white text-zinc-900 dark:bg-[#202c33] dark:text-white"
              }`}
            >
              {message.text}
              {message.from === "customer" && <span className="ml-1.5 align-bottom text-[10px] text-sky-500">✓✓</span>}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-[#202c33]">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugestões rápidas */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 border-t border-black/5 bg-[#f7f7f5] px-3 py-2 dark:border-white/5 dark:bg-[#111b21]">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => sendMessage(suggestion)}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Campo de digitação */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-black/5 bg-[#f0f0f0] p-3 dark:border-white/5 dark:bg-[#1f2c34]">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Digite como se fosse o cliente..."
          className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#25D366]/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={typing || !draft.trim()}
          aria-label="Enviar mensagem"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#1ebc59] disabled:cursor-not-allowed disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
