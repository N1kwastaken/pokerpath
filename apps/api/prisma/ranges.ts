/**
 * Ranges: a FONTE ÚNICA da estratégia preflop.
 *
 * O chart que o aluno abre e as barras de frequência que ele vê depois de
 * responder saem os dois de `freqForHand()`. É isso que os faz concordar por
 * construção — antes eram dois caminhos independentes, e as barras vinham de
 * `difficulty` (um rótulo de RITMO), então KQs no UTG aparecia como raise 100%
 * no chart e raise 85% nas barras.
 *
 * Não importa `@pokerpath/shared`: o `deploy:db` roda o seed com `tsx` sem
 * buildar o shared antes, e o import quebraria o deploy em silêncio. Os tipos
 * daqui espelham `Frequencies`/`RangeCell` do shared — `tests/charts.test.ts`
 * garante que não divirjam.
 */

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const RI: Record<string, number> = Object.fromEntries(RANKS.map((r, i) => [r, i]));

/** Frequência (%) de cada ação. Soma 100. Espelha `Frequencies` do shared. */
export type Freq = { FOLD: number; CALL: number; RAISE: number };

export type CellAction = 'RAISE' | 'CALL' | 'FOLD';

/** Célula do grid 13x13. `action` é derivado (argmax) — ver `buildCells`. */
export type Cell = {
  hand: string;
  action: CellAction;
  freq: Freq;
  /** @deprecated Compatibilidade: linhas de `Range` antigas só têm isto. */
  mix?: { alt: CellAction; pct: number };
};

export type RangeDef = {
  position: string;
  /** 'RFI' (abertura) ou 'VS_<posição>' (defesa vs open). */
  scenario: string;
  label: string;
  raise: string[];
  /** Só nos charts de defesa: abrir é raise-ou-fold, não tem call. */
  call?: string[];
  /**
   * Mãos de fronteira, onde a estratégia é mista de verdade. O resto do range
   * é 100% — os tokens dão o grosso, isto dá a borda.
   */
  mix?: Record<string, Freq>;
};

// ─── Expansão de tokens ───────────────────────────────────────

/** Expande tokens tipo "TT+", "AQs+", "ATo+", "KQs", "76s" em rótulos de mão. */
export function expand(token: string): string[] {
  const pair = /^([AKQJT2-9])\1(\+)?$/.exec(token);
  if (pair) {
    const out: string[] = [];
    for (let i = 0; i <= RI[pair[1]]; i++) out.push(RANKS[i] + RANKS[i]);
    return pair[2] ? out : [pair[1] + pair[1]];
  }
  const m = /^([AKQJT2-9])([AKQJT2-9])(s|o)(\+)?$/.exec(token);
  if (!m) return [];
  const hi = m[1], suit = m[3], plus = m[4];
  const loStart = RI[m[2]];
  const labels: string[] = [];
  if (plus) {
    for (let lo = loStart; lo > RI[hi]; lo--) labels.push(hi + RANKS[lo] + suit);
  } else {
    labels.push(hi + m[2] + suit);
  }
  return labels;
}

export function raiseSet(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (const t of tokens) for (const h of expand(t)) set.add(h);
  return set;
}

/** Rótulo da mão a partir dos índices do grid. Linha 0 = A, coluna 0 = A. */
export function handLabel(row: number, col: number): string {
  if (row === col) return RANKS[row] + RANKS[col];
  if (row < col) return RANKS[row] + RANKS[col] + 's'; // triângulo superior
  return RANKS[col] + RANKS[row] + 'o';
}

/** Rótulo 13x13 de uma mão concreta ("A♠Q♥" → "AQo"). */
export function labelOfHand(hand: string): string {
  const r1 = hand[0], r2 = hand[2];
  if (r1 === r2) return r1 + r2;
  const hi = RI[r1] < RI[r2] ? r1 : r2;
  const lo = RI[r1] < RI[r2] ? r2 : r1;
  return hi + lo + (hand[1] === hand[3] ? 's' : 'o');
}

// ─── Frequências ──────────────────────────────────────────────

const PURE: Record<CellAction, Freq> = {
  RAISE: { FOLD: 0, CALL: 0, RAISE: 100 },
  CALL: { FOLD: 0, CALL: 100, RAISE: 0 },
  FOLD: { FOLD: 100, CALL: 0, RAISE: 0 },
};

