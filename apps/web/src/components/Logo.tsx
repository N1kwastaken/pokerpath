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
  // A espada ocupa quase todo o tile — o símbolo é a marca, não a moldura.
  const spade = {
    sm: 'h-7 w-7 text-[1.6rem]',
    md: 'h-10 w-10 text-[2.3rem]',
    lg: 'h-16 w-16 text-[3.7rem]',
    xl: 'h-24 w-24 text-[5.6rem]',
  }[size];
  const word = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }[size];

  return (
    <div className="flex items-center gap-3">
      {/* Tile quase chapado: o gradiente antigo (brand -> brand-dark) sujava o
          símbolo. Fica só um respiro de profundidade. */}
      <div
        className={`flex ${spade} items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-[#177A44] font-black leading-none text-white ${
          animated ? 'animate-logo-glow' : ''
        }`}
        aria-hidden
      >
        <span className="-mt-[0.06em]">♠</span>
      </div>
      {withWordmark && (
        <span className={`font-display font-bold tracking-tight text-ink ${word}`}>
          Poker<span className="text-brand">Path</span>
        </span>
      )}
    </div>
  );
}
