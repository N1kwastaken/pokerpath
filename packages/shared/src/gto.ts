import type { Action, Category, Position } from './domain.js';

/**
 * Tipos de dados GTO (frequências e ranges) e estatísticas.
 * As frequências são reveladas apenas APÓS o usuário responder (junto do
 * AnswerResult), nunca no exercício — mesma regra do gabarito (PRD 15.5).
 */

/** Frequência (%) de cada ação numa decisão. Soma ~100. */
export interface Frequencies {
  FOLD: number;
  CALL: number;
  RAISE: number;
  ALLIN?: number;
}

// ─── Ranges (grid 13x13) ───────────────────────────────────────
export const GAME_TYPES = ['CASH', 'TOURNAMENT'] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const TABLE_SIZES = ['SIX_MAX', 'NINE_MAX'] as const;
export type TableSize = (typeof TABLE_SIZES)[number];

export const STACK_OPTIONS = [20, 40, 60, 100, 200] as const;
export type StackOption = (typeof STACK_OPTIONS)[number];

/** Classificação de uma célula do grid. */
export const CELL_ACTIONS = ['RAISE', 'CALL', 'FOLD', 'MIXED'] as const;
export type CellAction = (typeof CELL_ACTIONS)[number];

export interface RangeCell {
  /** Rótulo da mão, ex.: "AKs", "QQ", "T9o". */
  hand: string;
  action: CellAction;
  /** Mão de fronteira (estratégia mista): `action` em pct%, `alt` no restante. */
  mix?: { alt: CellAction; pct: number };
}

export interface RangeGrid {
  gameType: GameType;
  tableSize: TableSize;
  stackBb: number;
  position: Position;
  /** Cenário do chart: 'RFI' (abertura) ou 'VS_<posição>' (defesa vs open, com call). */
  scenario: string;
  label: string;
  /** 13x13 — linha 0 = A, coluna 0 = A. Diagonal = pares. */
  cells: RangeCell[][];
}

// ─── Estatísticas por categoria (PRD 9) ────────────────────────
export interface CategoryStat {
  category: Category;
  label: string;
  total: number;
  correct: number;
  accuracy: number; // 0..1
}

export interface StatsResult {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number; // 0..1
  byCategory: CategoryStat[];
}

/** Rótulos amigáveis das categorias para a UI. */
export const CATEGORY_LABELS: Record<Category, string> = {
  OPEN_RAISE: 'Open Raise',
  DEFEND: 'Blind Defense',
  FACING_RAISE: 'Facing Raise',
  THREE_BET: '3-Bet',
  FOUR_BET: '4-Bet',
  C_BET: 'C-Bet',
  TURN: 'Turn',
  RIVER: 'River',
  ICM: 'ICM',
  EXPLOIT: 'Exploit',
};

/** Ordem das 13 cartas no grid (alta -> baixa). */
export const GRID_RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

/** Rótulo da mão a partir de índices de linha/coluna do grid. */
export function gridHandLabel(row: number, col: number): string {
  const r = GRID_RANKS;
  if (row === col) return `${r[row]}${r[col]}`;
  if (row < col) return `${r[row]}${r[col]}s`; // suited (triângulo superior)
  return `${r[col]}${r[row]}o`; // offsuit (triângulo inferior)
}

export type { Action, Position };
