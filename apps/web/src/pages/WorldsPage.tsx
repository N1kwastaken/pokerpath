import { useNavigate } from 'react-router-dom';
import type { WorldSummary } from '@pokerpath/shared';
import { useWorlds } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconCheck, IconLock } from '../components/Icons.js';

/**
 * Trilha de Mundos — caminho contínuo ASCENDENTE (estilo Duolingo) no tema
 * escuro: traçado entre as fases, nós 3D, hero "VOCÊ" na fase atual.
 */
const GOLD = '#C9A84C';

export function WorldsPage() {
  const { data: worlds, isLoading, isError } = useWorlds();
  const navigate = useNavigate();
  const currentId = worlds?.find((w) => !w.locked && !w.premiumLocked && w.completedStages < w.totalStages)?.id;
  const allDone = !!worlds && worlds.length > 0 && worlds.every((w) => w.totalStages > 0 && w.completedStages === w.totalStages);

  const n = worlds?.length ?? 0;
  const W = 300, STEP = 128, TOP = 58, AMP = 74;
  const cx = (i: number) => 150 + AMP * Math.sin(i * 0.85);
  const cy = (i: number) => TOP + (n - 1 - i) * STEP; // ordem 0 embaixo → sobe
  const height = TOP * 2 + Math.max(0, n - 1) * STEP;
  const d = (worlds ?? []).map((_, i) => `${i === 0 ? 'M' : 'L'} ${cx(i).toFixed(1)} ${cy(i).toFixed(1)}`).join(' ');

  return (
    <div className="px-5 py-7">
      <header className="mb-2">
        <p className="text-xs text-subtle">Sua jornada</p>
        <h1 className="text-2xl font-bold text-title">Treino</h1>
      </header>

      {isLoading && <LogoLoader inline label="Carregando trilha..." />}
      {isError && <p className="text-error">Não foi possível carregar a trilha.</p>}

      {worlds && (
        <>
          {/* Cume */}
          <div className="mb-1 flex flex-col items-center">
            <span className="text-3xl">🏁</span>
            <span className={`mt-1 rounded-full px-3 py-1 text-[11px] font-bold ${allDone ? 'text-black' : 'border border-line text-subtle'}`} style={allDone ? { backgroundColor: GOLD } : undefined}>
              Mestre do Pré-flop
            </span>
          </div>

          <div className="relative mx-auto" style={{ width: W, height }}>
            <svg className="absolute inset-0" width={W} height={height} fill="none">
              <path d={d} stroke="rgb(var(--line))" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} stroke="rgb(var(--primary))" strokeOpacity={0.55} strokeWidth={4} strokeLinecap="round" strokeDasharray="0.1 18" />
            </svg>

            {worlds.map((w, i) => (
              <div key={w.id} className="absolute" style={{ left: cx(i), top: cy(i), transform: 'translate(-50%, -50%)' }}>
                <WorldNode
                  world={w}
                  isCurrent={w.id === currentId}
                  onOpen={() => { if (w.premiumLocked) return navigate('/premium'); if (w.locked) return; navigate(`/worlds/${w.id}`); }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function WorldNode({ world, isCurrent, onOpen }: { world: WorldSummary; isCurrent: boolean; onOpen: () => void }) {
  const complete = world.totalStages > 0 && world.completedStages === world.totalStages;
  const premium = world.premiumLocked;
  const locked = world.locked && !premium;

  const fill = premium ? GOLD : locked ? 'rgb(var(--subtle))' : 'rgb(var(--primary))';
  const edge = premium ? '#9C7E2E' : locked ? 'rgba(0,0,0,0.45)' : 'rgb(var(--primary2))';
  const size = isCurrent ? 76 : 66;

  return (
    <button onClick={onOpen} disabled={world.locked && !premium} aria-label={world.name} className="group relative flex flex-col items-center">
      {isCurrent && (
        <span className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 animate-float whitespace-nowrap rounded-xl bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
          Você
          <span className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-primary" />
        </span>
      )}
      <span
        className="relative flex items-center justify-center rounded-full text-2xl text-white shadow-[0_6px_0_0_var(--edge)] transition-all group-active:translate-y-[3px] group-active:shadow-[0_2px_0_0_var(--edge)]"
        style={{ width: size, height: size, backgroundColor: fill, ['--edge' as string]: edge } as React.CSSProperties}
      >
        {isCurrent && <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-25" />}
        <span className="relative flex items-center">
          {premium || locked ? <IconLock size={24} /> : complete ? <IconCheck size={28} /> : world.icon}
        </span>
      </span>
      <span className="absolute top-[78px] left-1/2 w-28 -translate-x-1/2 text-center">
        <span className={`text-[11px] font-bold ${world.locked && !premium ? 'text-subtle' : 'text-title'}`}>{world.name}</span>
        {world.totalStages > 0 && !premium && <span className="block text-[10px] text-subtle">{world.completedStages}/{world.totalStages}</span>}
        {premium && <span className="block text-[10px] font-semibold" style={{ color: GOLD }}>Premium</span>}
      </span>
    </button>
  );
}
