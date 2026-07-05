import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { WorldDetail, StageSummary } from '@pokerpath/shared';
import { useTrail } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconCheck, IconLock, IconBook, IconTarget, IconStar } from '../components/Icons.js';
import { stageGroup, categoryColor, categoryDesc } from '../lib/stageGroup.js';

/**
 * Trilha de UM mundo por vez (Preflop/Flop/Turn/River), sub-dividida nas
 * categorias antigas (Fundamentos, UTG, MP, CO, BTN, SB, Revisão). Ascendente.
 * O mundo atual avança sozinho ao concluir o último; há seletor de mundos.
 */
const DX = [0, -40, -56, -40, 0, 40, 56, 40];

function darken(hex: string, f = 0.7): string {
  const m = hex.replace('#', '');
  const r = Math.round(parseInt(m.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(m.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(m.slice(4, 6), 16) * f);
  return `rgb(${r}, ${g}, ${b})`;
}
function splitGroups(stages: StageSummary[]): { name: string; stages: StageSummary[] }[] {
  const out: { name: string; stages: StageSummary[] }[] = [];
  for (const s of stages) {
    const g = stageGroup(s.concept);
    const cur = out[out.length - 1];
    if (!cur || cur.name !== g) out.push({ name: g, stages: [s] });
    else cur.stages.push(s);
  }
  return out;
}

function DrawCheck({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 26, strokeDashoffset: 26 }} className="animate-check-draw" />
    </svg>
  );
}

