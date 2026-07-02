import { useMemo } from 'react';

/**
 * Confete leve, sem dependências. Renderize com uma `key` única para disparar
 * (ex.: a cada acerto). Some sozinho ao fim da animação.
 */
const COLORS = ['#1FA463', '#27D17C', '#16A34A', '#3FD08A', '#0E7A45', '#A7F3C4'];

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
