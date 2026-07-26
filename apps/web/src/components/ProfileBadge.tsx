import type { ReactNode } from 'react';
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

/**
 * Rótulo visível acionado por toque. O badge continua sendo o controle; o
 * balão fica ancorado nele para não deslocar os outros itens da vitrine.
 */
export function BadgeBubble({ label, open, children }: {
  label: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex isolate">
      {open && (
        <span
          role="status"
          className="pointer-events-none absolute bottom-[calc(100%+0.55rem)] left-1/2 z-30 w-max max-w-48 -translate-x-1/2 rounded-lg bg-title px-2.5 py-1.5 text-center text-xs font-bold leading-tight text-bg shadow-lg"
        >
          {label}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-title"
          />
        </span>
      )}
      {children}
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
