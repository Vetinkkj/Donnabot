"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const onInbox = usePathname()?.startsWith("/conversations") ?? false;
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
    // No Atendimento o canto de baixo é do campo de mensagem: o aviso sobe para o topo.
    <div
      className={`pointer-events-none fixed right-4 z-50 flex flex-col items-end gap-2 ${onInbox ? "top-4" : "bottom-4"}`}
    >
      {latestNew && waiting.some((conversation) => conversation.id === latestNew.id) && (
        <div className="dash-enter pointer-events-auto flex items-center gap-3 rounded-xl border border-amber-400/25 bg-zinc-900/95 px-4 py-3 text-sm shadow-2xl shadow-black/50 backdrop-blur">
          <span className="text-zinc-200">
            🔔 <strong>{latestNew.customerName}</strong> está aguardando atendimento
          </span>
          <Link
            href={`/conversations/${latestNew.id}`}
            onClick={() => setLatestNew(null)}
            className="rounded-md bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950 hover:bg-amber-300"
          >
            Abrir
          </Link>
          <button
            type="button"
            onClick={() => setLatestNew(null)}
            className="text-xs text-zinc-400 hover:text-zinc-100"
          >
            Fechar
          </button>
        </div>
      )}
      {waiting.length > 0 && !onInbox && (
        <Link
          href="/conversations"
          className="pointer-events-auto rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950 shadow-lg shadow-black/40 hover:bg-amber-300"
        >
          {waiting.length} aguardando atendimento
        </Link>
      )}
      {!soundReady && (
        <button
          type="button"
          // o pointerdown global já destrava o áudio; aqui só toca um bipe de confirmação
          onClick={() => setTimeout(() => audioRef.current?.state === "running" && playChime(audioRef.current), 100)}
          className="pointer-events-auto rounded-full border border-white/10 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 shadow-lg shadow-black/40 hover:bg-zinc-800"
        >
          🔈 Ativar som dos avisos
        </button>
      )}
    </div>
  );
}
