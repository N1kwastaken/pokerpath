/** Categoria (sub-seção) de uma fase a partir do conceito: UTG, MP, CO, BTN, SB, Revisão ou Fundamentos. */
export function stageGroup(concept: string): string {
  if (/^3-?bet/i.test(concept) || concept === 'Revisão 3bet') return '3-Bet';
  if (/^4-?bet/i.test(concept) || concept === 'Revisão 4bet') return '4-Bet';
  if (/vsutg/i.test(concept)) return 'vs UTG';
  if (/board/i.test(concept)) return 'Leitura';
  if (/projeto/i.test(concept)) return 'Projetos';
  if (/forte/i.test(concept)) return 'Mãos fortes';
  if (/catch/i.test(concept)) return 'Bluff-catch';
  if (/blefe/i.test(concept)) return 'Blefe & fold';
  if (/teste/i.test(concept)) return 'Teste';
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
  '3-Bet': { color: '#00B3B3', desc: 'Relançar um open' },
  '4-Bet': { color: '#C2185B', desc: 'Reagir a um 3-bet' },
  'vs UTG': { color: '#7E57C2', desc: 'Defender vs open apertado' },
  'Leitura': { color: '#20A39E', desc: 'Ler a textura do board' },
  'Mãos fortes': { color: '#E4572E', desc: 'Mãos feitas de valor' },
  'Projetos': { color: '#17A2B8', desc: 'Projetos e semi-blefe' },
  'Bluff-catch': { color: '#8E7CC3', desc: 'Pagar apostas finas' },
  'Blefe & fold': { color: '#6C757D', desc: 'Ar: quando desistir' },
  'Teste': { color: '#EF4444', desc: 'Misture tudo' },
  'Revisão': { color: '#EF4444', desc: 'Teste geral' },
};
export function categoryColor(name: string): string { return CAT[name]?.color ?? '#1B8A4C'; }
export function categoryDesc(name: string): string { return CAT[name]?.desc ?? ''; }
