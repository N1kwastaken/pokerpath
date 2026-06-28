/** Chama de streak (PRD 9.3). Pulsa quando o streak está ativo (> 0). */
export function Flame({ streak }: { streak: number }) {
  const active = streak > 0;
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-gradient-to-b from-gold/15 to-transparent px-3 py-1.5">
      <span className={`text-lg ${active ? 'animate-flame' : 'opacity-40 grayscale'}`}>🔥</span>
      <span className="font-display text-lg font-bold text-ink">{streak}</span>
    </div>
  );
}
