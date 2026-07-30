import { a11y } from './a11y.js';

export type CelebrationIntensity = 'FULL' | 'SUBTLE' | 'OFF';

const STORAGE_KEY = 'pp.celebrationIntensity';
const VALID = new Set<CelebrationIntensity>(['FULL', 'SUBTLE', 'OFF']);

function storedIntensity(): CelebrationIntensity {
  if (typeof localStorage === 'undefined') return 'FULL';
  const value = localStorage.getItem(STORAGE_KEY) as CelebrationIntensity | null;
  return value && VALID.has(value) ? value : 'FULL';
}

/**
 * Política única para efeitos visuais.
 *
 * O número pedido pela tela é só uma intenção. Aqui aplicamos o teto de
 * desempenho, o modo discreto e a preferência de movimento reduzido.
 */
export function confettiCount(
  requested: number,
  intensity: CelebrationIntensity,
  reduceMotion = false,
): number {
  if (reduceMotion || intensity === 'OFF' || requested <= 0) return 0;
  if (intensity === 'SUBTLE') return Math.min(16, Math.max(6, Math.ceil(requested * 0.2)));
  return Math.min(72, Math.floor(requested));
}

export const celebrations = {
  intensity: storedIntensity,
  setIntensity(value: CelebrationIntensity) {
    localStorage.setItem(STORAGE_KEY, value);
  },
  confettiCount(requested: number) {
    return confettiCount(requested, storedIntensity(), a11y.reduceMotion());
  },
};
