/**
 * Preferências de acessibilidade, aplicadas via atributos no <html> (os
 * seletores moram no index.css). Persistidas em localStorage porque são do
 * APARELHO, não da conta: quem usa o celular com movimento reduzido não quer
 * a animação de volta ao entrar no notebook.
 */
const KEYS = {
  motion: 'pp.a11y.reduceMotion',
  text: 'pp.a11y.largeText',
  haptics: 'pp.a11y.haptics',
} as const;

/** Sistema pediu menos movimento? Vale como padrão quando não há escolha. */
function systemReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function read(key: string, fallback: boolean): boolean {
  const v = localStorage.getItem(key);
  return v === null ? fallback : v === '1';
}

export const a11y = {
  reduceMotion: () => read(KEYS.motion, systemReducedMotion()),
  largeText: () => read(KEYS.text, false),
  /** Vibração ligada por padrão — mas agora dá para desligar. */
  haptics: () => read(KEYS.haptics, true),

  setReduceMotion(on: boolean) { localStorage.setItem(KEYS.motion, on ? '1' : '0'); apply(); },
  setLargeText(on: boolean) { localStorage.setItem(KEYS.text, on ? '1' : '0'); apply(); },
  setHaptics(on: boolean) { localStorage.setItem(KEYS.haptics, on ? '1' : '0'); },
};

/** Reflete as preferências no <html>. Chamada no boot e a cada mudança. */
export function apply(): void {
  const el = document.documentElement;
  el.toggleAttribute('data-reduce-motion', a11y.reduceMotion());
  el.toggleAttribute('data-large-text', a11y.largeText());
}

export function initA11y(): void {
  apply();
}
