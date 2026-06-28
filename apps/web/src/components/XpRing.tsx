import { USER_LEVELS, resolveLevel } from '@pokerpath/shared';

/**
 * Anel de progresso de XP até o próximo nível (PRD 9.2).
 * Mostra o nível atual no centro e quanto falta para o próximo no anel.
 */
export function XpRing({ totalXp, size = 132 }: { totalXp: number; size?: number }) {
  const level = resolveLevel(totalXp);
  const idx = USER_LEVELS.findIndex((l) => l.level === level.level);
  const next = USER_LEVELS[idx + 1];
  const progress = next
    ? Math.max(0, Math.min(1, (totalXp - level.xpRequired) / (next.xpRequired - level.xpRequired)))
    : 1;

  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <defs>
          <linearGradient id="xpgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#27D17C" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#F5C451" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="url(#xpgrad)" strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Nível</span>
        <span className="font-display text-3xl font-bold text-ink">{level.level}</span>
        <span className="max-w-[80%] truncate text-[11px] font-semibold text-brand">
          {level.name}
        </span>
      </div>
    </div>
  );
}
