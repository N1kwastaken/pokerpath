import type { User, Streak } from '@prisma/client';
import { resolveLevel, type PublicUser, type Plan } from '@pokerpath/shared';
import { viewStreak } from './streak.service.js';

/**
 * Converte um User do banco no formato público (sem hash de senha).
 * Centraliza a derivação de nível e streak para não repetir em cada rota.
 */
export function toPublicUser(
  user: User,
  streak?: Streak | null,
): PublicUser {
  const level = resolveLevel(user.totalXp);
  // O streak gravado só muda quando se joga — aqui ele é lido já descontando
  // os dias parados, senão quem sumiu por uma semana veria o streak antigo.
  const sv = viewStreak(streak);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan as Plan,
    isDev: user.isDev,
    totalXp: user.totalXp,
    level: level.level,
    levelName: level.name,
    currentStreak: sv.current,
    streakAtRisk: sv.atRisk,
    streakPlayedToday: sv.playedToday,
    // current nunca passa do máximo gravado, mas o max(...) blinda contra
    // qualquer corrida de escrita — recompensa de streak não pode regredir.
    maxStreak: Math.max(sv.current, streak?.maxStreak ?? 0),
    emailReminders: user.emailReminders,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt.toISOString(),
  };
}
