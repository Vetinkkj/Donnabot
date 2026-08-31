"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Demonstração visual de como a Donna atende — reproduz uma conversa
 * roteirizada (não fala com o backend de verdade) pra sempre mostrar o
 * melhor exemplo possível, com o mesmo texto que a Donna realmente manda
 * (ver services/conversation/index.ts).
 */

type ScriptMessage = { from: "customer" | "donna"; text: string };

const SCRIPT: ScriptMessage[] = [
  { from: "customer", text: "Oi, vocês têm tela de iPhone 12?" },
  {
    from: "donna",
    text: "Sim! Temos disponível:\n📱 Tela iPhone 12\n💰 R$ 400,00\n📦 Estoque: 5 unidades\nDeseja comprar?",
  },
  { from: "customer", text: "Quero sim, pode ser 1" },
  {
    from: "donna",
    text: '🛒 Seu carrinho:\n📱 Tela iPhone 12 — 1x R$ 400,00 = R$ 400,00\n💰 Total: R$ 400,00\nDigite "finalizar" para fechar o pedido.',
  },
  { from: "customer", text: "finalizar" },
  {
    from: "donna",
    text: "💳 Pagamento via PIX\n💰 Valor: R$ 400,00\nQR Code enviado — é só escanear e pagar 📲\nConfirmo automaticamente assim que cair ✅",
  },
];

const TYPING_DELAY = 1100;
const READ_DELAY = 900;
const START_DELAY = 400;

export function WhatsAppDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function play() {
    clearTimers();
    setVisibleCount(0);
    setTyping(false);
    setPlaying(true);

    let delay = START_DELAY;
    SCRIPT.forEach((message, index) => {
      if (message.from === "donna") {
        timers.current.push(setTimeout(() => setTyping(true), delay));
        delay += TYPING_DELAY;
        timers.current.push(
          setTimeout(() => {
            setTyping(false);
            setVisibleCount(index + 1);
          }, delay)
        );
        delay += 300;
      } else {
        timers.current.push(setTimeout(() => setVisibleCount(index + 1), delay));
        delay += READ_DELAY;
      }
    });
    timers.current.push(setTimeout(() => setPlaying(false), delay));
  }

  useEffect(() => clearTimers, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleCount, typing]);

  const visibleMessages = SCRIPT.slice(0, visibleCount);
  const finished = !playing && visibleCount === SCRIPT.length;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border-8 border-zinc-900 bg-[#e5ddd5] shadow-xl dark:border-zinc-800 dark:bg-[#0b141a]">
      {/* Cabeçalho estilo WhatsApp */}
      <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">🤖</div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Donna</p>
          <p className="text-xs leading-tight text-white/80">{typing ? "digitando..." : "online"}</p>
        </div>
      </div>

      {/* Área da conversa */}
      <div className="flex h-96 flex-col gap-2 overflow-y-auto px-3 py-4">
        {visibleMessages.length === 0 && !playing && (
          <p className="m-auto max-w-[85%] text-center text-sm text-zinc-500">
            Clique em &quot;Simular conversa&quot; pra ver a Donna atendendo de verdade.
          </p>
        )}
        {visibleMessages.map((message, index) => (
          <div key={index} className={`flex ${message.from === "customer" ? "justify-end" : "justify-start"}`}>
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

      <div className="border-t border-black/5 bg-[#f0f0f0] p-3 dark:border-white/5 dark:bg-[#1f2c34]">
        <Button type="button" onClick={play} disabled={playing} className="w-full">
          {playing ? "Simulando..." : finished ? "Simular de novo" : "▶ Simular conversa"}
        </Button>
      </div>
    </div>
  );
}
