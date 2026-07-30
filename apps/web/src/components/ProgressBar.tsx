/** Barra de progresso fina (PRD 11.3 — topo da tela de exercício). */
export function ProgressBar({ value, max, hot = false }: { value: number; max: number; hot?: boolean }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={`h-4 w-full overflow-hidden rounded-full bg-surface transition-shadow ${
        hot ? 'shadow-[0_0_14px_rgb(245_196_81_/_0.3)]' : ''
      }`}
      aria-label={`${value} de ${max} exercícios`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${hot ? 'bg-gold' : 'bg-primary'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
