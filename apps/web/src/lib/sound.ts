/**
 * Sons curtos via Web Audio (sem arquivos/dependências). Feedback "viciante"
 * de acerto/erro/level-up (PRD 11.1 — som opcional, ligado por padrão).
 * Preferência de mudo persistida em localStorage.
 */
const MUTE_KEY = 'pp.muted';
let ctx: AudioContext | null = null;

export const sound = {
  isMuted: () => localStorage.getItem(MUTE_KEY) === '1',
  toggleMute(): boolean {
    const next = !this.isMuted();
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
    return next;
  },
  correct() { tones([660, 880], 0.12); },
  wrong() { tones([200, 150], 0.16, 'sawtooth'); },
  levelUp() { tones([523, 659, 784, 1046], 0.12); },
  click() { tones([440], 0.05); },
};

function tones(freqs: number[], dur: number, type: OscillatorType = 'sine') {
  if (sound.isMuted()) return;
  try {
    ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const ac = ctx;
    if (ac.state === 'suspended') void ac.resume();
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
}
