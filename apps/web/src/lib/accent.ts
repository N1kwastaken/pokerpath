import type { WorldDetail } from '@pokerpath/shared';

/**
 * Cor de destaque do app — agora DESBLOQUEADA pelo progresso:
 * verde é a inicial; cada nível concluído libera uma cor; prateado quando
 * TERMINAR o jogo (todas as fases) e dourado no 100% perfeito (todas com
 * estrela). Aplicada via data-accent no <html>; tokens no index.css.
 */
export type AccentUnlock =
  | { type: 'start' }
  | { type: 'world'; order: number; label: string }
  | { type: 'finish' }
  | { type: 'perfect' };

export const ACCENTS: readonly { key: string; name: string; hex: string; unlock: AccentUnlock }[] = [
  { key: 'green', name: 'Verde feltro', hex: '#1FA463', unlock: { type: 'start' } },
  { key: 'blue', name: 'Azul fichas', hex: '#3B82F6', unlock: { type: 'world', order: 0, label: 'Complete o Primeiros Passos' } },
  { key: 'purple', name: 'Roxo royal', hex: '#935CF6', unlock: { type: 'world', order: 1, label: 'Complete o Iniciante' } },
  { key: 'orange', name: 'Laranja pote', hex: '#EA7C2A', unlock: { type: 'world', order: 2, label: 'Complete o Intermediário' } },
  { key: 'pink', name: 'Rosa all-in', hex: '#E74C91', unlock: { type: 'world', order: 3, label: 'Complete o Avançado' } },
  { key: 'silver', name: 'Prata — terminou o jogo', hex: '#94A3B8', unlock: { type: 'finish' } },
  { key: 'gold', name: 'Ouro — 100% perfeito', hex: '#C9A84C', unlock: { type: 'perfect' } },
] as const;

/** Quais cores o progresso atual libera (a partir da trilha). */
export function unlockedAccents(trail: WorldDetail[] | undefined): Set<string> {
  const un = new Set<string>(['green']);
  if (!trail || trail.length === 0) return un;
  const worldComplete = (order: number) => {
    const w = trail.find((x) => x.order === order);
    return !!w && w.stages.length > 0 && w.stages.every((s) => s.status === 'COMPLETED' || s.premium);
  };
  for (const a of ACCENTS) {
    if (a.unlock.type === 'world' && worldComplete(a.unlock.order)) un.add(a.key);
  }
  const all = trail.flatMap((w) => w.stages);
  if (all.length > 0 && all.every((s) => s.status === 'COMPLETED')) un.add('silver');
  if (all.length > 0 && all.every((s) => s.status === 'COMPLETED' && (s.perfect || s.isLesson))) un.add('gold');
  return un;
}

/** Texto do requisito de desbloqueio (para a UI). */
export function unlockLabel(a: (typeof ACCENTS)[number]): string {
  switch (a.unlock.type) {
    case 'start': return 'Disponível desde o início';
    case 'world': return a.unlock.label;
    case 'finish': return 'Termine todas as fases do jogo';
    case 'perfect': return 'Feche o jogo 100% perfeito (todas as estrelas)';
  }
}

/**
 * Nome da cor do app EM PORTUGUÊS, para o texto das aulas.
 * O destaque é customizável, então frases como "a cadeira marcada em verde"
 * mentem para quem escolheu roxo. Use o placeholder {cor} no texto.
 */
const ACCENT_WORD: Record<string, string> = {
  green: 'verde', blue: 'azul', purple: 'roxo', orange: 'laranja',
  pink: 'rosa', silver: 'prata', gold: 'dourado',
};
export function accentWord(): string {
  return ACCENT_WORD[currentAccent()] ?? 'verde';
}

/** Troca {cor} pelo nome da cor de destaque atual. */
export function withAccentWord(text: string): string {
  return text.includes('{cor}') ? text.replaceAll('{cor}', accentWord()) : text;
}

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
