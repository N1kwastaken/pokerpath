/**
 * Brasões das conquistas — a arte que substitui os emojis.
 *
 * Taxonomia visual do app: STREAK = chama numa ficha de poker (StreakBadge);
 * CONQUISTA = glifo num ESCUDO. Formas diferentes para famílias diferentes —
 * numa vitrine de 16px é a silhueta que diz de onde o badge veio.
 *
 * Cada conquista tem cor e glifo próprios, desenhados à mão sobre o feito
 * que ela marca (foguete para a sequência, bússola para os mundos, coroa
 * para fechar o jogo). O DEV entra aqui como brasão especial `</>` prata.
 * Como no StreakBadge, este arquivo é o spec do que o artista redesenhar.
 */
interface Art {
  color: string;   // traço do escudo e do glifo
  soft: string;    // preenchimento suave interno
  glyph: React.ReactNode;
  glow?: string;   // só no topo de prestígio
}

const S = { fill: 'none', strokeWidth: 3.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const ACHIEVEMENT_ART: Record<string, Art> = {
  // Primeira Mão — a carta de baralho que começou tudo
  FIRST_HAND: {
    color: '#35C97D', soft: 'rgba(53,201,125,0.14)',
    glyph: (
      <g stroke="#35C97D" {...S}>
        <rect x="26.5" y="24" width="19" height="27" rx="3.5" transform="rotate(7 36 38)" />
        <path d="M36 31.5l3.6 5.7-3.6 5.7-3.6-5.7z" fill="#35C97D" stroke="none" />
      </g>
    ),
  },
  // Em Chamas — 5 seguidas: o foguete subindo
  HOT_STREAK: {
    color: '#F97316', soft: 'rgba(249,115,22,0.14)',
    glyph: (
      <g stroke="#F97316" {...S}>
        <path d="M36 20c5 5 6.5 12 4.2 19h-8.4C29.5 32 31 25 36 20z" />
        <circle cx="36" cy="30" r="2.8" />
        <path d="M31.5 39.5l-4.5 6 6-2M40.5 39.5l4.5 6-6-2" />
        <path d="M34 48c1 3 3 3 4 0" />
      </g>
    ),
  },
  // Semana Perfeita — 7 dias: calendário com o check
  PERFECT_WEEK: {
    color: '#EF4444', soft: 'rgba(239,68,68,0.13)',
    glyph: (
      <g stroke="#EF4444" {...S}>
        <rect x="25" y="26" width="22" height="22" rx="3.5" />
        <path d="M25 32.5h22M31 22.5v5M41 22.5v5" />
        <path d="M30.5 40l3.7 3.7 7.3-8" />
      </g>
    ),
  },
  // Sharp Shooter — 50 sem errar: a mira
  SHARP_SHOOTER: {
    color: '#3B82F6', soft: 'rgba(59,130,246,0.14)',
    glyph: (
      <g stroke="#3B82F6" {...S}>
        <circle cx="36" cy="38" r="10" />
        <path d="M36 24.5v6M36 45.5v6M22.5 38h6M43.5 38h6" />
        <circle cx="36" cy="38" r="2.6" fill="#3B82F6" stroke="none" />
      </g>
    ),
  },
  // Explorador — chegou a todos os mundos: a bússola
  EXPLORER: {
    color: '#22D3EE', soft: 'rgba(34,211,238,0.13)',
    glyph: (
      <g stroke="#22D3EE" {...S}>
        <circle cx="36" cy="38" r="11" />
        <path d="M36 29.5l4.2 8.5-4.2 8.5-4.2-8.5z" fill="#22D3EE" stroke="none" opacity="0.9" />
        <circle cx="36" cy="38" r="1.6" fill="#0A0D0B" stroke="none" />
      </g>
    ),
  },
  // Nível Iniciante Perfeito — a espada da casa
  BTN_MASTER: {
    color: '#E74C91', soft: 'rgba(231,76,145,0.13)',
    glyph: (
      <path
        d="M36 24c5 6.5 10.5 9.5 10.5 14.5a6 6 0 0 1-9.3 5c.9 2.8 1.9 4.1 3 5.5h-8.4c1.1-1.4 2.1-2.7 3-5.5a6 6 0 0 1-9.3-5C25.5 33.5 31 30.5 36 24z"
        fill="#E74C91" stroke="none"
      />
    ),
  },
  // 3Bet Machine — a pilha de fichas crescendo
  THREEBET_MACHINE: {
    color: '#7C5CFF', soft: 'rgba(124,92,255,0.14)',
    glyph: (
      <g stroke="#7C5CFF" {...S}>
        <ellipse cx="36" cy="46" rx="11" ry="4" />
        <ellipse cx="36" cy="39.5" rx="11" ry="4" />
        <ellipse cx="36" cy="33" rx="11" ry="4" />
        <path d="M36 21.5l4 5h-8z" fill="#7C5CFF" stroke="none" />
      </g>
    ),
  },
  // Full Game — fechou tudo: a coroa (o único com brilho)
  FULL_GAME: {
    color: '#C9A84C', soft: 'rgba(201,168,76,0.16)', glow: 'rgba(201,168,76,0.55)',
    glyph: (
      <g>
        <path d="M25 45.5l-2.5-14 8 5.5 5.5-9.5 5.5 9.5 8-5.5-2.5 14z" fill="#C9A84C" stroke="none" />
        <rect x="25" y="47.5" width="22" height="3.4" rx="1.7" fill="#C9A84C" />
        <circle cx="30" cy="41.5" r="1.4" fill="#0A0D0B" />
        <circle cx="36" cy="40" r="1.4" fill="#0A0D0B" />
        <circle cx="42" cy="41.5" r="1.4" fill="#0A0D0B" />
      </g>
    ),
  },
  // DEV — beta tester: o brasão de quem constrói junto
  DEV: {
    color: '#94A3B8', soft: 'rgba(148,163,184,0.14)',
    glyph: (
      <g stroke="#94A3B8" {...S}>
        <path d="M28 31.5L21.5 38l6.5 6.5M44 31.5L50.5 38 44 44.5M39.5 27.5l-7 21" />
      </g>
    ),
  },
};

/** Escudo neutro para código desconhecido — melhor que sumir. */
const FALLBACK: Art = {
  color: '#8A9A90', soft: 'rgba(138,154,144,0.12)',
  glyph: <path d="M36 26c4 5 8 7.5 8 11.5a4.8 4.8 0 0 1-7.4 4c.7 2.2 1.5 3.3 2.4 4.4h-6c.9-1.1 1.7-2.2 2.4-4.4a4.8 4.8 0 0 1-7.4-4C28 33.5 32 31 36 26z" fill="#8A9A90" stroke="none" />,
};

export function AchievementBadge({ code, size = 44, dim = false }: {
  code: string;
  size?: number;
  dim?: boolean;
}) {
  const art = ACHIEVEMENT_ART[code] ?? FALLBACK;
  return (
    <svg
      width={size} height={size} viewBox="0 0 72 72" aria-hidden
      style={dim
        ? { filter: 'grayscale(1) opacity(0.38)' }
        : art.glow ? { filter: `drop-shadow(0 0 6px ${art.glow})` } : undefined}
    >
      {/* escudo: fundo escuro + contorno na cor do feito + linha interna */}
      <path
        d="M36 6.5L59.5 14.5V35.5C59.5 50.5 49.5 60 36 65.5C22.5 60 12.5 50.5 12.5 35.5V14.5Z"
        fill="rgb(0 0 0 / 0.35)" stroke={art.color} strokeWidth="4"
      />
      <path
        d="M36 12L54 18.5V35.5C54 47.5 46.5 55 36 59.5C25.5 55 18 47.5 18 35.5V18.5Z"
        fill={art.soft} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5"
      />
      {art.glyph}
    </svg>
  );
}
