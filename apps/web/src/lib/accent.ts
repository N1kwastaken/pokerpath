/**
 * Cor de destaque escolhida pelo usuário (efeito IKEA: o app é "dele").
 * Aplicada via atributo data-accent no <html>; os tokens ficam no index.css.
 */
export const ACCENTS = [
  { key: 'green', name: 'Verde feltro', hex: '#1FA463' },
  { key: 'blue', name: 'Azul fichas', hex: '#3B82F6' },
  { key: 'purple', name: 'Roxo royal', hex: '#935CF6' },
  { key: 'orange', name: 'Laranja pote', hex: '#EA7C2A' },
  { key: 'pink', name: 'Rosa all-in', hex: '#E74C91' },
] as const;

const KEY = 'pp.accent';

export function applyAccent(key: string): void {
  if (key === 'green') delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = key;
  localStorage.setItem(KEY, key);
}

export function currentAccent(): string {
  return localStorage.getItem(KEY) ?? 'green';
}

export function initAccent(): void {
  const k = localStorage.getItem(KEY);
  if (k && k !== 'green') document.documentElement.dataset.accent = k;
}
