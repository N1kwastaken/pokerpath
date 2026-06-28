import { useNavigate } from 'react-router-dom';
import type { WorldSummary } from '@pokerpath/shared';
import { useWorlds } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconCheck, IconLock } from '../components/Icons.js';

/** Mapa de Mundos — caminho de ASCENSÃO: começa embaixo e sobe rumo ao cume. */
export function WorldsPage() {
  const { data: worlds, isLoading, isError } = useWorlds();
  const navigate = useNavigate();
  const currentId = worlds?.find((w) => !w.locked && !w.premiumLocked && w.completedStages < w.totalStages)?.id;
  // Sobe: maior mundo no topo, mundo 0 na base.
  const ascending = worlds ? [...worlds].reverse() : [];
  const allDone = worlds && worlds.length > 0 && worlds.every((w) => w.totalStages > 0 && w.completedStages === w.totalStages);

  return (
    <div className="px-5 py-8">
      <header className="mb-6">
        <p className="text-sm text-subtle">Sua jornada</p>
        <h1 className="text-3xl font-bold text-title">Treino</h1>
      </header>

      {isLoading && <LogoLoader inline label="Carregando mundos..." />}
      {isError && <p className="text-error">Não foi possível carregar os mundos.</p>}

      {worlds && (
        <div className="flex flex-col items-center">
          {/* Cume */}
          <div className="mb-1 flex flex-col items-center">
            <span className="text-3xl">🏔️</span>
            <span className={`mt-1 rounded-full px-3 py-1 text-[11px] font-bold ${allDone ? 'bg-gold text-white shadow-pop' : 'bg-card2 text-subtle border border-line'}`}>
              Cume · Mestre do Pré-flop
            </span>
            <div className="my-2 h-6 w-1 rounded-full bg-line" />
          </div>

          {ascending.map((w, d) => (
            <WorldNode
              key={w.id}
              world={w}
              isCurrent={w.id === currentId}
              isBase={d === ascending.length - 1}
              onOpen={() => { if (w.premiumLocked) return navigate('/premium'); if (w.locked) return; navigate(`/worlds/${w.id}`); }}
            />
          ))}

          <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-subtle">Início</p>
        </div>
      )}
    </div>
  );
}

function WorldNode({ world, isCurrent, isBase, onOpen }: {
  world: WorldSummary; isCurrent: boolean; isBase: boolean; onOpen: () => void;
}) {
  const complete = world.totalStages > 0 && world.completedStages === world.totalStages;
  const locked = world.locked || world.premiumLocked;
  // Zigue-zague estável pela ordem do mundo.
  const offset = world.order % 2 === 0 ? '-translate-x-10' : 'translate-x-10';
  const connectorOffset = world.order % 2 === 0 ? 'translate-x-10' : '-translate-x-10';

  // Cores SÓLIDAS para contraste no dark (nada de fundo-de-card que some).
  const node = world.premiumLocked
    ? 'bg-gradient-to-b from-gold to-amber-600 text-white'
    : world.locked
    ? 'bg-subtle text-white'
    : 'bg-gradient-to-b from-primary to-primary-press text-white';

  return (
    <div className={`flex flex-col-reverse items-center ${offset}`}>
      <button onClick={onOpen} disabled={world.locked && !world.premiumLocked} className="group relative flex flex-col items-center">
        {isCurrent && <span className="absolute -top-7 z-10 animate-float rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow-pop">VOCÊ</span>}
        <span
          className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-full text-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.16)] transition-all group-active:translate-y-[4px] group-active:shadow-[0_2px_0_0_rgba(0,0,0,0.16)] ${node}`}
        >
          {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
          <span className="relative flex items-center">
            {world.premiumLocked || world.locked ? <IconLock size={24} /> : complete ? <IconCheck size={26} /> : world.icon}
          </span>
        </span>
        <div className="mt-2 text-center">
          <p className={`text-sm font-bold ${locked ? 'text-subtle' : 'text-title'}`}>{world.order}. {world.name}</p>
          {world.totalStages > 0 && !world.premiumLocked && <p className="text-[11px] text-subtle">{world.completedStages}/{world.totalStages} fases</p>}
          {world.premiumLocked && <p className="text-[11px] font-semibold text-gold">Premium</p>}
        </div>
      </button>
      {/* Conector ACIMA do nó (ligando ao mundo seguinte, que está mais alto) */}
      {!isBase && <div className={`my-3 h-9 w-1 rounded-full ${complete ? 'bg-primary/40' : 'bg-line'} ${connectorOffset}`} />}
    </div>
  );
}
