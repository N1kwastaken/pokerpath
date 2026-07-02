/** Categoria (sub-seção) de uma fase a partir do conceito: UTG, MP, CO, BTN, SB, Revisão ou Fundamentos. */
export function stageGroup(concept: string): string {
  for (const g of ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']) if (concept.includes(g)) return g;
  if (concept.startsWith('Mix') || concept.includes('Desafio') || concept.includes('Revisão geral')) return 'Revisão';
  return 'Fundamentos';
}

/** Cor e descrição de cada categoria (para banner + nós da mesma cor). */
const CAT: Record<string, { color: string; desc: string }> = {
  Fundamentos: { color: '#1B8A4C', desc: 'Regras e posição' },
  UTG: { color: '#6D5AE6', desc: 'Abertura de UTG' },
  MP: { color: '#3FA7D6', desc: 'Abertura de MP' },
  CO: { color: '#F0883E', desc: 'Abertura de CO' },
  BTN: { color: '#27D17C', desc: 'Abertura do botão' },
  SB: { color: '#E0529C', desc: 'Abertura da SB' },
  BB: { color: '#F2B807', desc: 'Defesa do big blind' },
  'Revisão': { color: '#EF4444', desc: 'Teste geral' },
};
export function categoryColor(name: string): string { return CAT[name]?.color ?? '#1B8A4C'; }
export function categoryDesc(name: string): string { return CAT[name]?.desc ?? ''; }
