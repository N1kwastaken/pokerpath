import type { AchievementView } from '@pokerpath/shared';
import { StreakBadge, tierForTarget } from './StreakBadge.js';

/**
 * Um badge da vitrine, resolvido a partir do id (`ach:CODE` ou `streak:30`).
 * As duas famílias têm arte diferente — conquista é emoji num disco, streak é
 * o emblema vetorial —, então quem desenha é este componente e não a página.
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
  const a = achievements.find((x) => x.code === id.slice(4));
  if (!a) return null;
  return (
    <span
      title={a.name}
      className="flex items-center justify-center rounded-full border-2 border-gold/50 bg-gold/10"
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      {a.icon}
    </span>
  );
}

/** Nome legível do badge (tooltip, seletor). */
export function badgeName(id: string, achievements: AchievementView[]): string {
  if (id.startsWith('streak:')) {
    const t = tierForTarget(Number(id.slice(7)));
    return t ? `${t.name} · ${t.days} dias` : id;
  }
  return achievements.find((x) => x.code === id.slice(4))?.name ?? id;
}
