import { useMemo } from 'react';

/**
 * Confete leve, sem dependências. Renderize com uma `key` única para disparar
 * (ex.: a cada acerto). Some sozinho ao fim da animação.
 */
// Segue a cor do app (--primary): o próprio accent + tons claros/escuros e um
// toque de ouro pro brilho. Muda junto quando o usuário troca a cor nas configs.
const COLORS = [
  'rgb(var(--primary))',
  'color-mix(in srgb, rgb(var(--primary)) 60%, white)',
  'color-mix(in srgb, rgb(var(--primary)) 82%, black)',
  'color-mix(in srgb, rgb(var(--primary)) 40%, white)',
  '#F5C451',
  'color-mix(in srgb, rgb(var(--primary)) 70%, black)',
];

export function Confetti({ count = 36 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.25,
        dur: 1.1 + Math.random() * 0.9,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
        rounded: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: p.rounded ? '9999px' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}
