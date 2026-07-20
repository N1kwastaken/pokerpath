import type { CSSProperties } from 'react';

/**
 * Logo do PokerPath. A marca (espada com a seta do "path" subindo) fica num
 * TILE METÁLICO — gradiente na cor do app com realce em cima e sombra embaixo,
 * no espírito do ícone do iOS. Segue o accent (--primary). O wordmark aparece
 * ao lado. Sem glow pulsante: o relevo do tile já dá presença.
 */

/** Tile metálico da marca — reusado pelo LogoLoader. Segue a cor do app. */
export const logoTileStyle: CSSProperties = {
  background:
    'linear-gradient(155deg, color-mix(in srgb, rgb(var(--primary)) 78%, #fff) 0%, rgb(var(--primary)) 45%, rgb(var(--primary2)) 100%)',
  boxShadow:
    'inset 0 1.5px 1.5px rgba(255,255,255,0.55), inset 0 -3px 6px rgba(0,0,0,0.25), 0 5px 12px -3px rgba(0,0,0,0.45)',
};

export function Logo({
  size = 'md',
  withWordmark = true,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withWordmark?: boolean;
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
      <div
        className={`flex ${spade} items-center justify-center overflow-hidden rounded-2xl`}
        style={logoTileStyle}
        aria-hidden
      >
        <img
          src="/logo-mark-white.png"
          alt=""
          className="h-3/4 w-3/4 object-contain drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)]"
        />
      </div>
      {withWordmark && (
        <span className={`font-display font-bold tracking-tight text-ink ${word}`}>
          Poker<span className="text-brand">Path</span>
        </span>
      )}
    </div>
  );
}
