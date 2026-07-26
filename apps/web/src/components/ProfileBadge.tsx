import type { AchievementView } from '@pokerpath/shared';
import { StreakBadge, tierForTarget } from './StreakBadge.js';
import { AchievementBadge } from './AchievementBadge.js';

/**
 * Um badge da vitrine, resolvido a partir do id (`ach:CODE` ou `streak:30`).
 * As duas famílias têm arte vetorial própria — conquista é um ESCUDO, streak é
 * a chama numa ficha —, então quem desenha é este componente e não a página.
 */
export function ProfileBadge({ id, achievements, size = 44, assumeOwned = false }: {
  id: string;
  achievements: AchievementView[];
  size?: number;
  /**
   * Perfis de amigos já chegam filtrados pelo servidor: a vitrine só contém
   * badges que o amigo possui. A lista local de achievements pertence ao
   * jogador que está olhando e, portanto, não pode esconder a arte do amigo.
   */
  assumeOwned?: boolean;
}) {
  if (id.startsWith('streak:')) {
    const tier = tierForTarget(Number(id.slice(7)));
    if (!tier) return null;
    return <StreakBadge tier={tier} size={size} />;
  }
  // achievements confirma a posse local; em perfil social, assumeOwned só é
  // usado após o servidor já ter validado a vitrine daquele amigo.
  const a = achievements.find((x) => x.code === id.slice(4));
  if (!a && !assumeOwned) return null;
  return <AchievementBadge code={a?.code ?? id.slice(4)} size={size} />;
}

/** Nome legível do badge (tooltip, seletor). */
export function badgeName(id: string, achievements: AchievementView[]): string {
  if (id.startsWith('streak:')) {
    const t = tierForTarget(Number(id.slice(7)));
    return t ? `${t.name} · ${t.days} dias` : id;
  }
  return achievements.find((x) => x.code === id.slice(4))?.name ?? id;
}
