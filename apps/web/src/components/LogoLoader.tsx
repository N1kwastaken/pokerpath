/**
 * Animação de carregamento com a logo: a espada pulsa no centro de um anel
 * giratório com gradiente, sobre o wordmark e três pontinhos. Theme-aware.
 * `inline` usa um bloco com padding (para dentro de uma página) em vez de
 * ocupar a tela inteira.
 */
export function LogoLoader({ label = 'Carregando...', inline = false }: { label?: string; inline?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${inline ? 'py-14' : 'min-h-dvh bg-bg'}`}>
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin" style={{ animationDuration: '1.1s' }}>
          <defs>
            <linearGradient id="logoloader" x1="0" y1="0" x2="1" y2="1">
              {/* Cauda de cometa na cor do app. Antes o 2º stop era #7C5CFF
                  fixo: num app verde o anel virava verde→roxo do nada. */}
              <stop offset="0%" stopColor="rgb(var(--primary))" />
              <stop offset="100%" stopColor="rgb(var(--primary) / 0.15)" />
            </linearGradient>
          </defs>
          {/* O TRILHO precisa ser visível. Medido: geometria do anel, do arco e
              do tile é idêntica (dx=dy=0), mas com o trilho em --line o
              contraste contra o fundo é 1.44:1 — some. Sobrava só a meia-lua
              girando, e meia-lua sem círculo em volta LÊ como descentralizada.
              primary/50% dá 2.31:1: o círculo aparece e ancora o centro. */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(var(--primary) / 0.5)" strokeWidth="6" />
          {/* Arco maior (140° em vez de 104°): quanto mais o arco lembra um
              anel, menos ele parece um borrão jogado para um lado. */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#logoloader)" strokeWidth="6" strokeLinecap="round" strokeDasharray="108 200" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {/* sem shadow-pop: a animação já escreve box-shadow, e as duas
              declarações brigando eram o que descentralizava o brilho. */}
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary animate-logo-glow">
            <img src="/logo-mark-white.png" alt="" className="h-3/4 w-3/4 object-contain" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="font-display text-xl font-bold text-title">Poker<span className="text-primary">Path</span></p>
        <div className="mt-2.5 flex justify-center gap-1.5" role="status" aria-label={label}>
          <Dot d={0} /><Dot d={160} /><Dot d={320} />
        </div>
      </div>
    </div>
  );
}
function Dot({ d }: { d: number }) {
  return <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />;
}