export function TrailPage() {
  const { data: trail, isLoading, isError } = useTrail();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fromExercise = !!(location.state as { fromExercise?: boolean } | null)?.fromExercise;
  const skipMut = useMutation({ mutationFn: () => gameApi.skipBasics(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trail'] }) });

  const currentRef = useRef<HTMLDivElement>(null);
  const [completedId] = useState<string | null>(() => {
    const v = localStorage.getItem('pp.justCompleted');
    if (v) localStorage.removeItem('pp.justCompleted');
    return v;
  });

  // Mundo atual = primeiro com fase IN_PROGRESS (senão o último).
  const currentWorld = trail?.find((w) => w.stages.some((s) => s.status === 'IN_PROGRESS')) ?? trail?.[trail.length - 1];
  const [selId, setSelId] = useState<string | null>(null);
  const selected = trail?.find((w) => w.id === (selId ?? currentWorld?.id)) ?? currentWorld;
  const currentStageId = selected?.stages.find((s) => s.status === 'IN_PROGRESS')?.id;

  useEffect(() => {
    if (!currentStageId) return;
    const t = setTimeout(() => {
      currentRef.current?.scrollIntoView({ behavior: fromExercise ? 'auto' : 'smooth', block: 'center' });
    }, 140);
    return () => clearTimeout(t);
  }, [currentStageId, fromExercise]);

  return (
    <div className="px-5 py-7">
      <header className="mb-3">
        <p className="text-xs text-subtle">Sua jornada</p>
        <h1 className="text-2xl font-bold text-title">Treino</h1>
      </header>

      {isLoading && <LogoLoader inline label="Carregando trilha..." />}
      {isError && <p className="text-error">Não foi possível carregar a trilha.</p>}

      {trail && selected && (
        <>
          {/* Seletor de mundos */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {trail.map((w) => {
              const lock = w.locked || w.premiumLocked;
              const on = w.id === selected.id;
              return (
                <button key={w.id} onClick={() => setSelId(w.id)}
                  className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${on ? 'text-white' : 'bg-card2 text-subtle'}`}
                  style={on ? { backgroundColor: w.color } : undefined}>
                  <span>{w.icon}</span>{w.name}{lock && <IconLock size={11} />}
                </button>
              );
            })}
          </div>

          {/* Cabeçalho do mundo (rua) */}
          <div className="mb-2 flex items-center justify-between rounded-xl px-4 py-3 text-white" style={{ backgroundColor: selected.color }}>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Mundo {selected.order}</p>
              <h2 className="truncate text-lg font-extrabold">{selected.name}</h2>
            </div>
            <span className="ml-3 shrink-0 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold">
              {selected.premiumLocked ? '🔒 Premium' : `${selected.stages.filter((s) => s.status === 'COMPLETED').length}/${selected.stages.length}`}
            </span>
          </div>
          {selected.order === 0 && selected.stages.some((s) => s.status !== 'COMPLETED') && (
            <button onClick={() => skipMut.mutate()} disabled={skipMut.isPending}
              className="mb-2 w-full rounded-lg border border-line bg-card2 py-2 text-xs font-bold text-subtle active:scale-[0.99] disabled:opacity-60">
              {skipMut.isPending ? 'Pulando...' : 'Já joguei — pular os primeiros passos'}
            </button>
          )}

          {/* Trilha do mundo (ascendente, agrupada por categoria) */}
          <WorldTrail world={selected} currentId={currentStageId} completedId={completedId} currentRef={currentRef}
            onOpen={(id, locked, premium) => { if (premium) return navigate('/premium'); if (locked) return; navigate(`/stages/${id}`); }} />
        </>
      )}
    </div>
  );
}

function WorldTrail({ world, currentId, completedId, currentRef, onOpen }: {
  world: WorldDetail; currentId?: string; completedId: string | null; currentRef: React.Ref<HTMLDivElement>;
  onOpen: (id: string, locked: boolean, premium: boolean) => void;
}) {
  const groups = splitGroups(world.stages);
  const multi = groups.length > 1;
  return (
    <div className="mt-3 flex flex-col items-center">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-subtle">🏁 Fim do mundo</p>
      {[...groups].reverse().map((grp) => {
        const done = grp.stages.filter((s) => s.status === 'COMPLETED').length;
        const catColor = multi ? categoryColor(grp.name) : world.color;
        return (
          <div key={grp.name} className="w-full">
            {[...grp.stages].reverse().map((s, ri) => {
              const i = grp.stages.length - 1 - ri;
              return (
                <Node key={s.id} stage={s} color={catColor} idx={i}
                  isCurrent={s.id === currentId} completedId={completedId}
                  nodeRef={s.id === currentId ? currentRef : undefined}
                  onOpen={() => onOpen(s.id, s.status === 'LOCKED', world.premiumLocked)} />
              );
            })}
            {multi && (
              <div className="my-5 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-pop" style={{ backgroundColor: catColor }}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20 text-xl font-black text-white">{grp.name[0]}</span>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold uppercase tracking-wide text-white">{grp.name}</h3>
                  <p className="truncate text-xs font-semibold text-white/85">{categoryDesc(grp.name)}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-black/25 px-3 py-1 text-xs font-bold text-white">{done}/{grp.stages.length}</span>
              </div>
            )}
          </div>
        );
      })}
      <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-subtle">Início ↑</p>
    </div>
  );
}

function Node({ stage, color, idx, isCurrent, completedId, onOpen, nodeRef }: {
  stage: StageSummary; color: string; idx: number; isCurrent: boolean; completedId: string | null; onOpen: () => void; nodeRef?: React.Ref<HTMLDivElement>;
}) {
  const locked = stage.status === 'LOCKED';
  const completed = stage.status === 'COMPLETED';
  const lesson = stage.isLesson;
  const justChecked = !!completedId && stage.id === completedId;
  const animateUnlock = isCurrent && !!completedId;

  const [revealed, setRevealed] = useState(!animateUnlock);
  useEffect(() => {
    if (!animateUnlock) return;
    const t = setTimeout(() => setRevealed(true), 380);
    return () => clearTimeout(t);
  }, [animateUnlock]);

  const colored = color;
  const fill = !revealed ? 'rgb(var(--subtle))' : locked ? 'rgb(var(--subtle))' : colored;
  const edge = !revealed || locked ? 'rgba(0,0,0,0.45)' : darken(colored);

  return (
    <div ref={nodeRef} className="flex flex-col items-center" style={{ transform: `translateX(${DX[idx % DX.length]}px)` }}>
      <div className="h-6 w-1 rounded-full" style={{ backgroundColor: completed ? 'rgb(var(--primary))' : 'rgb(var(--line))' }} />
      {isCurrent && revealed && (
        <span className="relative z-10 mb-1 animate-float whitespace-nowrap rounded-lg bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-pop" style={{ color }}>
          Começar
          <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-white" />
        </span>
      )}
      <button onClick={onOpen} disabled={locked} aria-label={stage.title} className="group relative my-1 flex items-center justify-center">
        <span
          className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full text-white shadow-[0_5px_0_0_var(--edge)] transition-[background-color,box-shadow] duration-700 group-active:translate-y-[3px]"
          style={{ backgroundColor: fill, ['--edge' as string]: edge } as React.CSSProperties}
        >
          {isCurrent && revealed && <span className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: color, opacity: 0.3 }} />}
          {completed && (
            stage.perfect ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white/70" title="Sessão perfeita">
                <IconStar size={12} />
              </span>
            ) : (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white">
                {justChecked ? <DrawCheck /> : <IconCheck size={12} />}
              </span>
            )
          )}
          <span className="relative flex items-center">
            {locked ? <IconLock size={22} /> : completed ? <IconCheck size={26} /> : lesson ? <IconBook size={24} /> : <IconTarget size={24} />}
          </span>
        </span>
      </button>
    </div>
  );
}
