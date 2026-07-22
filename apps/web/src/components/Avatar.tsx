import { ACCENTS } from '../lib/accent.js';

/**
 * Avatar de inicial (não há upload de foto ainda).
 *
 * A cor de fundo é DERIVADA do nome, não aleatória: a mesma pessoa tem sempre
 * a mesma cor, em qualquer tela e em qualquer aparelho — é isso que faz o
 * avatar virar reconhecimento visual numa lista. A paleta é a do app, então
 * nenhuma cor foge da marca.
 */
const PALETTE = ACCENTS.filter((a) => a.key !== 'silver').map((a) => a.hex);

function hueFor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({ name, size = 44, color, ring, src }: {
  name: string;
  size?: number;
  /** Força a cor (o próprio usuário usa a cor escolhida do app). */
  color?: string;
  /** Anel externo — marca "você" na lista. */
  ring?: boolean;
  /** Foto de perfil (data URI). Sem ela, cai na inicial colorida. */
  src?: string | null;
}) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const box = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-black text-white ${
    ring ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg' : ''
  }`;
  return (
    <span
      aria-hidden
      className={box}
      style={{
        width: size, height: size, fontSize: size * 0.42,
        background: src ? 'rgb(var(--card2))' : color ?? hueFor(name),
      }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : letter}
    </span>
  );
}
