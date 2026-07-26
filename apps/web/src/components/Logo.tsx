/**
 * Logo do PokerPath com animação.
 * Usa a marca original em PNG dentro do tile verde e preserva o wordmark.
 * `animated` liga/desliga o brilho contínuo.
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
  const mark = {
    sm: 'h-8 w-8 rounded-xl',
    md: 'h-11 w-11 rounded-2xl',
    lg: 'h-[4.5rem] w-[4.5rem] rounded-[1.4rem]',
    xl: 'h-28 w-28 rounded-[2rem]',
  }[size];
  const word = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  }[size];

  return (
    <div className="flex items-center gap-3">
      {/* Marca original branca sobre o tile na cor do app. */}
      <div
        className={`flex ${mark} items-center justify-center overflow-hidden bg-primary ${
          animated ? 'animate-logo-glow' : ''
        }`}
        aria-hidden
      >
        <img src="/logo-mark-white.png" alt="" className="h-3/4 w-3/4 object-contain" />
      </div>
      {withWordmark && (
        <span className={`font-display font-bold tracking-[-0.05em] text-title ${word}`}>
          Poker<span className="text-primary">Path</span>
        </span>
      )}
    </div>
  );
}
