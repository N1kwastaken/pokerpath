/**
 * Logo do PokerPath com animação.
 * A marca (espada com a seta do "path" subindo) fica num tile verde chapado e
 * pulsa com um brilho verde (logo-glow); o wordmark aparece ao lado.
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
      {/* Tile chapado com a marca branca (espada + seta). Segue a cor do app
          (bg-primary/accent) — muda junto quando o usuário troca a cor. */}
      <div
        className={`flex ${spade} items-center justify-center overflow-hidden rounded-2xl bg-primary ${
          animated ? 'animate-logo-glow' : ''
        }`}
        aria-hidden
      >
        <img src="/logo-mark-white.png" alt="" className="h-3/4 w-3/4 object-contain" />
      </div>
      {withWordmark && (
        <span className={`font-display font-bold tracking-tight text-ink ${word}`}>
          Poker<span className="text-brand">Path</span>
        </span>
      )}
    </div>
  );
}
