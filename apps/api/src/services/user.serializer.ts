import type { User, Streak } from '@prisma/client';
import { resolveLevel, USERNAME_COOLDOWN_DAYS, type PublicUser, type Plan } from '@pokerpath/shared';
import { viewStreak } from './streak.service.js';

/**
 * Quando o @ poderá ser trocado de novo. `null` = já pode (nunca trocou, ou os
 * 30 dias já passaram). Computar aqui, e não no cliente, mantém o relógio no
 * servidor — a UI só exibe o que este cálculo devolve.
 */
export function usernameNextChangeAt(changedAt: Date | null): string | null {
  if (!changedAt) return null;
  const next = changedAt.getTime() + USERNAME_COOLDOWN_DAYS * 86_400_000;
  return next <= Date.now() ? null : new Date(next).toISOString();
}

/**
 * Converte um User do banco no formato público (sem hash de senha).
 * Centraliza a derivação de nível e streak para não repetir em cada rota.
 */
/** JSON corrompido nunca derruba o perfil: vira vitrine vazia. */
export function parseShowcase(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 2) : [];
  } catch {
    return [];
  }
}

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
    username: user.username,
    usernameNextChangeAt: usernameNextChangeAt(user.usernameChangedAt),
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
    showcaseBadges: parseShowcase(user.showcaseBadges),
    avatar: user.avatar,
    emailReminders: user.emailReminders,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt.toISOString(),
  };
}
