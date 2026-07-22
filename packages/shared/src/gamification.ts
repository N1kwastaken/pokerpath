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

// ─── Marcos (milestones) ───────────────────────────────────────
/**
 * Trilha que o marco acompanha. Todas as métricas são DERIVADAS do que já
 * existe (progresso, respostas, streak) — marco não guarda contador próprio,
 * só a data em que foi resgatado.
 */
export const MILESTONE_TRACKS = ['STAGES', 'CORRECT', 'STREAK', 'PERFECT'] as const;
export type MilestoneTrack = (typeof MILESTONE_TRACKS)[number];

export const MILESTONE_TRACK_LABELS: Record<MilestoneTrack, string> = {
  STAGES: 'Fases concluídas',
  CORRECT: 'Mãos certas',
  STREAK: 'Dias seguidos',
  PERFECT: 'Fases impecáveis',
};

export interface MilestoneDef {
  code: string;
  title: string;
  /** O que o marco significa — aparece na tela de marcos. */
  description: string;
  icon: string;
  track: MilestoneTrack;
  target: number;
  xpReward: number;
  /** Energia extra no dia do resgate (0 = só XP). */
  energyReward: number;
}

/**
 * A escada. Diferente das conquistas (feitos avulsos), marco é DEGRAU: cada
 * trilha sobe em ordem e o usuário sempre vê qual é o próximo. É isso que dá
 * a sensação de progresso contínuo em vez de prêmio surpresa.
 */
export const MILESTONES: MilestoneDef[] = [
  { code: 'FIRST_WIN',    title: 'Primeira vitória',   description: 'Você concluiu sua primeira fase.',                  icon: '🎉', track: 'STAGES',  target: 1,    xpReward: 25,  energyReward: 0 },
  { code: 'STAGES_10',    title: '10 fases',           description: 'Dez fases concluídas — o hábito começou.',          icon: '🪜', track: 'STAGES',  target: 10,   xpReward: 100, energyReward: 5 },
  { code: 'STAGES_25',    title: '25 fases',           description: 'Um quarto de centena. Já não é sorte.',             icon: '🧗', track: 'STAGES',  target: 25,   xpReward: 200, energyReward: 10 },
  { code: 'STAGES_50',    title: '50 fases',           description: 'Metade do caminho até as cem.',                     icon: '🏔️', track: 'STAGES',  target: 50,   xpReward: 400, energyReward: 15 },
  { code: 'STAGES_100',   title: '100 fases',          description: 'Cem fases. Você conhece o jogo.',                   icon: '👑', track: 'STAGES',  target: 100,  xpReward: 800, energyReward: 25 },

  { code: 'CORRECT_100',  title: '100 mãos certas',    description: 'Cem decisões corretas na mesa.',                    icon: '🎯', track: 'CORRECT', target: 100,  xpReward: 100, energyReward: 5 },
  { code: 'CORRECT_500',  title: '500 mãos certas',    description: 'Quinhentas. Isso já é leitura de range.',           icon: '🧠', track: 'CORRECT', target: 500,  xpReward: 350, energyReward: 15 },
  { code: 'CORRECT_1000', title: '1000 mãos certas',   description: 'Mil mãos certas — território de jogador sério.',    icon: '💎', track: 'CORRECT', target: 1000, xpReward: 700, energyReward: 25 },

  { code: 'STREAK_3',     title: '3 dias seguidos',    description: 'Três dias sem falhar. A faísca pegou.',             icon: '🔥', track: 'STREAK',  target: 3,    xpReward: 60,   energyReward: 5 },
  { code: 'STREAK_7',     title: '7 dias seguidos',    description: 'Uma semana inteira de treino.',                     icon: '🔥', track: 'STREAK',  target: 7,    xpReward: 150,  energyReward: 10 },
  { code: 'STREAK_14',    title: '14 dias seguidos',   description: 'Duas semanas de fogo — metade do caminho até o mês.', icon: '🔥', track: 'STREAK', target: 14,  xpReward: 300,  energyReward: 15 },
  { code: 'STREAK_30',    title: '30 dias seguidos',   description: 'Um mês inteiro — e desbloqueia a cor Brasa.',       icon: '🔥', track: 'STREAK',  target: 30,   xpReward: 600,  energyReward: 25 },
  { code: 'STREAK_60',    title: '60 dias seguidos',   description: 'Dois meses seguidos. Pouquíssimos chegam aqui.',    icon: '🔥', track: 'STREAK',  target: 60,   xpReward: 900,  energyReward: 30 },
  { code: 'STREAK_100',   title: '100 dias seguidos',  description: 'Cem dias. O fogo mais quente queima azul — desbloqueia a Chama fria.', icon: '🔥', track: 'STREAK', target: 100, xpReward: 1500, energyReward: 40 },

  { code: 'PERFECT_10',   title: '10 fases impecáveis', description: 'Dez fases sem errar uma única mão.',               icon: '⭐', track: 'PERFECT', target: 10,   xpReward: 250, energyReward: 10 },
];

export interface MilestoneView extends MilestoneDef {
  progress: number;
  reached: boolean;
  claimed: boolean;
}

/** Resultado de resgatar um marco. */
export interface MilestoneClaimResult {
  code: string;
  xpGained: number;
  energyGained: number;
  totalXp: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
  newAchievements: UnlockedAchievement[];
}
