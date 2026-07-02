/** Base de termos do glossário usada para realçar + explicar no texto (estilo Wikipedia). */
export type GlossaryEntry = { term: string; def: string; match: string[] };

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'GTO', def: 'Game Theory Optimal: a estratégia equilibrada, impossível de ser explorada. Aqui usamos uma versão simplificada.', match: ['GTO'] },
  { term: 'Range', def: 'O conjunto de mãos com que você joga numa situação (ex.: o range de abertura do BTN).', match: ['range', 'ranges'] },
  { term: 'Open raise (RFI)', def: 'Ser o primeiro a aumentar quando ninguém entrou no pote.', match: ['open raise', 'open-raise', 'RFI'] },
  { term: 'Sizing', def: 'O tamanho da aposta. Open padrão ~2,5x o BB; da SB costuma ser maior (~3x).', match: ['sizing'] },
  { term: '3-Bet', def: 'Relançar por cima de um raise (o terceiro aumento da mão).', match: ['3-bet', '3bet'] },
  { term: 'Blinds', def: 'Apostas obrigatórias antes das cartas (small e big blind). Criam o pote.', match: ['blinds', 'blind'] },
  { term: 'Big blind (BB)', def: 'Última posição a agir no pré-flop; também a unidade que mede o stack.', match: ['big blind', 'BB'] },
  { term: 'Small blind (SB)', def: 'Aposta obrigatória menor; joga fora de posição no pós-flop.', match: ['small blind', 'SB'] },
  { term: 'Suited', def: 'Duas cartas do mesmo naipe (ex.: A♠Q♠). Podem formar flush.', match: ['suited'] },
  { term: 'Offsuit', def: 'Duas cartas de naipes diferentes (ex.: A♠Q♥).', match: ['offsuit'] },
  { term: 'Conectores', def: 'Cartas em sequência, ex.: 7♠6♠. Podem virar sequência ou flush.', match: ['conectores', 'conector', 'connectors'] },
  { term: 'Mãos premium', def: 'As mais fortes (AA, KK, QQ, AK…), que abrem de qualquer posição.', match: ['premium'] },
  { term: 'Fold', def: 'Desistir da mão e jogar as cartas fora.', match: ['fold'] },
  { term: 'Call', def: 'Pagar o valor da aposta atual para continuar na mão.', match: ['call'] },
  { term: 'Raise', def: 'Aumentar a aposta.', match: ['raise'] },
  { term: 'Check', def: 'Passar a vez de graça — só quando ninguém apostou ainda.', match: ['check'] },
  { term: 'Board', def: 'As cartas comunitárias na mesa, compartilhadas por todos.', match: ['board'] },
  { term: 'Pot', def: 'O total de fichas em disputa na mão.', match: ['pote'] },
  { term: 'Stack', def: 'Quantas fichas você tem na mesa, medido em big blinds (BB).', match: ['stack'] },
  { term: 'Equity', def: 'Sua fatia do pote: a chance da sua mão ganhar no showdown.', match: ['equity'] },
  { term: 'Posição', def: 'Sua ordem de ação na rodada. Quem age por último leva vantagem.', match: ['posição', 'posições'] },
  { term: 'UTG', def: 'Under the Gun: a primeira posição a agir. Range mais apertado.', match: ['UTG'] },
  { term: 'BTN (botão)', def: 'O botão: melhor posição, age por último no pós-flop.', match: ['BTN', 'botão'] },
  { term: 'Cutoff (CO)', def: 'Posição logo antes do botão; range largo.', match: ['CO', 'cutoff'] },
  { term: 'MP', def: 'Posição do meio (Middle Position).', match: ['MP'] },
  { term: 'Estratégia mista', def: 'Jogar a mesma mão de formas diferentes numa frequência (ex.: 85% raise, 15% fold).', match: ['estratégia mista', 'mista'] },
];

const ALL = GLOSSARY.flatMap((e) => e.match.map((m) => ({ m, e })));
ALL.sort((a, b) => b.m.length - a.m.length); // termos maiores primeiro
const LOOKUP = new Map(ALL.map((x) => [x.m.toLowerCase(), x.e]));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let RE: RegExp | null = null;
function regex(): RegExp {
  if (!RE) RE = new RegExp('(?<![\\p{L}\\d])(' + ALL.map((x) => esc(x.m)).join('|') + ')(?![\\p{L}\\d])', 'giu');
  return RE;
}

/** Quebra o texto em segmentos, marcando o 1º aparecimento de cada termo. */
export function highlightSegments(text: string): { text: string; entry?: GlossaryEntry }[] {
  const out: { text: string; entry?: GlossaryEntry }[] = [];
  const seen = new Set<string>();
  let last = 0;
  for (const m of text.matchAll(regex())) {
    const idx = m.index ?? 0;
    const word = m[0];
    const entry = LOOKUP.get(word.toLowerCase());
    if (!entry || seen.has(entry.term)) continue;
    seen.add(entry.term);
    if (idx > last) out.push({ text: text.slice(last, idx) });
    out.push({ text: word, entry });
    last = idx + word.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