// Expandir os tokens custa caro para repetir 169x por chart.
const setsCache = new WeakMap<RangeDef, { raise: Set<string>; call: Set<string> }>();
function setsFor(def: RangeDef) {
  let s = setsCache.get(def);
  if (!s) {
    s = { raise: raiseSet(def.raise), call: raiseSet(def.call ?? []) };
    setsCache.set(def, s);
  }
  return s;
}

/**
 * A estratégia para uma mão neste cenário. Alimenta o chart E o exercício —
 * é a função que faz os dois concordarem.
 */
export function freqForHand(def: RangeDef, hand: string): Freq {
  const mixed = def.mix?.[hand];
  if (mixed) return mixed;
  const { raise, call } = setsFor(def);
  if (raise.has(hand)) return PURE.RAISE;
  if (call.has(hand)) return PURE.CALL;
  return PURE.FOLD;
}

/** A ação que o chart pinta e que o exercício cobra: a mais frequente. */
export function mainAction(f: Freq): CellAction {
  if (f.RAISE >= f.CALL && f.RAISE >= f.FOLD) return 'RAISE';
  if (f.CALL >= f.FOLD) return 'CALL';
  return 'FOLD';
}

/**
 * Distância entre a 1ª e a 2ª ação mais frequente. Perto de 0 = cara-ou-coroa:
 * cobrar uma resposta "certa" aí reprova o aluno num lance que é indiferente.
 */
export function actionMargin(f: Freq): number {
  const [a, b] = [f.FOLD, f.CALL, f.RAISE].sort((x, y) => y - x);
  return a - b;
}

// ─── Grid ─────────────────────────────────────────────────────

export function buildCells(def: RangeDef): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < 13; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < 13; c++) {
      const hand = handLabel(r, c);
      const freq = freqForHand(def, hand);
      const action = mainAction(freq);
      row.push({ hand, action, freq, ...legacyMix(freq, action) });
    }
    grid.push(row);
  }
  return grid;
}

/**
 * `mix` do formato antigo, ainda escrito para um cliente velho (ou uma linha de
 * `Range` que sobreviveu — o seed só faz upsert, nunca apaga) continuar
 * renderizando. Só representa 2 ações; `freq` é quem tem a verdade.
 */
function legacyMix(freq: Freq, action: CellAction): { mix?: { alt: CellAction; pct: number } } {
  const alt = (['RAISE', 'CALL', 'FOLD'] as CellAction[])
    .filter((a) => a !== action && freq[a] > 0)
    .sort((a, b) => freq[b] - freq[a])[0];
  return alt ? { mix: { alt, pct: freq[action] } } : {};
}

// ─── Definições ───────────────────────────────────────────────

/**
 * Abertura (RFI). Abrir é raise-ou-fold: quem abre a ação não tem com o que
 * dar call, por isso não há `call` aqui.
 */
