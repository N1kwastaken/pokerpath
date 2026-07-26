/** Marca d'água para feltro, banners e cards de progresso. */
export function PathWatermark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 120" fill="none" className={className} aria-hidden>
      <path d="M-6 96C36 67 57 109 95 78s55-59 82-30 40 1 69-31" stroke="currentColor" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
      <path d="M160 24c22 0 40 18 40 40s-18 40-40 40-40-18-40-40 18-40 40-40Z" stroke="currentColor" strokeWidth="1.5" opacity=".65" />
      <path d="m160 38 7.2 15.5 16.8 2-12.3 11.7 3.2 16.7-14.9-8.2-14.9 8.2 3.2-16.7-12.3-11.7 16.8-2L160 38Z" fill="currentColor" opacity=".36" />
    </svg>
  );
}

/** Ficha ornamental para usar em cabeçalhos sem recorrer a emoji. */
export function ProgressMedallion({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" className={className} aria-hidden>
      <circle cx="36" cy="36" r="32" fill="currentColor" opacity=".16" />
      <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="4" strokeDasharray="7 8" />
      <circle cx="36" cy="36" r="20" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" />
      <path d="M36 20c-3.4 6-11 9-11 17.2 0 5.5 4.5 9.6 9.7 9.1L31 52h10l-3.7-5.7c5.2.5 9.7-3.6 9.7-9.1C47 29 39.4 26 36 20Z" fill="currentColor" />
      <path d="M31.7 39.6c3.5-.9 5.7-3.8 6.7-7.4" stroke="rgb(var(--card))" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
