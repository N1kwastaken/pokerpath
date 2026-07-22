/**
 * Sons curtos via Web Audio (sem arquivos/dependências). Feedback satisfatório
 * de acerto/erro/level-up (PRD 11.1 — som opcional, ligado por padrão).
 * Preferência de mudo persistida em localStorage.
 */
import { haptics } from './haptics.js';

const MUTE_KEY = 'pp.muted';
let ctx: AudioContext | null = null;

function audioCtx(): AudioContext | null {
  try {
    ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

// O AudioContext SUSPENDE quando o app vai pro fundo (tela bloqueada, aba
// trocada). Ao voltar, resumimos proativamente pra o próximo som não falhar.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx && ctx.state === 'suspended') void ctx.resume();
  });
}

export const sound = {
  isMuted: () => localStorage.getItem(MUTE_KEY) === '1',
  toggleMute(): boolean {
    const next = !this.isMuted();
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    // Ao LIGAR o som, destrava o contexto na hora (gesto do usuário) pra o
    // próximo som já sair — antes ficava mudo até um segundo toque.
    if (!next) void audioCtx()?.resume();
    return next;
  },
  /** Acerto: o tom sobe SUAVE a cada acerto seguido (combo). Teto baixo para
   *  não ficar estridente em sequências longas. */
  correct(combo = 0) {
    haptics.correct();
    const step = Math.min(combo, 10) * 16; // subida gentil, no máx +160Hz
    tones([600 + step, 800 + step], 0.12);
    if (combo >= 3) tones([900 + step, 1120 + step], 0.07); // brilho discreto, sem passar de ~1300Hz
  },
  wrong() { haptics.wrong(); tones([200, 150], 0.16, 'sawtooth'); },
  levelUp() { haptics.levelUp(); tones([523, 659, 784, 1046, 1319], 0.13); },
  /** Fanfarra de fim de fase — mais cheia que o level-up. */
  fanfare() { haptics.fanfare(); tones([523, 659, 784, 1046], 0.14); tones([392, 523, 659, 784], 0.14); },
  click() { haptics.tap(); tones([440], 0.05); },
};

function tones(freqs: number[], dur: number, type: OscillatorType = 'sine') {
  if (sound.isMuted()) return;
  const ac = audioCtx();
  if (!ac) return;
  // Agendar os osciladores SÓ depois de o contexto estar rodando. resume() é
  // assíncrono: se agendarmos antes (com o contexto ainda suspenso, ex. logo
  // após desbloquear o celular), o primeiro som não sai.
  const play = () => {
    try {
      freqs.forEach((f, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.value = f;
        const start = ac.currentTime + i * dur * 0.9;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain).connect(ac.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      /* áudio indisponível — silencioso */
    }
  };
  if (ac.state === 'suspended') ac.resume().then(play).catch(() => {});
  else play();
}
