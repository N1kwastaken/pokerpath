/**
 * Fundo ambiental: blobs de aurora animados + naipes flutuantes.
 * Puramente decorativo (pointer-events-none), fica atrás do conteúdo.
 */
const SUITS = [
  { s: '♠', x: '8%', y: '18%', d: '0s', size: 'text-5xl' },
  { s: '♥', x: '82%', y: '12%', d: '1.5s', size: 'text-4xl' },
  { s: '♦', x: '78%', y: '70%', d: '3s', size: 'text-5xl' },
  { s: '♣', x: '12%', y: '76%', d: '2.2s', size: 'text-4xl' },
];

export function Background({ variant = 'full' }: { variant?: 'full' | 'soft' }) {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-[90px] animate-aurora" />
      <div
        className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-accent/20 blur-[90px] animate-aurora"
        style={{ animationDelay: '-6s' }}
      />
      {variant === 'full' && (
        <div
          className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gold/10 blur-[100px] animate-aurora"
          style={{ animationDelay: '-11s' }}
        />
      )}
      {variant === 'full' &&
        SUITS.map((it) => (
          <span
            key={it.s + it.x}
            className={`absolute font-display text-white/[0.04] ${it.size} animate-float-slow`}
            style={{ left: it.x, top: it.y, animationDelay: it.d }}
          >
            {it.s}
          </span>
        ))}
    </div>
  );
}
