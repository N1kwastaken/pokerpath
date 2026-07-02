import type { Position } from '@pokerpath/shared';

/**
 * Aulas = passos curtos. Tipos:
 *  - text   : 1 frase curta (texto mínimo).
 *  - visual : um visual (baralho/naipes, ordem, ranking, posições, demonstração de mãos).
 *  - hand   : um MINI-JOGO real — mesa de poker + decisão Raise/Fold, com o
 *             porquê. É aqui que o aluno pratica no meio da explicação.
 *  - quiz   : pergunta rápida (usada para termos como call/check).
 */
export type LessonStep =
  | { kind: 'text'; text: string }
  | { kind: 'visual'; visual: 'suits' | 'order' | 'ranking' | 'positions' | 'handranks' }
  | { kind: 'hand'; position: Position; hand: string; answer: 'FOLD' | 'RAISE'; explain: string }
  | { kind: 'quiz'; q: string; options: string[]; answer: number; explain: string };

const t = (text: string): LessonStep => ({ kind: 'text', text });
const v = (visual: 'suits' | 'order' | 'ranking' | 'positions' | 'handranks'): LessonStep => ({ kind: 'visual', visual });
const h = (position: Position, hand: string, answer: 'FOLD' | 'RAISE', explain: string): LessonStep =>
  ({ kind: 'hand', position, hand, answer, explain });
const quiz = (q: string, options: string[], answer: number, explain: string): LessonStep =>
  ({ kind: 'quiz', q, options, answer, explain });

