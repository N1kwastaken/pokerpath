import { Link, useNavigate, useParams } from 'react-router-dom';
import type { StageSummary, WorldDetail } from '@pokerpath/shared';
import { useWorld } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconCheck, IconLock, IconBook, IconTarget } from '../components/Icons.js';

/**
 * Detalhe do Mundo — caminho de fases estilo Duolingo, ASCENDENTE
 * (começa embaixo e sobe), com traçado entre as fases e nós 3D.
 */
const ACCENT = '#7C5CFF'; // cor das AULAS (diferencia das práticas)

function darken(hex: string, f = 0.7): string {
  const m = hex.replace('#', '');
  const r = Math.round(parseInt(m.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(m.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(m.slice(4, 6), 16) * f);
  return `rgb(${r}, ${g}, ${b})`;
}

export function WorldDetailPage() {
  const { worldId } = useParams();
  const navigate = useNavigate();
  const { data: world, isLoading, isError } = useWorld(worldId);

  return (
    <div className="px-5 py-8">
      <Link to="/worlds" className="mb-4 inline-block text-sm font-medium text-subtle">← Treino</Link>
      {isLoading && <LogoLoader inline label="Carregando fases..." />}
      {isError && <p className="text-error">Não foi possível carregar este mundo.</p>}
      {world && <WorldPath world={world} onOpen={(id) => navigate(`/stages/${id}`)} />}
    </div>
  );
}

function WorldPath({ world, onOpen }: { world: WorldDetail; onOpen: (id: string) => void }) {
  const stages = world.stages;
  const n = stages.length;
  const currentId = stages.find((s) => s.status === 'IN_PROGRESS')?.id;

  // Geometria do caminho (stage 0 embaixo, sobe).
  const W = 300, STEP = 124, TOP = 64, AMP = 78;
  const cx = (i: number) => 150 + AMP * Math.sin(i * 0.85);
  const cy = (i: number) => TOP + (n - 1 - i) * STEP; // i=0 → mais embaixo
  const height = TOP * 2 + (n - 1) * STEP;
  const d = stages.map((_, i) => `${i === 0 ? 'M' : 'L'} ${cx(i).toFixed(1)} ${cy(i).toFixed(1)}`).join(' ');

  return (
    <>
      {/* Cabeçalho do mundo */}
      <div className="mb-2 flex items-center justify-between rounded-2xl px-5 py-4 text-white shadow-pop"
        style={{ backgroundColor: world.color }}>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Mundo {world.order}</p>
          <h1 className="truncate text-lg font-extrabold leading-tight text-white">{world.name}</h1>
        </div>
        <span className="ml-3 text-3xl">{world.icon}</span>
      </div>
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-widest text-subtle">↑ suba até o topo ↑</p>

      {/* Caminho */}
      <div className="relative mx-auto" style={{ width: W, height }}>
        <svg className="absolute inset-0" width={W} height={height} fill="none">
          <path d={d} stroke={world.color} strokeOpacity={0.22} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} stroke={world.color} strokeOpacity={0.85} strokeWidth={4} strokeLinecap="round" strokeDasharray="0.1 17" />
        </svg>

        {stages.map((s, i) => (
          <div key={s.id} className="absolute" style={{ left: cx(i), top: cy(i), transform: 'translate(-50%, -50%)' }}>
            <PathNode stage={s} color={world.color} isCurrent={s.id === currentId} onOpen={() => { if (s.status !== 'LOCKED') onOpen(s.id); }} />
          </div>
        ))}
      </div>
    </>
  );
}

function PathNode({ stage, color, isCurrent, onOpen }: {
  stage: StageSummary; color: string; isCurrent: boolean; onOpen: () => void;
}) {
  const locked = stage.status === 'LOCKED';
  const completed = stage.status === 'COMPLETED';
  const lesson = stage.isLesson;

  // Cor por tipo: aula = roxo, prática = cor do mundo, bloqueada = cinza.
  const fill = locked ? 'rgb(var(--subtle))' : lesson ? ACCENT : color;
  const edge = locked ? 'rgba(0,0,0,0.30)' : darken(lesson ? ACCENT : color);
  const size = isCurrent ? 78 : 68;

  return (
    <button onClick={onOpen} disabled={locked} aria-label={stage.title} className="group relative flex items-center justify-center">
      {isCurrent && (
        <span className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 animate-float whitespace-nowrap rounded-xl bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-pop"
          style={{ color }}>
          Começar
          <span className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
        </span>
      )}
      <span
        className="relative flex items-center justify-center rounded-full text-white shadow-[0_7px_0_0_var(--edge)] transition-all group-active:translate-y-[4px] group-active:shadow-[0_2px_0_0_var(--edge)]"
        style={{ width: size, height: size, backgroundColor: fill, ['--edge' as string]: edge } as React.CSSProperties}
      >
        {isCurrent && !locked && <span className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: color, opacity: 0.3 }} />}
        {completed && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white shadow-soft"><IconCheck size={12} /></span>}
        <span className="relative flex items-center">
          {locked ? <IconLock size={24} /> : completed ? <IconCheck size={30} /> : lesson ? <IconBook size={26} /> : <IconTarget size={26} />}
        </span>
      </span>
    </button>
  );
}
