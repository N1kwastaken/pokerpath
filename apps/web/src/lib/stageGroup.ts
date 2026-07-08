/** Categoria (sub-seção) de uma fase a partir do conceito: UTG, MP, CO, BTN, SB, Revisão ou Fundamentos. */
export function stageGroup(concept: string): string {
  if (/^3-?bet/i.test(concept) || concept === 'Revisão 3bet') return '3-Bet';
  if (/^4-?bet/i.test(concept) || concept === 'Revisão 4bet') return '4-Bet';
  if (/vsutg/i.test(concept)) return 'vs UTG';
  if (/vsmp|vsco/i.test(concept)) return 'vs MP/CO';
  if (/squeeze/i.test(concept)) return 'Squeeze';
  if (/^cbet/i.test(concept)) return 'C-Bet';
  if (/^barrel/i.test(concept)) return 'Barrel';
  if (/^valuebet/i.test(concept)) return 'Value Bet';
  if (/^flop/i.test(concept)) return 'Flop';
  if (/^turn/i.test(concept)) return 'Turn';
  if (/^river/i.test(concept)) return 'River';
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
  'vs MP/CO': { color: '#5C6BC0', desc: 'Defesa vs opens mais largos' },
  'Squeeze': { color: '#7CB342', desc: 'Aperte open + caller' },
  'C-Bet': { color: '#8D6E63', desc: 'Apostar ou dar check' },
  'Barrel': { color: '#607D8B', desc: 'Segunda bala no turn' },
  'Value Bet': { color: '#9E9D24', desc: 'O river do agressor' },
  'Flop': { color: '#E4572E', desc: 'Decisões no flop' },
  'Turn': { color: '#20A39E', desc: 'A quarta carta' },
  'River': { color: '#8E7CC3', desc: 'A última carta' },
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
