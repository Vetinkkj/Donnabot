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

/**
 * "Plim" de aviso, grave e abafado: duas notas suaves (onda senoidal, que não
 * tem os harmônicos agudos da triangular) passando por um filtro passa-baixa,
 * com volume baixo e ataque macio para não assustar.
 */
export function playAlertSound() {
  const ctx = getContext();
  if (!ctx) return;
  const start = ctx.currentTime + 0.01;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  filter.connect(ctx.destination);

  [
    { freq: 392, at: 0 }, // sol
    { freq: 523, at: 0.13 }, // dó, uma quarta acima
  ].forEach(({ freq, at }) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = start + at;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    oscillator.connect(gain).connect(filter);
    oscillator.start(t);
    oscillator.stop(t + 0.34);
  });
}
