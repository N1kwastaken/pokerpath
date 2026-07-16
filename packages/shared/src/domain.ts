/**
 * Domínio de poker — constantes e enums.
 * Reflete o PRD (seções 7 e 16). Estes valores são a fonte única de verdade
 * compartilhada entre frontend e backend. NUNCA divergir entre camadas.
 */

/** Posições na mesa 6-max, em ordem de ação pré-flop. */
export const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'] as const;
export type Position = (typeof POSITIONS)[number];

/** Ações possíveis em um exercício. Sempre 3 opções (PRD seção 7.1). */
export const ACTIONS = ['FOLD', 'CALL', 'RAISE'] as const;
export type Action = (typeof ACTIONS)[number];

/** Níveis de dificuldade (PRD seção 7.5). */
export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Categorias de exercício (PRD seção 7.1). */
export const CATEGORIES = [
  'OPEN_RAISE',
  'DEFEND',
  'FACING_RAISE',
  'THREE_BET',
  'FOUR_BET',
  'C_BET',
  'TURN',
  'RIVER',
  'ICM',
  'EXPLOIT',
] as const;
export type Category = (typeof CATEGORIES)[number];

/** XP por dificuldade de exercício (PRD seção 9.1). */
export const XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 5,
  MEDIUM: 10,
  HARD: 15,
};

/** XP fixo ao completar um Mundo (PRD seção 9.1). */
export const XP_PER_WORLD_COMPLETE = 500;

/** Bônus de streak de 7 dias (PRD seção 9.1). */
export const XP_STREAK_7_DAYS = 100;

/** Multiplicador de XP em revisão de fase antiga (PRD seção 6.5 / 9.1). */
export const REVIEW_XP_MULTIPLIER = 0.5;

/**
 * Tabela de níveis do usuário (PRD seção 9.2).
 * O nível é determinado pelo XP total acumulado.
 */
export interface UserLevel {
  level: number;
  name: string;
  xpRequired: number;
}

export const USER_LEVELS: readonly UserLevel[] = [
  { level: 1, name: 'Fish', xpRequired: 0 },
  { level: 2, name: 'Recreativo', xpRequired: 500 },
  { level: 3, name: 'Reg', xpRequired: 2_000 },
  { level: 4, name: 'Micro Stakes', xpRequired: 5_000 },
  { level: 5, name: 'Small Stakes', xpRequired: 12_000 },
  { level: 6, name: 'Mid Stakes', xpRequired: 25_000 },
  { level: 7, name: 'High Roller', xpRequired: 50_000 },
  { level: 8, name: 'Poker Master', xpRequired: 100_000 },
] as const;

/** Resolve o nível do usuário a partir do XP total. */
export function resolveLevel(totalXp: number): UserLevel {
  let current = USER_LEVELS[0];
  for (const lvl of USER_LEVELS) {
    if (totalXp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
}

/** Progresso dentro do nível atual — quanto falta para o próximo. */
export interface LevelProgress {
  current: UserLevel;
  /** null no último nível (não há para onde subir). */
  next: UserLevel | null;
  /** 0–100 dentro da faixa do nível atual (100 quando não há próximo). */
  pct: number;
  /** XP que ainda falta para o próximo nível (0 quando não há próximo). */
  xpToNext: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const current = resolveLevel(totalXp);
  const next = USER_LEVELS[current.level] ?? null; // level é 1-based
  if (!next) return { current, next: null, pct: 100, xpToNext: 0 };
  const span = next.xpRequired - current.xpRequired;
  const done = totalXp - current.xpRequired;
  return {
    current,
    next,
    pct: Math.max(0, Math.min(100, Math.round((done / span) * 100))),
    xpToNext: Math.max(0, next.xpRequired - totalXp),
  };
}

/** Status de progresso de uma fase para um usuário (PRD seção 10.3). */
export const PROGRESS_STATUS = ['LOCKED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUS)[number];

/** Planos de usuário (PRD seção 13). */
export const PLANS = ['FREE', 'PREMIUM'] as const;
export type Plan = (typeof PLANS)[number];

/** Limite diário de exercícios no plano gratuito (PRD seção 13.2). */
export const FREE_DAILY_EXERCISE_LIMIT = 20;
