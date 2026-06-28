import type { User, Streak } from '@prisma/client';
import { resolveLevel, type PublicUser, type Plan } from '@pokerpath/shared';

/**
 * Converte um User do banco no formato público (sem hash de senha).
 * Centraliza a derivação de nível e streak para não repetir em cada rota.
 */
export function toPublicUser(
  user: User,
  streak?: Streak | null,
): PublicUser {
  const level = resolveLevel(user.totalXp);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan as Plan,
    totalXp: user.totalXp,
    level: level.level,
    levelName: level.name,
    currentStreak: streak?.currentStreak ?? 0,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt.toISOString(),
  };
}
