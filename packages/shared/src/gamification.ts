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

export interface MissionView {
  code: string;
  title: string;
  description: string;
  type: MissionType;
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
