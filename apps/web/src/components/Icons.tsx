/** Ícones outline (estilo Lucide/SF Symbols), stroke = currentColor. */
type P = { size?: number; className?: string };
const base = (size: number, className?: string) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, className,
});

export const IconHome = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
export const IconTarget = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>
);
export const IconGrid = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);
export const IconChart = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>
);
export const IconUser = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);
export const IconSun = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></svg>
);
export const IconMoon = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" /></svg>
);
export const IconFlame = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M12 3c1 3-2 4-2 7a2 2 0 1 0 4 0c0-1 1-2 1-2 1 2 2 3 2 6a5 5 0 0 1-10 0c0-4 3-5 5-11Z" /></svg>
);
export const IconBolt = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>
);
export const IconCheck = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const IconEye = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M3 3l18 18" /><path d="M10.6 5.8A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.3 17.3 0 0 1-3.1 3.9M6.6 6.6A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.3-1.1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
);
export const IconStar = ({ size = 24, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 16.9 6.3 20l1.2-6.3L2.8 9.3l6.4-.8L12 2.6Z" />
  </svg>
);
export const IconX = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const IconChevron = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconLock = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const IconBook = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20" /></svg>
);
export const IconCamera = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2a1 1 0 0 0 .8-.4l1-1.3a1 1 0 0 1 .8-.4h5.4a1 1 0 0 1 .8.4l1 1.3a1 1 0 0 0 .8.4h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" /><circle cx="12" cy="12.5" r="3.4" /></svg>
);
export const IconSettings = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.9 19a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5 8.9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
);
export const IconLogout = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>
);
/** Porta com flechinha ENTRANDO (login) — espelho do logout. */
export const IconLogin = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M13 7l-5 5 5 5" /><path d="M8 12h13" /></svg>
);

// ─── Glifos que substituíram emojis (mesmo estilo outline) ──────
export const IconTrophy = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M7 4h10v5a5 5 0 0 1-10 0Z" /><path d="M7 5.5H4.5V7A3.5 3.5 0 0 0 8 10.5" /><path d="M17 5.5h2.5V7A3.5 3.5 0 0 1 16 10.5" /><path d="M12 14v2.5" /><path d="M9 20l.7-3.5h4.6L15 20Z" /></svg>
);
export const IconCrown = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M4 9l3.4 2.6L12 5.5l4.6 6.1L20 9l-1.4 9.5H5.4Z" /><path d="M5.4 18.5h13.2" /></svg>
);
export const IconUsers = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6" /><path d="M17.5 15.2c2.2.5 3.5 2.1 3.5 4.8" /></svg>
);
export const IconLadder = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M8 3v18M16 3v18" /><path d="M8 7h8M8 11h8M8 15h8M8 19h8" /></svg>
);
export const IconGrad = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M2 8.5l10-4 10 4-10 4Z" /><path d="M6 10.8V15c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.2" /><path d="M22 8.5V14" /></svg>
);
export const IconFlag = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M5.5 21V4" /><path d="M5.5 4.5h13l-2.5 4 2.5 4h-13" /></svg>
);
export const IconGift = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><rect x="4" y="9.5" width="16" height="10.5" rx="1.5" /><path d="M3 9.5h18v-2H3Z" /><path d="M12 7.5v12.5" /><path d="M12 7.5C10.5 4.8 7 5 7 6.8c0 1.4 2.6.7 5 .7M12 7.5c1.5-2.7 5-2.5 5-.7 0 1.4-2.6.7-5 .7" /></svg>
);
export const IconSparkles = ({ size = 24, className }: P) => (
  <svg {...base(size, className)} fill="currentColor" stroke="none"><path d="M11 3l1.7 4.8L17.5 9.5 12.7 11.2 11 16l-1.7-4.8L4.5 9.5l4.8-1.7Z" /><path d="M18 14l.9 2.4L21.3 17l-2.4.9L18 20.3l-.9-2.4L14.7 17l2.4-.9Z" /></svg>
);
export const IconRocket = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M12 3c3 1.3 5 4.4 5 8.3L15 14H9l-2-2.7C7 7.4 9 4.3 12 3Z" /><circle cx="12" cy="9.3" r="1.7" /><path d="M9 14l-2.6 1.8.5-3.4M15 14l2.6 1.8-.5-3.4" /><path d="M10.4 17c.4 1.9.9 2.6 1.6 3.6.7-1 1.2-1.7 1.6-3.6" /></svg>
);
export const IconMail = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6 8.5-6" /></svg>
);
export const IconFolder = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></svg>
);
export const IconCheckCircle = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="9" /><path d="M8 12l2.6 2.6L16 9" /></svg>
);
export const IconDice = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" /></svg>
);
export const IconSeedling = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M12 20v-7" /><path d="M12 15c-.3-3-2.5-4.6-5.5-4.6C6.2 13.4 8.6 15 12 15Z" /><path d="M12 13c.2-2.8 2.2-4.2 4.8-4.2C16.6 11.4 14.7 13 12 13Z" /></svg>
);
export const IconTrendUp = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
export const IconWrench = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M15 3.5a5 5 0 0 0-5.8 6.6l-5.6 5.6a2.1 2.1 0 0 0 3 3l5.6-5.6A5 5 0 0 0 19.5 8l-2.9 2.9-2.5-2.5L17 5.5A5 5 0 0 0 15 3.5Z" /></svg>
);

export const IconPalette = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M12 3.5c-4.7 0-8.5 3.6-8.5 8.2 0 4.3 3.6 7.3 7.5 7.3 1.4 0 1.9-1 1.3-2-.6-.9-.2-2 1.1-2H16a4.5 4.5 0 0 0 4.5-4.6C20.5 6.8 16.5 3.5 12 3.5Z" /><circle cx="8" cy="10.5" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="10.5" r="1" fill="currentColor" stroke="none" /></svg>
);
export const IconNoAds = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></svg>
);
export const IconPencil = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M16.5 4.5l3 3L8 19l-4 1 1-4Z" /><path d="M14.5 6.5l3 3" /></svg>
);
export const IconCard = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><rect x="6.5" y="3.5" width="11" height="17" rx="2.2" /><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" /></svg>
);
export const IconBulb = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M12 3a6 6 0 0 0-4 10.5c.8.7 1 1.2 1 2.5h6c0-1.3.2-1.8 1-2.5A6 6 0 0 0 12 3Z" /><path d="M9.5 19h5M10.5 21.5h3" /></svg>
);
export const IconRefresh = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8" /><path d="M20 3.5V8h-4.5" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16" /><path d="M4 20.5V16h4.5" /></svg>
);

/** Medalha de pódio — cor por colocação (ouro/prata/bronze). */
const MEDAL_COLORS = ['#C9A84C', '#B4C0CC', '#C6813E'];
export const IconMedal = ({ place, size = 24 }: { place: 1 | 2 | 3; size?: number }) => {
  const c = MEDAL_COLORS[place - 1];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8.5 3l2.3 6M15.5 3l-2.3 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15" r="6" fill="none" stroke={c} strokeWidth="1.8" />
      <text x="12" y="15" textAnchor="middle" dominantBaseline="central"
        fontSize="7" fontWeight="800" fill={c} fontFamily="system-ui, sans-serif">{place}</text>
    </svg>
  );
};
