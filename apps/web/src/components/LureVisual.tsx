import { Card } from './Card.js';

/**
 * "Vitrine": renderiza a própria UI do produto (chart GTO, barras, mesa,
 * progresso) como imagem de atração — sem mascote, foco no que o app faz.
 */
type Kind = 'cards' | 'table' | 'gto' | 'grid' | 'progress';


function GridLure() {
  return (
    <div className="w-full max-w-[200px]">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
        {Array.from({ length: 13 }).flatMap((_, r) =>
          Array.from({ length: 13 }).map((__, c) => {
            const pair = r === c, suited = r < c;
            const hi = Math.min(r, c), lo = Math.max(r, c);
            const score = pair ? 100 - r * 6 : suited ? (12 - hi) * 8 + (12 - lo) * 2 + 8 : (12 - hi) * 8 + (12 - lo) * 2;
            const cls = score >= 72 ? 'bg-primary' : score >= 52 ? 'bg-call' : 'bg-card2';
            return <div key={`${r}-${c}`} className={`aspect-square rounded-[2px] ${cls}`} />;
          }),
        )}
      </div>
      <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Chart de range · BTN</p>
    </div>
  );
}

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-xs font-bold text-text">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/30">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-title">{pct}%</span>
    </div>
  );
}

function GtoLure() {
  return (
    <div className="w-full max-w-[230px] space-y-2.5 rounded-xl border border-line bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Estratégia GTO</p>
      <Bar label="Raise" pct={72} color="bg-primary" />
      <Bar label="Call" pct={18} color="bg-call" />
      <Bar label="Fold" pct={10} color="bg-subtle" />
    </div>
  );
}

function TableLure() {
  return (
    <div className="relative h-44 w-64">
      <div className="absolute inset-0 rounded-[46%]" style={{ background: 'radial-gradient(ellipse at 50% 38%, #1c8454 0%, #14613b 55%, #0c3d27 100%)', boxShadow: 'inset 0 0 0 6px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,0,0,0.5)' }} />
      <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-extrabold text-white/80">CO</span>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-extrabold text-white/80">UTG</span>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-black/55 px-2 py-0.5 text-[10px] font-extrabold text-white/80">SB</span>
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-bold text-white/90">Pot 1.5 BB</div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
        <div className="flex gap-1.5"><Card token="A♠" /><Card token="K♠" /></div>
        <span className="rounded-lg bg-primary px-2.5 py-0.5 text-[10px] font-extrabold text-white ring-2 ring-white/30">BTN</span>
      </div>
    </div>
  );
}

function ProgressLure() {
  return (
    <div className="w-full max-w-[230px] space-y-3 rounded-xl border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-title">Nível 3 · Reg</span>
        <span className="rounded-full bg-card2 px-2 py-0.5 text-xs font-bold text-title">7🔥</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-gold" style={{ width: '64%' }} /></div>
      <div className="flex items-center justify-center gap-2 pt-1">
        {['bg-primary', 'bg-primary', 'bg-primary', 'bg-gold', 'bg-card2', 'bg-card2'].map((c, i) => (
          <span key={i} className={`h-4 w-4 rounded-full ${c}`} />
        ))}
      </div>
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-subtle">XP · streak · trilha</p>
    </div>
  );
}

function CardsLure() {
  return (
    <div className="relative flex h-44 w-full items-center justify-center">
      <div className="-translate-x-6 -rotate-12 animate-float-slow"><Card token="A♠" /></div>
      <div className="translate-x-6 rotate-12 animate-float-slow" style={{ animationDelay: '-2.5s' }}><Card token="K♠" /></div>
    </div>
  );
}

export function LureVisual({ kind }: { kind: Kind }) {
  const inner = kind === 'cards' ? <CardsLure /> : kind === 'grid' ? <GridLure /> : kind === 'gto' ? <GtoLure /> : kind === 'progress' ? <ProgressLure /> : <TableLure />;
  return <div className="flex h-full w-full items-center justify-center">{inner}</div>;
}
