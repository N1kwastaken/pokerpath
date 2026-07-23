import type { AchievementView } from '@pokerpath/shared';
import { StreakBadge, tierForTarget } from './StreakBadge.js';
import { AchievementBadge } from './AchievementBadge.js';

/**
 * Um badge da vitrine, resolvido a partir do id (`ach:CODE` ou `streak:30`).
 * As duas famílias têm arte vetorial própria — conquista é um ESCUDO, streak é
 * a chama numa ficha —, então quem desenha é este componente e não a página.
 */
export function ProfileBadge({ id, achievements, size = 44 }: {
  id: string;
  achievements: AchievementView[];
  size?: number;
}) {
  if (id.startsWith('streak:')) {
    const tier = tierForTarget(Number(id.slice(7)));
    if (!tier) return null;
    return <StreakBadge tier={tier} size={size} />;
  }
  // achievements só serve para confirmar a POSSE — a arte vem do código, não
  // mais do emoji do seed.
  const a = achievements.find((x) => x.code === id.slice(4));
  if (!a) return null;
  return <AchievementBadge code={a.code} size={size} />;
}

/** Nome legível do badge (tooltip, seletor). */
export function badgeName(id: string, achievements: AchievementView[]): string {
  if (id.startsWith('streak:')) {
    const t = tierForTarget(Number(id.slice(7)));
    return t ? `${t.name} · ${t.days} dias` : id;
  }
  return achievements.find((x) => x.code === id.slice(4))?.name ?? id;
}
