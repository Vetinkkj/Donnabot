/**
 * Sons curtos gerados no navegador (Web Audio), sem arquivo de áudio: nada
 * para baixar e nenhum som de terceiros. Só tocam depois de um clique ou
 * tecla na página — regra dos navegadores —, então use em resposta a uma ação.
 */

let context: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume();
  return context;
}

/** "Plim" de aviso: duas notas rápidas e suaves, subindo, com um leve deslize no tom. */
export function playAlertSound() {
  const ctx = getContext();
  if (!ctx) return;
  const start = ctx.currentTime + 0.01;
  [
    { from: 740, to: 784, at: 0 },
    { from: 1046, to: 1175, at: 0.11 },
  ].forEach(({ from, to, at }) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = start + at;
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(from, t);
    oscillator.frequency.exponentialRampToValueAtTime(to, t + 0.06);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + 0.26);
  });
}
