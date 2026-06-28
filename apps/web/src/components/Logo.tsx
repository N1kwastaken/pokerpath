/**
 * Logo do PokerPath com animação.
 * O naipe de espadas pulsa com um brilho verde (logo-glow); o wordmark
 * aparece ao lado. `animated` liga/desliga o brilho contínuo.
 */
export function Logo({
  size = 'md',
  withWordmark = true,
  animated = true,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withWordmark?: boolean;
  animated?: boolean;
}) {
  const spade = {
    sm: 'h-7 w-7 text-xl',
    md: 'h-10 w-10 text-2xl',
    lg: 'h-16 w-16 text-4xl',
    xl: 'h-24 w-24 text-6xl',
  }[size];
  const word = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex ${spade} items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-dark font-black text-white ${
          animated ? 'animate-logo-glow' : ''
        }`}
        aria-hidden
      >
        ♠
      </div>
      {withWordmark && (
        <span className={`font-display font-bold tracking-tight text-ink ${word}`}>
          Poker<span className="text-brand">Path</span>
        </span>
      )}
    </div>
  );
}
