import { z } from 'zod';
import {
  ACTIONS,
  type Action,
  type Category,
  type Difficulty,
  type Position,
  type ProgressStatus,
} from './domain.js';
import type { Frequencies } from './gto.js';

/**
 * Tipos e schemas do conteúdo e do loop de jogo (PRD 5, 6, 7, 15.3).
 * Compartilhados entre API e frontend para garantir contratos idênticos.
 *
 * Princípio de segurança (PRD 15.5): a resposta correta NUNCA é enviada ao
 * cliente junto do exercício. Por isso PublicExercise não tem correctAction
 * nem explanation — eles só voltam na resposta do POST /answers.
 */

// ─── Onboarding (PRD 4.1) ──────────────────────────────────────
export const EXPERIENCE_LEVELS = [
  'beginner',
  'recreational',
  'intermediate',
  'advanced',
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const PLAY_FREQUENCIES = [
  'never',
  'sometimes',
  'weekly',
  'daily',
] as const;
export type PlayFrequency = (typeof PLAY_FREQUENCIES)[number];

export const GOALS = ['learn', 'improve', 'review'] as const;
export type Goal = (typeof GOALS)[number];

export const onboardingSchema = z.object({
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  playFrequency: z.enum(PLAY_FREQUENCIES),
  goal: z.enum(GOALS),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ─── Mundos (PRD 5) ────────────────────────────────────────────

/** Item do mapa de mundos, já resolvido com o progresso do usuário. */
export interface WorldSummary {
  id: string;
  order: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalStages: number;
  completedStages: number;
  /** Bloqueado porque o mundo anterior não está 100% concluído. */
  locked: boolean;
  /** Bloqueado por ser conteúdo premium (Mundos 4+ no plano FREE) — PRD 13.2. */
  premiumLocked: boolean;
  /** XP somado das fases já completadas neste mundo. */
  xpEarned: number;
}

// ─── Fases (PRD 6) ─────────────────────────────────────────────

/** Fase resolvida com o progresso do usuário (detalhe do mundo). */
export interface StageSummary {
  id: string;
  order: number;
  title: string;
  concept: string;
  description: string;
  minExercises: number;
  maxExercises: number;
  passRate: number;
  xpReward: number;
  status: ProgressStatus;
  /** Aula (sem exercícios) em vez de prática. */
  isLesson: boolean;
  exercisesDone: number;
  correctAnswers: number;
  accuracy: number;
  xpEarned: number;
}

export interface WorldDetail {
  id: string;
  order: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  locked: boolean;
  premiumLocked: boolean;
  stages: StageSummary[];
}

// ─── Exercícios (PRD 7) ────────────────────────────────────────

/**
 * Exercício no formato seguro para o cliente — sem a resposta correta.
 * As opções são sempre as 3 ações (PRD 7.1).
 */
export interface PublicExercise {
  id: string;
  order: number;
  heroPosition: Position;
  villainPosition: Position | null;
  /** 2º oponente que pagou o open (spots de squeeze). */
  callerPosition: Position | null;
  stackBb: number;
  potSize: number;
  heroHand: string;
  board: string | null;
  villainAction: string | null;
  difficulty: Difficulty;
  category: Category;
  options: readonly Action[];
}

/** Resposta de GET /stages/:id — a fase e seus exercícios (sem gabarito). */
export interface StagePlay {
  stage: StageSummary;
  worldId: string;
  worldName: string;
  exercises: PublicExercise[];
}

// ─── Resposta a um exercício (PRD 15.3) ────────────────────────

export const answerSchema = z.object({
  exerciseId: z.string().min(1, 'exerciseId é obrigatório'),
  selectedAction: z.enum(ACTIONS),
});
export type AnswerInput = z.infer<typeof answerSchema>;

export interface UnlockedAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
}

/** Estado de progresso da fase após registrar uma resposta. */
export interface StageProgressState {
  stageId: string;
  status: ProgressStatus;
  exercisesDone: number;
  correctAnswers: number;
  accuracy: number;
  xpEarned: number;
  minExercises: number;
  passRate: number;
}

/**
 * Resultado retornado pelo POST /answers.
 * Validação server-side: o cliente envia só a ação escolhida e descobre aqui
 * se acertou, qual era a correta e a explicação (se errou).
 */
export interface AnswerResult {
  correct: boolean;
  correctAction: Action;
  /** Explicação curta exibida apenas quando o usuário erra (PRD 2.3, 7.4). */
  explanation: string | null;
  xpGained: number;
  totalXp: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
  currentStreak: number;
  newAchievements: UnlockedAchievement[];
  stage: StageProgressState;
  /** Verdadeiro quando esta resposta concluiu a fase (atingiu o pass_rate). */
  stageCompleted: boolean;
  /** Verdadeiro quando esta resposta concluiu o mundo inteiro. */
  worldCompleted: boolean;
  /** Frequências GTO da decisão (reveladas só após responder). */
  frequencies: Frequencies;
}

/** Resultado ao concluir uma AULA (fase sem exercícios). */
export interface LessonResult {
  xpGained: number;
  totalXp: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
  currentStreak: number;
  newAchievements: UnlockedAchievement[];
}

/** Erro de limite diário no plano FREE (PRD 13.2). */
export const DAILY_LIMIT_CODE = 'DAILY_LIMIT_REACHED';

/** Item de revisão: uma mão que o usuário ERROU (com gabarito, para estudo). */
export interface ReviewItem {
  id: string;
  heroPosition: Position;
  villainPosition: Position | null;
  callerPosition: Position | null;
  stackBb: number;
  potSize: number;
  heroHand: string;
  board: string | null;
  villainAction: string | null;
  correctAction: Action;
  yourAction: Action;
  explanation: string;
  frequencies: Frequencies;
  category: Category;
}

/** Energia diária: quantos exercícios ainda dá para fazer hoje (Premium = infinito). */
export interface EnergyState {
  max: number;
  used: number;
  remaining: number;
  infinite: boolean;
}
