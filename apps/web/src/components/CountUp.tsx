import { useEffect, useState } from 'react';

/**
 * Número que SOBE até o valor final (ease-out cúbico). O tique dos pontos
 * subindo no resumo é um dos micro-prazeres mais baratos de um jogo — um
 * número estático no fim da fase joga essa recompensa fora.
 */
export function CountUp({ to, duration = 900, prefix = '', suffix = '' }: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{prefix}{v.toLocaleString('pt-BR')}{suffix}</>;
}
