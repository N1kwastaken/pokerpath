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
  // facing: contexto de aposta do vilão (ex.: "O BTN abriu 2,5x") — habilita o botão Call.
  | { kind: 'hand'; position: Position; hand: string; answer: 'FOLD' | 'RAISE' | 'CALL'; explain: string; facing?: string }
  // table: mostra a situação NA MESA (mão do herói + cartas comunitárias) em vez de só texto.
  | { kind: 'quiz'; q: string; options: string[]; answer: number; explain: string; table?: { position: Position; hand: string; board?: string } }
  | { kind: 'order'; prompt: string; items: string[]; explain: string }
  | { kind: 'match'; prompt: string; pairs: [string, string][]; explain: string };

const t = (text: string): LessonStep => ({ kind: 'text', text });
const v = (visual: 'suits' | 'order' | 'ranking' | 'positions' | 'handranks'): LessonStep => ({ kind: 'visual', visual });
const h = (position: Position, hand: string, answer: 'FOLD' | 'RAISE', explain: string): LessonStep =>
  ({ kind: 'hand', position, hand, answer, explain });
const hc = (position: Position, hand: string, facing: string, answer: 'FOLD' | 'RAISE' | 'CALL', explain: string): LessonStep =>
  ({ kind: 'hand', position, hand, answer, explain, facing });
const quiz = (q: string, options: string[], answer: number, explain: string): LessonStep =>
  ({ kind: 'quiz', q, options, answer, explain });
const quizT = (table: { position: Position; hand: string; board?: string }, q: string, options: string[], answer: number, explain: string): LessonStep =>
  ({ kind: 'quiz', q, options, answer, explain, table });
const order = (prompt: string, items: string[], explain: string): LessonStep =>
  ({ kind: 'order', prompt, items, explain });
const match = (prompt: string, pairs: [string, string][], explain: string): LessonStep =>
  ({ kind: 'match', prompt, pairs, explain });

