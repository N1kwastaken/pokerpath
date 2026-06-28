import type { Prisma } from '@prisma/client';

/**
 * Lógica de streak (PRD 9.3).
 * Streak = nº de dias consecutivos com pelo menos 1 sessão completa.
 *
 * Comparamos por dia de calendário (não por janelas de 24h):
 *   • mesmo dia      → não altera (já contou hoje).
 *   • dia seguinte   → +1.
 *   • gap maior      → reinicia em 1.
 */

/** Trunca uma data para o início do dia (00:00, horário local do servidor). */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffInDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

export interface StreakUpdate {
  currentStreak: number;
  maxStreak: number;
  lastActiveAt: Date;
  /** True quando esta sessão contou um novo dia (incremento/reinício). */
  advanced: boolean;
}

/**
 * Calcula o novo estado do streak a partir do anterior e do momento atual.
 * Função pura — facilita testar e deixa a persistência por conta do chamador.
 */
export function computeStreak(
  prev: { currentStreak: number; maxStreak: number; lastActiveAt: Date | null },
  now: Date = new Date(),
): StreakUpdate {
  if (!prev.lastActiveAt) {
    return { currentStreak: 1, maxStreak: Math.max(1, prev.maxStreak), lastActiveAt: now, advanced: true };
  }

  const days = diffInDays(now, prev.lastActiveAt);

  if (days <= 0) {
    // Já jogou hoje — mantém.
    return {
      currentStreak: prev.currentStreak,
      maxStreak: prev.maxStreak,
      lastActiveAt: prev.lastActiveAt,
      advanced: false,
    };
  }

  const current = days === 1 ? prev.currentStreak + 1 : 1;
  return {
    currentStreak: current,
    maxStreak: Math.max(prev.maxStreak, current),
    lastActiveAt: now,
    advanced: true,
  };
}

export type StreakWhere = Prisma.StreakWhereUniqueInput;