const RFI_DEFS: RangeDef[] = [
  // Ases suited polarizados: ATs+ entra por valor; A5s-A2s entram como blefe
  // (bloqueiam AA/AK do vilão e fazem o nut flush). A6s-A9s ficam de fora — não
  // têm nem o valor de cima nem o blocker de baixo.
  {
    position: 'UTG', scenario: 'RFI', label: 'UTG · Open Raise',
    raise: ['22+', 'ATs+', 'A5s', 'A4s', 'A3s', 'A2s', 'KTs+', 'QTs+', 'JTs', 'T9s', '98s', '87s', '76s', 'AQo+', 'KQo'],
  },
  // Um jogador a menos atrás que o UTG: os ases do meio (A9s-A6s) já entram, e
  // as broadway offsuit descem um degrau.
  {
    position: 'MP', scenario: 'RFI', label: 'MP · Open Raise',
    raise: ['22+', 'A2s+', 'K9s+', 'Q9s+', 'J9s+', 'T8s+', '98s', '87s', '76s', '65s', 'ATo+', 'KJo+', 'QJo'],
  },
  // Só três jogadores atrás: entram os reis médios, os conectores baixos e as
  // broadway offsuit até JTo.
  {
    position: 'CO', scenario: 'RFI', label: 'CO · Open Raise',
    raise: ['22+', 'A2s+', 'K7s+', 'Q8s+', 'J8s+', 'T8s+', '97s+', '86s+', '76s', '65s', '54s', 'A9o+', 'KTo+', 'QTo+', 'JTo'],
  },
  // Última cadeira antes dos blinds e sempre em posição depois do flop: abre
  // quase metade das mãos, atacando os blinds.
  {
    position: 'BTN', scenario: 'RFI', label: 'BTN · Open Raise',
    raise: ['22+', 'A2s+', 'K2s+', 'Q5s+', 'J7s+', 'T6s+', '96s+', '85s+', '74s+', '63s+', '53s+', '43s', 'A2o+', 'K7o+', 'Q9o+', 'J9o+', 'T8o+', '98o'],
  },
  // Só o BB atrás, mas a SB joga o pote inteiro fora de posição — daí abrir
  // (sem limpar) um pouco mais apertado que o BTN.
  {
    position: 'SB', scenario: 'RFI', label: 'SB · Open Raise',
    raise: ['22+', 'A2s+', 'K2s+', 'Q4s+', 'J6s+', 'T6s+', '95s+', '85s+', '74s+', '64s+', '53s+', 'A2o+', 'K7o+', 'Q9o+', 'J9o+', 'T9o'],
  },
];

/**
 * Defesa vs open (3-bet / call / fold) — derivados dos exercícios das seções
 * vs UTG / vs MP-CO / 3-Bet / BB.
 */
const VS_DEFS: RangeDef[] = [
  {
    position: 'BTN', scenario: 'VS_UTG', label: 'BTN vs open de UTG · 3-Bet / Call / Fold',
    raise: ['JJ+', 'AKs', 'AKo'],
    call: ['TT', '99', '88', 'AQs', 'AJs', 'KQs'],
  },
  {
    position: 'BTN', scenario: 'VS_MP', label: 'BTN vs open de MP · 3-Bet / Call / Fold',
    raise: ['JJ+', 'AKs', 'AKo'],
    call: ['TT', '99', '88', 'AQs', 'AJs', 'KQs', 'JTs', 'AQo'],
  },
  {
    position: 'BTN', scenario: 'VS_CO', label: 'BTN vs open de CO · 3-Bet / Call / Fold',
    raise: ['JJ+', 'AQs+', 'AKo', 'A5s', 'A4s', 'A3s', 'A2s'],
    call: ['TT', '99', '88', '77', '66', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '98s', '87s', 'AQo'],
  },
  {
    position: 'BB', scenario: 'VS_BTN', label: 'BB vs open do BTN · Defesa',
    raise: ['QQ+', 'AQs+', 'AQo+'],
    call: [
      'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s',
      '98s', '87s', '76s', '65s', '54s',
      'AJo', 'ATo', 'A9o', 'A8o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
    ],
  },
  // SB vs CO — fora de posição: 3-bet-ou-fold com um call de pares médios
  // (set-mine). Sem posição, pagar largo é caro; blefa-se de 3-bet com os Ax
  // suited de baixo (blocker).
  {
    position: 'SB', scenario: 'VS_CO', label: 'SB vs open de CO · 3-Bet / Call / Fold',
    raise: ['TT+', 'AQs+', 'AKo', 'AJs', 'KQs', 'A5s', 'A4s', 'A3s', 'A2s'],
    call: ['99', '88', '77', '66', '55', '44', 'ATs', 'KJs', 'KTs', 'QJs', 'JTs', 'T9s'],
  },
  // SB vs BTN — BTN abre quase metade; SB responde 3-bet-ou-fold, com call de
  // pares e suited fortes.
  {
    position: 'SB', scenario: 'VS_BTN', label: 'SB vs open do BTN · 3-Bet / Call / Fold',
    raise: ['66+', 'ATs+', 'KTs+', 'QTs+', 'JTs', 'AJo+', 'KQo', 'A5s', 'A4s', 'A3s', 'A2s'],
    call: ['55', '44', '33', '22', 'A9s', 'A8s', 'A7s', 'A6s', 'K9s', 'Q9s', 'J9s', 'T9s', '98s', 'ATo', 'KJo'],
  },
  // BB fecha a ação com desconto — defende largo, e mais largo quanto mais tarde
  // (mais fraco) o open. 3-bet enxuto de valor + blefes de blocker; o resto é
  // call, aproveitando o preço.
  {
    position: 'BB', scenario: 'VS_UTG', label: 'BB vs open de UTG · Defesa',
    raise: ['QQ+', 'AKs', 'AKo', 'AQs', 'A5s', 'A4s'],
    call: [
      'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s',
      '98s', '97s', '87s', '76s', '65s', '54s',
      'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
    ],
  },
  {
    position: 'BB', scenario: 'VS_MP', label: 'BB vs open de MP · Defesa',
    raise: ['QQ+', 'AKs', 'AKo', 'AQs', 'AJs', 'A5s', 'A4s'],
    call: [
      'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'QJs', 'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', 'T7s',
      '98s', '97s', '87s', '86s', '76s', '75s', '65s', '54s',
      'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'KQo', 'KJo', 'KTo', 'K9o', 'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o',
    ],
  },
  {
    position: 'BB', scenario: 'VS_CO', label: 'BB vs open de CO · Defesa',
    raise: ['JJ+', 'AQs+', 'AKo', 'KQs', 'A5s', 'A4s', 'A3s'],
    call: [
      'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A2s',
      'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s',
      '98s', '97s', '96s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s',
      'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A5o', 'A4o', 'A3o', 'A2o', 'KQo', 'KJo', 'KTo', 'K9o', 'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', '98o',
    ],
  },
  {
    position: 'BB', scenario: 'VS_SB', label: 'BB vs open da SB · Defesa',
    raise: ['TT+', 'AQs+', 'AKo', 'A5s', 'A4s', 'A3s', 'A2s', 'K9s', 'Q9s', 'J9s', 'T8s', '97s', '86s', '75s', '64s', '53s'],
    call: [
      '99', '88', '77', '66', '55', '44', '33', '22',
      'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
      'KQs', 'KJs', 'KTs', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
      'QJs', 'QTs', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'JTs', 'J8s', 'J7s', 'J6s', 'T9s', 'T7s', 'T6s',
      '98s', '96s', '95s', '87s', '85s', '84s', '76s', '74s', '65s', '63s', '54s', '43s',
      'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
      'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'QJo', 'QTo', 'Q9o', 'Q8o', 'JTo', 'J9o', 'J8o', 'T9o', 'T8o', '98o', '97o', '87o', '76o',
    ],
  },
];

