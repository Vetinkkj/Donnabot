"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type WaitingConversation = { id: string; customerName: string };

const POLL_INTERVAL_MS = 10_000;

/** Dois bipes curtos gerados no navegador (Web Audio) — sem arquivo de áudio. */
function playChime(context: AudioContext) {
  const start = context.currentTime;
  [880, 1175].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    const at = start + index * 0.22;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.21);
  });
}

/**
 * Aviso do painel quando um cliente entra em "Aguardando atendente" (pediu
 * atendente ou finalizou o carrinho): toca um som, mostra um aviso com link
 * para a conversa e coloca a contagem no título da aba.
 *
 * Navegadores só deixam tocar som depois de um clique/tecla na página — até
 * lá aparece o botão "Ativar som dos avisos".
 */
export function WaitingCustomerAlert() {
  const [waiting, setWaiting] = useState<WaitingConversation[]>([]);
  const [latestNew, setLatestNew] = useState<WaitingConversation | null>(null);
  const [soundReady, setSoundReady] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    function unlockAudio() {
      if (!audioRef.current) audioRef.current = new AudioContext();
      void audioRef.current.resume().then(() => setSoundReady(audioRef.current?.state === "running"));
    }
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/admin/conversations/waiting", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { data } = (await res.json()) as { data: WaitingConversation[] };
        setWaiting(data);

        // Primeira consulta só registra o que já estava esperando — sem som ao abrir o painel.
        if (knownIdsRef.current) {
          const fresh = data.filter((conversation) => !knownIdsRef.current!.has(conversation.id));
          if (fresh.length > 0) {
            setLatestNew(fresh[0]);
            if (audioRef.current?.state === "running") playChime(audioRef.current);
          }
        }
        knownIdsRef.current = new Set(data.map((conversation) => conversation.id));
      } catch {
        // sem rede por um instante — tenta de novo no próximo ciclo
      }
    }

    void check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = waiting.length > 0 ? `(${waiting.length}) ${base}` : base;
  }, [waiting.length]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {latestNew && waiting.some((conversation) => conversation.id === latestNew.id) && (
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm shadow-lg dark:border-amber-700 dark:bg-amber-950">
          <span className="text-amber-900 dark:text-amber-100">
            🔔 <strong>{latestNew.customerName}</strong> está aguardando atendimento
          </span>
          <Link
            href={`/conversations/${latestNew.id}`}
            onClick={() => setLatestNew(null)}
            className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            Abrir
          </Link>
          <button
            type="button"
            onClick={() => setLatestNew(null)}
            className="text-xs text-amber-800 hover:underline dark:text-amber-200"
          >
            Fechar
          </button>
        </div>
      )}
      {waiting.length > 0 && (
        <Link
          href="/conversations"
          className="pointer-events-auto rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white shadow hover:bg-amber-700"
        >
          {waiting.length} aguardando atendimento
        </Link>
      )}
      {!soundReady && (
        <button
          type="button"
          // o pointerdown global já destrava o áudio; aqui só toca um bipe de confirmação
          onClick={() => setTimeout(() => audioRef.current?.state === "running" && playChime(audioRef.current), 100)}
          className="pointer-events-auto rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 shadow hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          🔈 Ativar som dos avisos
        </button>
      )}
    </div>
  );
}
