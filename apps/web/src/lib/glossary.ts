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
  // ── 3-bet e pré-flop avançado ──────────────────────────────
  { term: '4-Bet', def: 'Relançar por cima de um 3-bet (o quarto aumento). Range pequeno: valor máximo e alguns blefes com blocker.', match: ['4-bet', '4bet'] },
  { term: 'Squeeze', def: '3-bet contra um open que JÁ tem caller: você aperta os dois de uma vez, aproveitando o dinheiro morto no pote.', match: ['squeeze'] },
  { term: 'Blocker', def: 'Carta sua que reduz as combinações fortes do vilão. Com um Ás na mão, AA e AK dele ficam menos prováveis.', match: ['blocker', 'blockers'] },
  { term: 'Caller', def: 'Quem apenas pagou uma aposta ou um raise, sem aumentar.', match: ['caller'] },
  { term: 'Dinheiro morto', def: 'Fichas no pote de quem provavelmente vai desistir — o combustível do squeeze.', match: ['dinheiro morto'] },
  { term: 'Dominada', def: 'Sua mão contra uma parecida de kicker maior (KJ contra AJ): quando acerta, perde caro.', match: ['dominada', 'dominadas', 'dominado'] },
  { term: 'Fold equity', def: 'A parte do valor de uma aposta que vem da chance do vilão simplesmente desistir.', match: ['fold equity'] },
  { term: 'Em posição / OOP', def: 'Em posição (IP) = agir DEPOIS do vilão: vantagem. Fora de posição (OOP) = agir antes: desvantagem.', match: ['em posição', 'em posicao', 'fora de posição', 'fora de posicao', 'OOP'] },
  { term: 'Multiway', def: 'Pote com três ou mais jogadores: mãos marginais perdem valor e blefes ficam caros.', match: ['multiway'] },
  // ── Ruas e pós-flop ────────────────────────────────────────
  { term: 'Flop', def: 'As três primeiras cartas comunitárias.', match: ['flop'] },
  { term: 'Turn', def: 'A quarta carta comunitária.', match: ['turn'] },
  { term: 'River', def: 'A quinta e última carta comunitária.', match: ['river'] },
  { term: 'C-bet', def: 'Continuation bet: a aposta de quem foi o agressor no pré-flop, continuando a pressão no flop.', match: ['c-bet', 'cbet'] },
  { term: 'Barrel', def: 'Seguir apostando na rua seguinte: segunda bala no turn, terceira no river.', match: ['barrel', 'segunda bala'] },
  { term: 'Blefe', def: 'Apostar sem a melhor mão para fazer o vilão desistir de uma melhor.', match: ['blefe', 'blefes', 'blefar'] },
  { term: 'Semi-blefe', def: 'Apostar com um projeto: você pode levar o pote agora OU completar a melhor mão depois.', match: ['semi-blefe', 'semi-blefes'] },
  { term: 'Bluff-catcher', def: 'Mão que só ganha de blefe: perde para as apostas de valor, mas vence os blefes do vilão.', match: ['bluff-catcher', 'bluff-catch'] },
  { term: 'Value bet', def: 'Aposta por valor: feita quando uma mão PIOR que a sua ainda paga.', match: ['value bet'] },
  { term: 'Showdown', def: 'Mostrar as cartas no fim da mão. "Showdown value" = mão que ganha sem precisar apostar.', match: ['showdown'] },
  { term: 'Overpair', def: 'Par na mão maior que qualquer carta do board (ex.: QQ num board J-8-3).', match: ['overpair'] },
  { term: 'Top pair', def: 'Par com a carta mais alta do board.', match: ['top pair'] },
  { term: 'Kicker', def: 'A carta de desempate ao lado do seu par. AK num board K-7-2: par de reis, kicker ás.', match: ['kicker'] },
  { term: 'Trinca', def: 'Três cartas iguais — a versão com par na mão (ex.: 88 num board com 8) é disfarçada e lucrativa.', match: ['trinca'] },
  { term: 'Projeto (draw)', def: 'Mão incompleta que pode virar flush ou sequência na próxima carta.', match: ['projeto', 'projetos', 'draw'] },
  { term: 'Flush draw', def: 'Quatro cartas do mesmo naipe: falta uma para o flush (9 outs).', match: ['flush draw'] },
  { term: 'Open-ended', def: 'Projeto de sequência aberto nas duas pontas: 8 outs (ex.: JT num board 9-8-x).', match: ['open-ended', 'sequência aberta', 'sequencia aberta'] },
  { term: 'Gutshot', def: 'Projeto de sequência "de buraco": só uma carta no meio completa (4 outs).', match: ['gutshot'] },
  { term: 'Outs', def: 'As cartas do baralho que completam a sua mão.', match: ['outs'] },
  { term: 'Textura do board', def: 'Board SECO = desconectado, poucos projetos (favorece o agressor). MOLHADO = conectado, cheio de projetos.', match: ['textura', 'board seco', 'board molhado', 'seco', 'molhado'] },
  { term: 'Blank', def: 'Carta de turn/river que não muda nada — não completa projetos.', match: ['blank'] },
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
