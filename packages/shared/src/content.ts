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
 * Feedback instantâneo: o gabarito (correctAction/explanation/frequencies)
 * VIAJA junto do exercício, então o cliente valida na hora (como nas aulas) e
 * mostra certo/errado + explicação sem esperar a rede. O POST /answers ainda
 * roda em segundo plano pra gravar XP/progresso (o servidor é a autoridade).
 * Trade-off aceito: o gabarito fica visível na rede — num trainer solo isso só
 * prejudica quem cola, sem ranking com aposta em jogo.
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
  /** Conteúdo exclusivo do plano Premium (postflop dos níveis 2+). */
  premium: boolean;
  /** Já fechou uma sessão inteira sem errar (estrela na trilha). */
  perfect: boolean;
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
  /** Gabarito embutido p/ validação local instantânea (ver nota no topo). */
  correctAction: Action;
  explanation: string | null;
  /** `null` quando não há chart por trás — ver AnswerResult.frequencies. */
  frequencies: Frequencies | null;
}

/** Resposta de GET /stages/:id — a fase e seus exercícios (com gabarito). */
export interface StagePlay {
  stage: StageSummary;
  worldId: string;
  worldName: string;
  /** Nível do mundo (0 = Primeiros Passos) — o cliente simplifica a mesa nele. */
  worldOrder: number;
  exercises: PublicExercise[];
}

// ─── Modo convidado (Mundo 0 sem conta) ────────────────────────
// Exceção CONTROLADA ao princípio acima: só o Mundo 0 (fundamentos) é jogável
// sem login, e nele o gabarito viaja junto — a validação é local no cliente,
// sem XP/progressão de servidor. Ao criar conta, o progresso "gradua".

export interface GuestExercise extends PublicExercise {
  correctAction: Action;
  explanation: string | null;
  /** `null` quando não há chart por trás — ver AnswerResult.frequencies. */
  frequencies: Frequencies | null;
}

export interface GuestWorld {
  id: string;
  order: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  stages: StageSummary[];
}

export interface GuestStagePlay {
  stage: StageSummary;
  worldId: string;
  worldName: string;
  worldOrder: number;
  exercises: GuestExercise[];
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
  /** Acertos seguidos até agora (persiste entre fases/sessões; 0 se errou). */
  answerStreak: number;
  newAchievements: UnlockedAchievement[];
  stage: StageProgressState;
  /** Verdadeiro quando esta resposta concluiu a fase (atingiu o pass_rate). */
  stageCompleted: boolean;
  /** Verdadeiro quando esta resposta concluiu o mundo inteiro. */
  worldCompleted: boolean;
  /**
   * Energia devolvida por ter limpado a fase sem errar nenhuma (0 = nada a
   * comemorar). Vale uma vez por fase: rejogar não devolve de novo.
   */
  energyRestored: number;
  /**
   * Frequências GTO da decisão (reveladas só após responder).
   *
   * `null` quando não existe chart por trás do spot (postflop, 4-bet, squeeze):
   * aí o app não mostra as barras. Inventar um número para preencher a tela é
   * exatamente o bug que derrubou a confiança nos gráficos — sem dado, a
   * explicação carrega o feedback sozinha.
   */
  frequencies: Frequencies | null;
}

/** Resultado de responder um erro no modo REVISÃO (treino, sem XP/progresso). */
export interface ReviewAnswerResult {
  correct: boolean;
  correctAction: Action;
  explanation: string | null;
  frequencies: Frequencies | null;
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
  /** `null` quando não há chart por trás — ver AnswerResult.frequencies. */
  frequencies: Frequencies | null;
  category: Category;
}

/** Energia diária: quantos exercícios ainda dá para fazer hoje (Premium = infinito). */
export interface EnergyState {
  max: number;
  used: number;
  remaining: number;
  infinite: boolean;
}
