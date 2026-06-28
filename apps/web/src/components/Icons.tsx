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
export const IconLogout = ({ size = 24, className }: P) => (
  <svg {...base(size, className)}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>
);
