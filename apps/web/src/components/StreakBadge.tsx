/**
 * Emblema de streak — a arte das recompensas de sequência.
 *
 * Uma chama dentro de uma FICHA DE POKER (a mesma linguagem das fichas da
 * trilha), subindo de prestígio a cada degrau: faísca → chama → fogueira →
 * incêndio (anel prata) → inferno (anel ouro + raios) → chama fria (o fogo
 * mais quente queima azul). Tudo vetor paramétrico: uma chama só, recolorida
 * e ornamentada por camada — quando o sócio-artista chegar, este arquivo é o
 * spec do que redesenhar.
 */
export interface StreakTier {
  days: number;
  name: string;
  flame: string;   // corpo da chama
  inner: string;   // língua interna
  ring: string;    // anel da ficha
  stripes: boolean; // listras de ficha de poker no anel
  rays: boolean;    // raios externos (só nos tiers altos)
  core: boolean;    // núcleo branco incandescente
  glow?: string;    // brilho externo (CSS drop-shadow)
}

export const STREAK_TIERS: StreakTier[] = [
  { days: 3,   name: 'Faísca',     flame: '#F59E0B', inner: '#FDE68A', ring: '#6B7A72', stripes: false, rays: false, core: false },
  { days: 7,   name: 'Chama',      flame: '#F97316', inner: '#FCD34D', ring: '#B45309', stripes: true,  rays: false, core: false },
  { days: 14,  name: 'Fogueira',   flame: '#EF4444', inner: '#FBBF24', ring: '#C2410C', stripes: true,  rays: false, core: false },
  { days: 30,  name: 'Incêndio',   flame: '#DC2626', inner: '#F59E0B', ring: '#CBD5E1', stripes: true,  rays: false, core: true,  glow: 'rgba(220,38,38,0.55)' },
  { days: 60,  name: 'Inferno',    flame: '#E2543E', inner: '#FDE68A', ring: '#C9A84C', stripes: true,  rays: true,  core: true,  glow: 'rgba(201,168,76,0.6)' },
  { days: 100, name: 'Chama fria', flame: '#22D3EE', inner: '#A5F3FC', ring: '#7DD3FC', stripes: true,  rays: true,  core: true,  glow: 'rgba(34,211,238,0.65)' },
];

/** Maior tier alcançado com `days` dias (null = ainda nenhum). */
export function tierForDays(days: number): StreakTier | null {
  let best: StreakTier | null = null;
  for (const t of STREAK_TIERS) if (days >= t.days) best = t;
  return best;
}

export function tierForTarget(target: number): StreakTier | null {
  return STREAK_TIERS.find((t) => t.days === target) ?? null;
}

// Raios: 8 tracinhos ao redor do anel (posições pré-computadas, r 31→34.5).
const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 + Math.PI / 8;
  return {
    x1: 36 + Math.cos(a) * 31, y1: 36 + Math.sin(a) * 31,
    x2: 36 + Math.cos(a) * 34.5, y2: 36 + Math.sin(a) * 34.5,
  };
});

export function StreakBadge({ tier, size = 48, dim = false }: {
  tier: StreakTier;
  size?: number;
  /** Apagado: degrau ainda não alcançado (cinza, sem brilho). */
  dim?: boolean;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 72 72" aria-label={`${tier.name} — ${tier.days} dias`}
      style={dim
        ? { filter: 'grayscale(1) opacity(0.4)' }
        : tier.glow ? { filter: `drop-shadow(0 0 6px ${tier.glow})` } : undefined}
    >
      {/* ficha */}
      <circle cx="36" cy="36" r="29" fill="rgb(0 0 0 / 0.35)" stroke={tier.ring} strokeWidth="4.5" />
      {tier.stripes && (
        <circle cx="36" cy="36" r="29" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="4.5" strokeDasharray="9 21.4" />
      )}
      <circle cx="36" cy="36" r="23" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {tier.rays && RAYS.map((r, i) => (
        <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={tier.ring} strokeWidth="2.5" strokeLinecap="round" />
      ))}
      {/* chama: corpo com lambida à esquerda + língua interna + núcleo */}
      <path
        d="M36 14c6 8 14 15 14 26a14 14 0 0 1-28 0c0-6 3-11 6-15 1 3 3 5 5 5-1-6 1-11 3-16z"
        fill={tier.flame}
      />
      <path d="M36 34c3 4 7 7 7 13a7 7 0 0 1-14 0c0-6 4-9 7-13z" fill={tier.inner} />
      {tier.core && <circle cx="36" cy="47" r="3.2" fill="#fff" opacity="0.95" />}
    </svg>
  );
}