/** Todos os charts. Um formato só — RFI é o caso sem `call`. */
export const RANGE_DEFS: RangeDef[] = [...RFI_DEFS, ...VS_DEFS];

// ─── Ligação exercício → chart ────────────────────────────────

/** O mínimo de um exercício para achar seu chart (evita ciclo com o seed.ts). */
type ExerciseLike = {
  heroPosition: string;
  villainPosition?: string;
  callerPosition?: string;
  villainAction?: string;
  board?: string;
  category: string;
};

/**
 * O chart que cobre este exercício, ou `null` se não existe um.
 *
 * Sem chart ficam: postflop (tem `board`), 4-bet (não há chart de vs-3bet) e
 * squeeze (`callerPosition` — o range muda com o caller no meio). Esses não
 * recebem frequência: inventar uma é o bug que este módulo existe para matar.
 */
export function rangeDefFor(ex: ExerciseLike): RangeDef | null {
  if (ex.board) return null;

  if (ex.category === 'OPEN_RAISE' && !ex.villainAction) {
    return RANGE_DEFS.find((d) => d.scenario === 'RFI' && d.position === ex.heroPosition) ?? null;
  }

  if (ex.villainAction === 'Raise 2.5x' && !ex.callerPosition && ex.villainPosition) {
    return RANGE_DEFS.find(
      (d) => d.scenario === `VS_${ex.villainPosition}` && d.position === ex.heroPosition,
    ) ?? null;
  }

  return null;
}

/** A estratégia deste exercício, ou `null` quando não há chart por trás. */
export function freqForExercise(ex: ExerciseLike & { heroHand: string }): Freq | null {
  const def = rangeDefFor(ex);
  return def ? freqForHand(def, labelOfHand(ex.heroHand)) : null;
}