export const LESSONS: Record<string, LessonStep[]> = {
  // ── Mundo 0 ────────────────────────────────────────────────
  'Boas-vindas ao poker': [
    t(`No poker você quer ganhar fichas: ter a melhor mão OU fazer todos desistirem.`),
    t(`Você recebe 2 cartas suas; até 5 ficam na mesa, para todos.`),
    quiz(`Dá pra ganhar sem ter a melhor mão?`, ['Não', 'Sim, fazendo todos desistirem'], 1,
      `Sim! Se todos desistem, as fichas apostadas são suas — sem nem mostrar as cartas.`),
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
    order(`Agora você: coloque da MAIS FORTE para a mais fraca.`, ['A♠', 'K♥', 'Q♦', 'J♣', 'T♠', '9♥'],
      `Ás > Rei > Dama > Valete > Dez > Nove. O T representa o 10.`),
  ],
  'Ranking de mãos': [
    t(`Sua jogada usa 5 cartas: as 2 da sua mão + as da mesa. Veja cada uma, da mais forte à mais fraca:`),
    v('handranks'),
    quiz(`Flush ou Sequência: quem ganha?`, ['Sequência', 'Flush'], 1, `Flush é mais forte.`),
    quizT({ position: 'BTN', hand: 'A♠A♦', board: 'A♥ 9♣ 5♠' },
      `Olhe a mesa: você tem A♠ A♦ e o flop trouxe mais um Ás. Que jogada é essa?`, ['Par', 'Trinca', 'Dois pares'], 1,
      `Trinca de Ases: as duas da mão + o Ás da mesa = três iguais.`),
    match(`Combine o nome da jogada com as cartas:`, [
      ['Trinca', '8♠ 8♥ 8♦'],
      ['Flush', 'A♠ J♠ 8♠ 6♠ 3♠'],
      ['Sequência', '5♥ 6♣ 7♦ 8♠ 9♣'],
      ['Full house', 'K♠ K♥ K♦ 9♣ 9♠'],
    ], `Trinca = 3 iguais; flush = mesmo naipe (5 cartas); sequência = 5 em ordem; full = trinca + par.`),
    order(`Ordene da jogada MAIS FORTE para a mais fraca:`, [
      'Quadra|9♠ 9♥ 9♦ 9♣',
      'Full house|K♠ K♥ K♦ 9♣ 9♠',
      'Flush|A♦ J♦ 8♦ 4♦ 2♦',
      'Sequência|4♣ 5♦ 6♠ 7♥ 8♣',
      'Par|Q♠ Q♥',
    ], `Quadra > Full house > Flush > Sequência > Par. Quanto mais rara, mais forte.`),
  ],
  'Anatomia de uma rodada': [
    t(`Antes das cartas, dois jogadores pagam apostas obrigatórias, chamadas BLINDS: o small blind (SB, a menor) e o big blind (BB, a maior).`),
    t(`Essas fichas vão para o meio da mesa e formam o POTE — o prêmio em disputa na rodada.`),
    t(`Na sua vez, você escolhe UMA ação: FOLD (desistir da mão), CALL (pagar a aposta), CHECK (passar a vez de graça, se ninguém apostou) ou RAISE (aumentar a aposta).`),
    t(`Depois vêm as cartas da mesa, em 3 etapas: FLOP (3 cartas de uma vez), TURN (mais 1) e RIVER (a última).`),
    quiz(`Ninguém apostou e você quer ver a carta de graça. Qual ação?`, ['Fold', 'Check', 'Raise'], 1,
      `Check: sem aposta para pagar, você passa de graça.`),
    quiz(`O vilão apostou e você quer continuar pagando o valor. Qual ação?`, ['Call', 'Check'], 0,
      `Call = pagar a aposta. Não dá check quando já há aposta.`),
  ],

  'Lendo sua mão': [
    t(`Sua jogada final usa 5 cartas: as 2 da sua mão + as melhores da mesa. Vamos treinar a leitura:`),
    quizT({ position: 'BTN', hand: '8♠8♦', board: 'K♥ 8♣ 3♠' },
      `Qual é a sua jogada?`, ['Um par', 'Trinca', 'Dois pares'], 1,
      `Trinca! Seus dois 8 + o 8 da mesa = três iguais.`),
    quizT({ position: 'BTN', hand: 'A♠K♠', board: 'Q♠ 7♠ 2♠' },
      `E agora?`, ['Carta alta', 'Flush'], 1,
      `Flush: cinco cartas de espadas (2 suas + 3 da mesa).`),
    quizT({ position: 'BTN', hand: '9♥8♥', board: '7♣ 6♦ 5♠' },
      `Qual jogada?`, ['Par', 'Sequência'], 1,
      `Sequência: 5-6-7-8-9 em ordem.`),
    quizT({ position: 'BTN', hand: 'A♦Q♣', board: 'Q♥ 9♠ 4♦' },
      `Sua jogada?`, ['Par de damas', 'Dois pares'], 0,
      `Um par de damas (a sua Q + a Q da mesa), com o Ás de reforço.`),
  ],
  'Ações na prática': [
    t(`Vamos treinar as 4 ações. Regra de ouro: só existe CHECK enquanto ninguém apostou.`),
    quiz(`Ninguém apostou. Sua mão é fraca, mas dá pra ver a próxima carta de graça. O que fazer?`, ['Fold', 'Check'], 1,
      `Check! Nunca desista de graça — ver carta grátis é sempre melhor que foldar aqui.`),
    quiz(`O vilão apostou e sua mão é muito fraca. O que fazer?`, ['Call', 'Fold'], 1,
      `Fold: pagar com mão fraca é queimar fichas.`),
    quiz(`Você tem uma mão FORTÍSSIMA e o vilão apostou. Qual jogada ganha mais fichas?`, ['Call', 'Raise'], 1,
      `Raise: com a melhor mão, aumente — faça o pote crescer.`),
    quiz(`O vilão apostou, sua mão é boa mas não incrível, e você quer só continuar. O que fazer?`, ['Call', 'Raise'], 0,
      `Call: paga o valor da aposta e segue na mão.`),
  ],
  'Mesa e posições': [
    t(`Na mesa de 6 jogadores, cada cadeira tem um nome. O disco branco (D) marca o "dealer" e gira a cada mão:`),
    v('positions'),
    // {cor} = cor de destaque escolhida pelo usuário (ver lib/accent.ts).
    t(`Nos treinos, VOCÊ é sempre a cadeira de baixo, marcada em {cor}. Os nomes (UTG, MP, CO, BTN, SB, BB) você vai decorar com o tempo — sem pressa.`),
    t(`Do flop em diante, o BTN é SEMPRE o último a agir — por isso é a melhor cadeira: decide vendo o que todos fizeram.`),
    quiz(`Quem age por último vê o que todos fizeram antes. Qual é a melhor cadeira?`, ['UTG (a primeira a falar)', 'BTN (o botão)'], 1,
      `O botão (BTN): depois do flop, decide por último, com o máximo de informação.`),
    t(`No PRÉ-FLOP existe UMA exceção: SB e BB já pagaram os blinds, então ganham o direito de falar depois de todos — inclusive do BTN. Quem começa é o UTG.`),
    order(`Monte a ordem em que as posições AGEM no PRÉ-FLOP (lembre da exceção dos blinds):`, ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
      `UTG fala primeiro. SB e BB, por já terem pago, fecham o pré-flop — só nessa rodada agem depois do BTN.`),
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
    t(`Open raise = ser o primeiro a aumentar a aposta. O tamanho padrão é ~2,5x o big blind (a aposta obrigatória maior).`),
    h('CO', 'A♣A♦', 'RAISE', `AA é premium — sempre raise ao abrir.`),
    t(`Da SB abre-se maior (~3x): você jogará fora de posição contra o BB, então cobra mais caro.`),
  ],
  'A arte do fold': [
    t(`Saber desistir economiza fichas. Foldar mão fraca não é covardia, é lucro.`),
    h('UTG', 'K♠J♥', 'FOLD', `De UTG, KJo é fold — parece forte, mas offsuit fica de fora tão cedo. Disciplina!`),
  ],
  'Recapitulando': [
    t(`Posição manda: quanto mais tarde, mais mãos você abre.`),
    h('BTN', 'Q♣J♦', 'RAISE', `QJo abre no botão…`),
    h('UTG', 'Q♣J♦', 'FOLD', `…mas a mesma QJo é fold de UTG.`),
    t(`Pronto para o teste final! 🚀`),
  ],

  'Ler o gráfico': [
    t(`Este é um GRÁFICO DE MÃOS — o mapa que diz o que fazer com cada mão inicial. Cada quadradinho é uma combinação das suas 2 cartas:`),
    t(`A DIAGONAL são os pares (AA, KK… 22). ACIMA dela ficam as mãos do MESMO naipe (AKs, o "s" de suited). ABAIXO, as de naipes diferentes (AKo, o "o" de offsuit).`),
    t(`As cores dizem a ação: VERDE = aumentar (raise) e CINZA = descartar (fold). Quadradinho dividido = mão de fronteira: joga das duas formas, na proporção das cores.`),
    quiz(`AKs (A e K do mesmo naipe) fica onde no gráfico?`, ['Acima da diagonal', 'Abaixo da diagonal'], 0,
      `Mesmo naipe (suited) = acima da diagonal. Naipes diferentes (offsuit) = abaixo.`),
    t(`Última convenção: "TT+" quer dizer "par de dez OU MELHOR" (TT, JJ, QQ…). É assim que os ranges são escritos.`),
    t(`E o melhor: você NÃO precisa decorar nada. Dentro de qualquer fase, toque no botão 📊 no topo para abrir o gráfico da sua posição — e nos termos sublinhados para o glossário.`),
  ],

  // ── Mundos 2–5 ─────────────────────────────────────────────
  'UTG explicado': [
    t(`UTG age primeiro, sem informação — por isso o range é o mais apertado.`),
    quiz(`Por que o range de UTG é apertado?`, ['Poucas fichas', 'Todos agem depois de você'], 1,
      `Agindo primeiro, só vale abrir mãos fortes.`),
  ],
  'Range de UTG': [
    t(`Abertura de UTG: todos os pares, os ases do mesmo naipe, as broadway suited (KTs+, QTs+, JTs), alguns conectores e AQ+ / KQo. Dá umas 14 mãos em cada 100 — o range mais apertado da mesa (veja o gráfico).`),
    h('UTG', 'A♥T♥', 'RAISE', `ATs abre: mesmo naipe, e o ás dá o nut flush.`),
    h('UTG', 'A♠T♦', 'FOLD', `ATo é a MESMA mão sem o naipe — e aí não abre. O naipe muda tudo aqui.`),
  ],
  'MP explicado': [
    t(`No MP, com menos gente atrás, dá pra abrir um pouco mais que no UTG.`),
    quiz(`O range de MP, comparado ao de UTG, é…`, ['Mais apertado', 'Mais largo'], 1, `Mais largo.`),
  ],
  'Range de MP': [
    t(`Um jogador a menos atrás e o range já abre: no MP entram os ases do meio (A9s, A8s…), K9s, Q9s, J9s e as broadway sem naipe como KJo. Umas 20 mãos em cada 100 (veja o gráfico).`),
    h('MP', 'A♠9♠', 'RAISE', `A9s abre de MP — de UTG ficava de fora.`),
  ],
  'CO explicado': [
    t(`CO fica antes do botão: posição boa, range largo.`),
    quiz(`Melhor posição significa…`, ['Range aperta', 'Range abre (mais mãos)'], 1, `Mais mãos jogáveis.`),
  ],
  'Range de CO': [
    t(`Com só três atrás, o CO abre umas 26 mãos em cada 100: entram os reis médios (K7s+), Q8s, J8s, conectores até 54s e as broadway sem naipe até JTo (veja o gráfico).`),
    h('CO', 'A♠9♦', 'RAISE', `A9o abre de CO — era fold em UTG e MP.`),
  ],
  'BTN explicado': [
    t(`BTN é a melhor cadeira: age por último depois do flop. Range bem largo.`),
    h('BTN', '4♠3♠', 'RAISE', `Até 43s abre no botão: em posição, dá pra jogar mão pequena.`),
  ],
  'Range de BTN': [
    t(`O botão abre quase metade das mãos — qualquer ás, qualquer rei do mesmo naipe e muitos conectores. Só os blinds restam para pagar (veja o gráfico).`),
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
    h('SB', 'K♦6♣', 'FOLD', `Mas K6o não: os reis offsuit mais fraquinhos ficam de fora até da SB.`),
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
    hc('BB', 'K♠J♠', 'O BTN abriu 2,5x', 'CALL',
      `KJs é forte demais pra foldar, mas não é premium: CALL — pague e veja o flop com desconto.`),
    hc('BB', 'A♠A♥', 'O BTN abriu 2,5x', 'RAISE',
      `AA é 3-bet por valor — relance e construa o pote.`),
    hc('BB', '7♦2♣', 'O BTN abriu 2,5x', 'FOLD',
      `72o não defende nem com o desconto do blind. Fold.`),
    quiz(`Então: qual ação cobre a MAIORIA das mãos jogáveis do BB contra um open?`, ['Call', '3-bet'], 0,
      `Call — com o desconto do blind, pagar e ver o flop é o padrão; o 3-bet fica para as premium (e alguns blefes).`),
  ],
  // ── 3-Bet ──────────────────────────────────────────────────
  '3bet explicado': [
    t(`3-bet = relançar quem abriu. É a 3ª aposta: o blind (1ª), o open (2ª) e o seu re-raise (3ª).`),
    quiz(`Alguém abriu 2,5x e você relança. Isso é um…`, ['Call', '3-bet'], 1,
      `Isso mesmo — re-raise sobre um open é um 3-bet.`),
    t(`Serve para duas coisas: ganhar valor com mãos fortes e roubar o pote na hora com blefes.`),
  ],
  '3bet value blefe': [
    t(`Por valor: AA, KK, QQ, AK. Você quer o pote grande porque costuma estar na frente.`),
    h('BTN', 'A♠A♣', 'RAISE', `AA relança por valor — construa o pote.`),
    t(`Como blefe: ases suited baixos (A5s, A4s). Eles bloqueiam AA/AK do vilão e ainda fazem nut flush.`),
    h('BTN', 'A♠5♠', 'RAISE', `A5s: blocker + potencial de flush = ótimo 3-bet blefe.`),
  ],
  // ── 4-Bet e defesa vs UTG ──────────────────────────────────
  '4bet explicado': [
    t(`4-bet = o relanço do relanço: você abriu, o vilão deu 3-bet, e você re-relança.`),
    t(`Como o pote fica enorme, o range de 4-bet por valor é pequeno: basicamente AA, KK, AKs.`),
    quiz(`Você abriu com QQ e levou um 3-bet. Geralmente é melhor…`, ['4-bet', 'Pagar o 3-bet'], 1,
      `QQ costuma pagar: 4-betar deixa você exposto contra AA/KK/AK.`),
  ],
  '4bet value blefe': [
    t(`Por valor: AA, KK, AKs. Você quer todo o dinheiro no meio.`),
    t(`Como blefe: A5s/A4s — bloqueiam AA e AK, então o vilão tem menos continues.`),
    quiz(`Por que A5s é um bom 4-bet blefe?`, ['Faz flush fácil', 'O ás bloqueia AA e AK do vilão'], 1,
      `O blocker reduz as mãos com que o vilão paga ou 5-beta.`),
  ],
  'vsUTG intro': [
    t(`UTG abre o range mais apertado da mesa (só mãos fortes).`),
    t(`Por isso você defende contra UTG bem mais tight do que contra CO ou BTN: menos 3-bets, menos calls.`),
    quiz(`Contra um open de UTG, seu range de defesa deve ser…`, ['Mais largo', 'Mais apertado'], 1,
      `Range apertado do vilão pede defesa apertada sua.`),
  ],
  'vsMP-CO intro': [
    t(`MP e CO abrem mais largo que UTG — e quanto mais largo o open, mais mãos você defende.`),
    t(`Vs MP: um pouco mais que vs UTG. Vs CO: bem mais — até 3-bets blefe com A5s e calls com pares médios.`),
    quiz(`Contra qual open você defende mais mãos?`, ['MP', 'CO'], 1,
      `CO abre mais largo, então sua defesa também alarga.`),
  ],
  'Squeeze intro': [
    t(`Squeeze = 3-bet contra um open que JÁ tem caller: você aperta os dois de uma vez.`),
    t(`O caller deixou dinheiro morto no pote — e quem só paga raramente tem mão premium.`),
    quiz(`CO abre, BTN paga e você relança da SB. Isso é um…`, ['Call', 'Squeeze'], 1,
      `Open + caller + seu re-raise = squeeze.`),
    t(`Da SB, evite só pagar fora de posição: aperte forte (ou com blockers tipo A5s) ou desista. Exceção: pares médios pagam pra buscar trinca.`),
  ],
  // ── Aulas extras ───────────────────────────────────────────
  '3bet blockers': [
    t(`Blocker = uma carta sua que reduz as combinações fortes do vilão.`),
    t(`Com A♠5♠ você segura um dos ases: fica mais difícil o vilão ter AA ou AK. Por isso é um bom 3-bet blefe.`),
    quiz(`Por que A5s blefa melhor que 87s como 3-bet?`, ['Faz mais sequência', 'O ás bloqueia AA/AK do vilão'], 1,
      `O blocker de ás reduz as mãos com que o vilão continua.`),
  ],
  'Flop board': [
    t(`Board seco (ex.: K♠7♦2♣): poucas sequências/flushes possíveis — favorece quem abriu.`),
    t(`Board molhado (ex.: 9♥8♥7♣): muitos projetos — perigoso, exige mãos mais fortes para continuar.`),
    quiz(`Em qual board vale continuar com mais cuidado?`, ['Seco K♠7♦2♣', 'Molhado 9♥8♥7♣'], 1,
      `Boards molhados dão mais projetos ao vilão: cuidado.`),
  ],
  'Cbet intro': [
    t(`Agora VOCÊ é o agressor: você abriu, o BB pagou e deu check. Apostar (c-bet) ou dar check?`),
    t(`Board SECO (ex.: K♠7♦2♣) favorece quem abriu: aposte por valor e com blefes baratos.`),
    t(`Board MOLHADO (ex.: 9♥8♥7♣) conecta com quem pagou: aposte só valor real; o resto dá check.`),
    quiz(`Você abriu com A♦5♦ e o flop veio K♠7♦2♣. O BB deu check. E aí?`, ['Check atrás', 'C-bet (blefe barato)'], 1,
      `Board seco raramente acertou o BB: um c-bet pequeno leva o pote com frequência.`),
    t(`Sem aposta do vilão, o check é grátis — aqui não existe fold: os botões viram Bet e Check.`),
  ],
  'Barrel intro': [
    t(`Você apostou o flop, o vilão pagou — e deu check de novo no turn. Segunda bala (barrel) ou freio?`),
    t(`Mão forte segue apostando. Projetos (flush/sequência) apostam como SEMI-blefe: ganham agora ou completam depois.`),
    t(`A carta do turn importa: A ou K ajudam o SEU range — bons pra blefar. Turn blank com ar? Desista: check.`),
    quiz(`Você balou o flop com J♦T♦ e o turn veio 3♥ num board 9♠8♦2♣. Check dele. E aí?`, ['Check — desisto', 'Bet — semi-blefe'], 1,
      `Sequência aberta: apostar pressiona agora e ainda pode virar a melhor mão.`),
  ],
  'Valuebet intro': [
    t(`River, o vilão deu check. Última decisão: apostar por valor, blefar ou mostrar de graça?`),
    t(`A régua do river: se uma mão PIOR paga sua aposta, aposte por valor. Se só mãos melhores pagam, check.`),
    t(`Sem NENHUM showdown value (nem ás-alto)? Blefar é a única forma de ganhar. Com showdown (par, ás-alto): check e mostre.`),
    quiz(`Seu flush draw não veio: você tem 9♥8♥ e só nove-alto no river. Check dele. E aí?`, ['Check — mostro', 'Bet — blefe'], 1,
      `Nove-alto não ganha showdown de nada: blefar é a única chance de levar o pote.`),
  ],
  // ── Flop / Turn / River (enfrentando apostas) ──────────────
  'Flop fortes intro': [
    t(`No flop você já tem 5 cartas para ler: as 2 suas + as 3 da mesa.`),
    t(`Com mão feita forte (par alto, trinca), o plano é ganhar fichas: pague ou aumente.`),
    quiz(`Você tem A♠A♦ no flop K♣7♦2♠ e o vilão aposta. Ideia?`, ['Fold', 'Pagar ou aumentar por valor'], 1,
      `Overpair é forte: nunca desista, extraia valor.`),
  ],
  'Flop projetos intro': [
    t(`Projeto = mão que ainda não é nada, mas pode virar sequência ou flush.`),
    t(`Com projeto forte vale continuar; com muitos outs, às vezes aumenta (semi-blefe).`),
    quiz(`8♥7♥ no flop 9♥6♥2♣: flush draw + sequência, e o vilão aposta.`, ['Fold', 'Continuar (call ou semi-blefe)'], 1,
      `Monster draw: muitos outs, continue.`),
  ],
  'Turn fortes intro': [
    t(`No turn (4ª carta) o pote cresce. Mãos fortes seguem apostando e pagando por valor.`),
    quiz(`Sua trinca continua sendo a melhor mão e o vilão aposta de novo. Ideia?`, ['Fold', 'Pagar ou aumentar'], 1,
      `Valor não desiste: mantenha a pressão.`),
  ],
  'Turn projetos intro': [
    t(`No turn resta só 1 carta (o river). Seu projeto tem menos chance de completar que no flop.`),
    quiz(`Flush draw não completou no turn e o preço ficou ruim. Tendência?`, ['Pagar sempre', 'Às vezes desistir'], 1,
      `Sem preço nem outs suficientes, projeto vira fold.`),
  ],
  'River fortes intro': [
    t(`No river não vêm mais cartas: ou você tem valor, ou blefa, ou desiste.`),
    t(`Com mão muito forte (full house, sequência), aumente por valor.`),
    quiz(`Você fez full house no river e o vilão aposta. Ideia?`, ['Só pagar', 'Aumentar por valor'], 1,
      `Mão monstro: aumente para extrair o máximo.`),
  ],
  'River catch intro': [
    t(`Bluff-catch = pagar com uma mão média porque o vilão pode estar blefando.`),
    t(`Top pair costuma ser bom bluff-catcher; ar (projeto que não veio) vira fold.`),
    quiz(`Top pair no river, o vilão aposta e muitos projetos falharam. Ideia?`, ['Fold', 'Pagar (bluff-catch)'], 1,
      `Contra projetos que erraram, top pair paga.`),
  ],
  // ── Avançado: postflop por textura ─────────────────────────
  // O Intermediário já ensinou "seco x molhado". Aqui o degrau é FREQUÊNCIA:
  // de quem é a vantagem de range e, por isso, quanto se aposta.
  'Textura vantagem': [
    t(`Você já sabe ler a textura. Agora o passo seguinte: de quem o board é?`),
    t(`Quem ABRE tem mais mãos fortes no range (AA, KK, AK). Quem paga no BB tem mais mãos médias e conectadas — ele foldaria as premium? Não: ele 3-betaria.`),
    t(`Então um board de cartas ALTAS (K♠7♦2♣, A♦8♣3♥) acerta MUITO mais o range de quem abriu. Isso é VANTAGEM DE RANGE.`),
    quiz(`No flop K♠7♦2♣, quem tem mais reis no range?`, ['O BB, que pagou', 'Você, que abriu'], 1,
      `Quem abre tem KK, AK, KQ, KJ… O BB defende poucos reis. O board é seu.`),
    t(`Com vantagem de range, a jogada é apostar PEQUENO e QUASE SEMPRE — até com ar. Você não precisa acertar: o vilão é que não consegue continuar.`),
    quiz(`Board seco onde você tem vantagem. Com que frequência apostar?`, ['Só quando acertar', 'Quase sempre, com aposta pequena'], 1,
      `Aposta pequena e frequente: barata quando falha, eficaz porque o range dele é fraco ali.`),
  ],
  'Textura molhada': [
    t(`Vire a mesa: board 9♥8♥6♣. De quem é esse flop?`),
    t(`É do BB. Ele defende 98s, 87s, 76s, T9s, 66… Você, que abriu, tem AK e AQ — que ali não valem nada.`),
    quiz(`No flop 9♥8♥6♣, quem tem mais sequências e dois pares?`, ['Você, que abriu', 'O BB, que pagou'], 1,
      `O BB. Sem vantagem de range, apostar sempre vira queimar fichas.`),
    t(`Sem vantagem, inverta a regra: aposte POUCAS vezes e MAIOR — só com valor de verdade ou projeto forte (semi-blefe).`),
    t(`Ar puro (A♦K♠ nesse board) dá CHECK. Você não tem equity nem fold equity: o vilão continua com metade do range dele.`),
    quiz(`Você abriu A♦K♠, flop 9♥8♥6♣, BB deu check. E aí?`, ['Bet — ele pode foldar', 'Check — sem equity e sem vantagem'], 1,
      `Check. Nesse board o BB quase nunca desiste, e sua mão não melhora bem.`),
    t(`Resumo: board ALTO e seco = aposta pequena quase sempre. Board BAIXO e conectado = aposte pouco, e maior.`),
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
