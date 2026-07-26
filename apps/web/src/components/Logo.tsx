import { PokerPathMark } from './BrandMark.js';

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
  const mark = {
    sm: { tile: 'h-8 w-8 rounded-xl', svg: 23 },
    md: { tile: 'h-11 w-11 rounded-2xl', svg: 31 },
    lg: { tile: 'h-[4.5rem] w-[4.5rem] rounded-[1.4rem]', svg: 50 },
    xl: { tile: 'h-28 w-28 rounded-[2rem]', svg: 78 },
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
        className={`brand-tile flex ${mark.tile} items-center justify-center ${
          animated ? 'animate-logo-glow' : ''
        }`}
        aria-hidden
      >
        <PokerPathMark size={mark.svg} className="text-white" />
      </div>
      {withWordmark && (
        <span className={`font-display font-bold tracking-[-0.05em] text-title ${word}`}>
          Poker<span className="text-primary">Path</span>
        </span>
      )}
    </div>
  );
}
