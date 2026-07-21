import type { UnlockedAchievement } from './content.js';

/**
 * Tipos de gamificação (PRD 9.4 / 9.5): conquistas e missões com o progresso
 * do usuário, prontos para a UI.
 */

export interface AchievementView {
  code: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export const MISSION_TYPES = ['DAILY', 'WEEKLY'] as const;
export type MissionType = (typeof MISSION_TYPES)[number];

/**
 * Dificuldade da missão. O dia sempre serve 2 fáceis + 2 médias + 1 difícil:
 * as fáceis garantem a vitória diária (o hábito), a difícil dá o que perseguir.
 */
export const MISSION_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export type MissionDifficulty = (typeof MISSION_DIFFICULTIES)[number];

export interface MissionView {
  code: string;
  title: string;
  description: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  xpReward: number;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

/** Resultado de resgatar a recompensa de uma missão. */
export interface MissionClaimResult {
  code: string;
  xpGained: number;
  totalXp: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
  /** Conquistas eventualmente desbloqueadas ao ganhar o XP. */
  newAchievements: UnlockedAchievement[];
}