export const LESSONS: Record<string, LessonStep[]> = {
  // ── Mundo 0 ────────────────────────────────────────────────
  'Boas-vindas ao poker': [
    t(`No poker você quer ganhar fichas: ter a melhor mão OU fazer todos desistirem.`),
    t(`Você recebe 2 cartas suas; até 5 ficam na mesa, para todos.`),
    quiz(`Dá pra ganhar sem ter a melhor mão?`, ['Não', 'Sim, fazendo todos desistirem'], 1,
      `Sim! Se todos foldam, você leva o pote sem mostrar as cartas.`),
  ],
  'Baralho e naipes': [
    t(`São 52 cartas em 4 naipes:`),
    v('suits'),
    quiz(`Qual naipe vale mais no Hold'em?`, ['Espadas ♠', 'Nenhum: todos iguais'], 1,
      `Nenhum — os naipes têm o mesmo valor.`),
  ],
  'Ordem das cartas': [
    t(`Do 2 (mais fraco) ao Ás (mais forte):`),
    v('order'),
    quiz(`Quem vale mais: A ou K?`, ['K', 'A'], 1, `O Ás (A) é a carta mais alta.`),
  ],
  'Ranking de mãos': [
    t(`Sua jogada usa 5 cartas: as 2 da sua mão + as da mesa. Veja cada uma, da mais forte à mais fraca:`),
    v('handranks'),
    quiz(`Flush ou Sequência: quem ganha?`, ['Sequência', 'Flush'], 1, `Flush é mais forte.`),
    quiz(`Você tem A♠ A♦ e a mesa traz A♥ 9♣ 5♠. Que jogada é essa?`, ['Par', 'Trinca', 'Dois pares'], 1,
      `Trinca de Ases: as duas da mão + o Ás da mesa = três iguais.`),
  ],
  'Anatomia de uma rodada': [
    t(`Antes das cartas, SB e BB pagam apostas obrigatórias (os blinds) e criam o pote.`),
    t(`Ações: Fold (desistir), Call (pagar), Check (passar de graça), Raise (aumentar).`),
    quiz(`Ninguém apostou e você quer ver a carta de graça. Qual ação?`, ['Fold', 'Check', 'Raise'], 1,
      `Check: sem aposta para pagar, você passa de graça.`),
    quiz(`O vilão apostou e você quer continuar pagando o valor. Qual ação?`, ['Call', 'Check'], 0,
      `Call = pagar a aposta. Não dá check quando já há aposta.`),
  ],

  // ── Mundo 1 ────────────────────────────────────────────────
  'Posição (aula)': [
    t(`Posição é sua ordem de jogo. Quem age por último leva vantagem:`),
    v('positions'),
    t(`A MESMA mão muda de decisão conforme a posição. Veja:`),
    h('BTN', 'A♠J♣', 'RAISE', `No BTN você age por último — AJo abre fácil.`),
    h('UTG', 'A♠J♣', 'FOLD', `A mesma AJo, mas de UTG (primeiro a agir), é fold.`),
  ],
  'Abrir o pote': [
    t(`Open raise = ser o primeiro a aumentar. Sizing padrão: ~2,5x o big blind.`),
    h('CO', 'A♣A♦', 'RAISE', `AA é premium — sempre raise ao abrir.`),
    t(`Da SB abre-se maior (~3x): você jogará fora de posição contra o BB, então cobra mais caro.`),
  ],
  'A arte do fold': [
    t(`Saber desistir economiza fichas. Foldar mão fraca não é covardia, é lucro.`),
    h('UTG', '9♣9♦', 'FOLD', `De UTG, 99 é fold no range simplificado. Disciplina!`),
  ],
  'Recapitulando': [
    t(`Posição manda: quanto mais tarde, mais mãos você abre.`),
    h('BTN', 'K♣Q♦', 'RAISE', `KQo abre no botão…`),
    h('UTG', 'K♣Q♦', 'FOLD', `…mas a mesma KQo é fold de UTG.`),
    t(`Pronto para o teste final! 🚀`),
  ],

  // ── Mundos 2–5 ─────────────────────────────────────────────
  'UTG explicado': [
    t(`UTG age primeiro, sem informação — por isso o range é o mais apertado.`),
    quiz(`Por que o range de UTG é apertado?`, ['Poucas fichas', 'Todos agem depois de você'], 1,
      `Agindo primeiro, só vale abrir mãos fortes.`),
  ],
  'Range de UTG': [
    t(`Abertura de UTG: TT+, AQ+ e KQ do mesmo naipe (veja o gráfico).`),
    h('UTG', 'A♥T♥', 'FOLD', `ATs ainda é fold de UTG (Ax suited só a partir de AQs).`),
  ],
  'MP explicado': [
    t(`No MP, com menos gente atrás, dá pra abrir um pouco mais que no UTG.`),
    quiz(`O range de MP, comparado ao de UTG, é…`, ['Mais apertado', 'Mais largo'], 1, `Mais largo.`),
  ],
  'Range de MP': [
    t(`No MP entram AJs, QJs e 99 (veja o gráfico).`),
    h('MP', 'Q♠J♠', 'RAISE', `QJs já abre de MP.`),
  ],
  'CO explicado': [
    t(`CO fica antes do botão: posição boa, range largo.`),
    quiz(`Melhor posição significa…`, ['Range aperta', 'Range abre (mais mãos)'], 1, `Mais mãos jogáveis.`),
  ],
  'Range de CO': [
    t(`No CO entram ATs, KJs, JTs, AJo e KQo (veja o gráfico).`),
    h('CO', 'A♠J♥', 'RAISE', `AJo já abre de CO (era fold em UTG/MP).`),
  ],
  'BTN explicado': [
    t(`BTN é a melhor cadeira: age por último depois do flop. Range bem largo.`),
    h('BTN', '7♠6♠', 'RAISE', `Até conectores como 76s abrem no botão.`),
  ],
  'Range de BTN': [
    t(`No botão entram todos os pares, Ax suited e muitos conectores (veja o gráfico).`),
    h('BTN', '2♣2♥', 'RAISE', `Até 22 abre no botão.`),
  ],
  // ── Mundo 6 (SB) ───────────────────────────────────────────
  'SB explicado': [
    t(`Na SB você já colocou meio blind. Antes do flop resta só o BB para agir — por isso o range de abertura é LARGO.`),
    v('positions'),
    t(`O lado ruim: no flop você joga FORA de posição (age primeiro). Por isso abre-se MAIOR, ~3x o BB.`),
    h('SB', '5♦4♦', 'RAISE', `Da SB, até 54s abre — só o BB resta para pagar.`),
  ],
  'Range de SB': [
    t(`A SB abre quase metade das mãos: todos os pares, qualquer Ás suited e muitos offsuit. Veja o gráfico.`),
    h('SB', 'A♣7♦', 'RAISE', `A7o já abre da SB.`),
    h('SB', 'K♦9♣', 'FOLD', `Mas K9o não: offsuit só de KTo pra cima.`),
  ],

  // ── Mundo 7 (Revisão) ──────────────────────────────────────
  'Revisão geral': [
    t(`Hora de misturar tudo. A regra de ouro: quanto mais tarde a posição, mais largo o range.`),
    v('positions'),
    h('UTG', 'A♠J♦', 'FOLD', `De UTG, AJo é fold.`),
    h('BTN', 'A♠J♦', 'RAISE', `A MESMA AJo, no BTN, abre fácil.`),
  ],
  // ── Defesa do BB ───────────────────────────────────────────
  'BB explicado': [
    t(`O big blind já colocou 1 ficha e age por ÚLTIMO no pré-flop — fecha a ação e paga "com desconto". Por isso defende muitas mãos.`),
    v('positions'),
    quiz(`Por que o BB defende tantas mãos contra um open?`, ['Está em posição no flop', 'Já pagou o blind e fecha a ação (bom preço)'], 1,
      `O desconto do blind dá um ótimo preço para pagar.`),
  ],
  'Defesa do BB': [
    t(`Contra um open há 3 opções: Fold (lixo), Call (a maioria das mãos jogáveis) ou 3-bet (relançar) com as premium por valor.`),
    quiz(`Você tem A♠ A♥ no BB e o BTN abriu. Melhor jogada?`, ['Call', '3-bet (Raise)'], 1,
      `AA é 3-bet por valor — construa o pote.`),
    quiz(`72o no BB contra um open. Jogada?`, ['Call', 'Fold'], 1,
      `72o não defende nem com preço. Fold.`),
  ],
  // ── Ruas pós-flop (em breve) ───────────────────────────────
  'Flop — intro': [
    t(`O flop traz 3 cartas na mesa. Aqui você aprende a continuation bet (c-bet) e a ler texturas de board. Em breve!`),
  ],
  'Turn — intro': [
    t(`A 4ª carta (turn) aumenta o pote e as decisões. Em breve: quando apostar, dar check ou fold.`),
  ],
  'River — intro': [
    t(`No river não vêm mais cartas: é value ou blefe. Em breve: extrair valor e blefar na hora certa.`),
  ],
};

export const DEFAULT_LESSON: LessonStep[] = [
  t(`Raise com as mãos fortes, Fold com as fracas. Observe a posição. Você consegue! 🎴`),
];

export function lessonFor(concept: string): LessonStep[] {
  return LESSONS[concept] ?? DEFAULT_LESSON;
}
