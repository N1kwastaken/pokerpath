import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { WorldDetail, StageSummary } from '@pokerpath/shared';
import { useTrail } from '../hooks/useGame.js';
import { useAuth } from '../auth/AuthContext.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconCheck, IconLock, IconBook, IconTarget, IconStar, IconGrad, IconFlag } from '../components/Icons.js';
import { stageGroup, categoryColor, categoryDesc } from '../lib/stageGroup.js';

/**
 * Trilha de UM mundo por vez (Preflop/Flop/Turn/River), sub-dividida em
 * "mesas" (Fundamentos, UTG, MP, …). Ascendente, com visual de poker:
 * feltro ao fundo, fases = FICHAS (borda listrada), fase atual marcada
 * pelo dealer button, fase perfeita = ficha dourada.
 */
const DX = [0, 18, 0, -18];
const GOLD = '#C9A84C';

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
  const { user } = useAuth();
  // Contas DEV (beta) são premium mesmo com plan=FREE — bater com o servidor
  // (effectivePlan), senão as fases premium travam na interface sem motivo.
  const isFree = user?.plan !== 'PREMIUM' && !user?.isDev;
  const navigate = useNavigate();
  const location = useLocation();
  const fromExercise = !!(location.state as { fromExercise?: boolean } | null)?.fromExercise;

  const currentRef = useRef<HTMLDivElement>(null);
  const [completedId] = useState<string | null>(() => {
    const v = localStorage.getItem('pp.justCompleted');
    if (v) localStorage.removeItem('pp.justCompleted');
    return v;
  });

  // Acabou de concluir uma fase? Trava a entrada em QUALQUER fase enquanto a
  // animação de conclusão + desbloqueio roda — senão um toque rápido "bufferizado"
  // reentra na mesma fase sem querer.
  const [entryLocked, setEntryLocked] = useState(!!completedId);
  useEffect(() => {
    if (!completedId) return;
    const t = setTimeout(() => setEntryLocked(false), 850);
    return () => clearTimeout(t);
  }, [completedId]);

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

  // Botão "ir para a fase atual": aparece quando a ficha atual sai da tela,
  // no lado OPOSTO (fase abaixo → botão embaixo; fase acima → botão em cima).
  const [offscreen, setOffscreen] = useState<'above' | 'below' | null>(null);
  useEffect(() => {
    function update() {
      const el = currentRef.current;
      if (!el) return setOffscreen(null);
      const r = el.getBoundingClientRect();
      if (r.bottom < 90) setOffscreen('above');
      else if (r.top > window.innerHeight - 100) setOffscreen('below');
      else setOffscreen(null);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [currentStageId, selId]);

  return (
    <div
      className="min-h-dvh px-5 py-7"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, var(--felt-1) 0%, var(--felt-2) 45%, var(--felt-3) 100%)',
      }}
    >
      <header className="mb-3">
        <p className="text-xs text-white/55">Sua jornada</p>
        <h1 className="text-2xl font-bold text-white">Treino</h1>
      </header>

      {isLoading && <LogoLoader inline label="Carregando trilha..." />}
      {isError && <p className="text-error">Não foi possível carregar a trilha.</p>}

      {trail && selected && (
        <>
          {/* Seletor de mundos */}
          <div className="mb-4 flex gap-2 no-scrollbar overflow-x-auto">
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
              {selected.premiumLocked ? <span className="flex items-center gap-1"><IconLock size={12} /> Premium</span> : `${selected.stages.filter((s) => s.status === 'COMPLETED').length}/${selected.stages.length}`}
            </span>
          </div>
          {selected.order === 0 && selected.stages.some((s) => s.status !== 'COMPLETED') && (
            <button onClick={() => navigate('/placement')}
              className="mb-2 w-full rounded-lg border border-white/15 bg-black/25 py-2 text-xs font-bold text-white/80 active:scale-[0.99]">
              <IconGrad size={14} className="mr-1.5 inline align-[-2px]" />Já sei jogar — fazer a prova de nivelamento
            </button>
          )}

          {/* Trilha do mundo (ascendente, agrupada por categoria) */}
          <WorldTrail world={selected} currentId={currentStageId} completedId={completedId} currentRef={currentRef} isFree={isFree}
            onOpen={(id, locked, premium) => { if (entryLocked) return; if (premium) return navigate('/premium'); if (locked) return; navigate(`/stages/${id}`); }} />

          {offscreen && (
            <button
              onClick={() => currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className={`fixed inset-x-0 z-40 mx-auto flex w-fit animate-slide-up items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-title shadow-pop ${offscreen === 'above' ? 'top-4' : 'bottom-24'}`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-black">D</span>
              Fase atual {offscreen === 'above' ? '↑' : '↓'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function WorldTrail({ world, currentId, completedId, currentRef, onOpen, isFree }: {
  world: WorldDetail; currentId?: string; completedId: string | null; currentRef: React.Ref<HTMLDivElement>;
  onOpen: (id: string, locked: boolean, premium: boolean) => void; isFree: boolean;
}) {
  const groups = splitGroups(world.stages);
  const multi = groups.length > 1;
  return (
    <div className="mt-3 flex flex-col items-center px-1 py-4">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/50"><IconFlag size={13} /> Fim do mundo</p>
      {[...groups].reverse().map((grp) => {
        const done = grp.stages.filter((s) => s.status === 'COMPLETED').length;
        const catColor = multi ? categoryColor(grp.name) : world.color;
        return (
          <div key={grp.name} className="w-full">
            {[...grp.stages].reverse().map((s, ri) => {
              const i = grp.stages.length - 1 - ri;
              const premiumLocked = isFree && s.premium && s.status !== 'COMPLETED';
              return (
                <Node key={s.id} stage={s} color={catColor} idx={i}
                  isCurrent={s.id === currentId} completedId={completedId} premiumLocked={premiumLocked}
                  nodeRef={s.id === currentId ? currentRef : undefined}
                  onOpen={() => onOpen(s.id, s.status === 'LOCKED' && !premiumLocked, premiumLocked)} />
              );
            })}
            {multi && (
              <div className="my-5 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-pop" style={{ backgroundColor: catColor }}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/20 text-xl font-black text-white">{grp.name[0]}</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Mesa</p>
                  <h3 className="text-lg font-extrabold uppercase tracking-wide text-white">{grp.name}</h3>
                  <p className="truncate text-xs font-semibold text-white/85">{categoryDesc(grp.name)}</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-black/25 px-3 py-1 text-xs font-bold text-white">{done}/{grp.stages.length}</span>
              </div>
            )}
          </div>
        );
      })}
      <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-white/50">Início ↑</p>
    </div>
  );
}

function Node({ stage, color, idx, isCurrent, completedId, onOpen, nodeRef, premiumLocked }: {
  stage: StageSummary; color: string; idx: number; isCurrent: boolean; completedId: string | null; onOpen: () => void; nodeRef?: React.Ref<HTMLDivElement>;
  premiumLocked: boolean;
}) {
  const locked = stage.status === 'LOCKED' && !premiumLocked;
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

  // Ficha: cor da mesa; dourada quando a fase foi perfeita; cinza quando travada.
  const chipColor = completed && stage.perfect ? GOLD : color;
  const dimmed = !revealed || locked || premiumLocked;
  const fill = dimmed ? 'rgb(var(--subtle))' : chipColor;
  const edge = dimmed ? 'rgba(0,0,0,0.45)' : darken(chipColor);
  const stripes = dimmed ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.8)';

  return (
    <div ref={nodeRef} className="flex flex-col items-center" style={{ transform: `translateX(${DX[idx % DX.length]}px)` }}>
      {/* Conector: liga esta ficha à PRÓXIMA (que fica acima, com outro offset) */}
      <svg width="80" height="24" className="overflow-visible" aria-hidden>
        <line
          x1={40 + (DX[(idx + 1) % DX.length] - DX[idx % DX.length])} y1="0" x2="40" y2="24"
          stroke={completed ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'}
          strokeWidth="2.5" strokeDasharray="4 6" strokeLinecap="round"
        />
      </svg>
      {isCurrent && revealed && (
        <span title="Sua vez — jogue esta fase"
          className="relative z-10 mb-1 flex h-7 w-7 animate-float items-center justify-center rounded-full bg-white text-[13px] font-black text-black shadow-pop ring-2 ring-black/20">
          D
        </span>
      )}
      <button onClick={onOpen} disabled={locked} aria-label={stage.title} className="group relative my-1 flex items-center justify-center">
        <span
          className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full text-white shadow-[0_5px_0_0_var(--edge)] transition-[background-color,box-shadow] duration-700 group-active:translate-y-[3px]"
          style={{ backgroundColor: fill, ['--edge' as string]: edge } as React.CSSProperties}
        >
          {/* Borda listrada de ficha de poker */}
          <svg className="pointer-events-none absolute inset-0" viewBox="0 0 62 62" aria-hidden>
            <circle cx="31" cy="31" r="26.5" fill="none" stroke={stripes} strokeWidth="5" strokeDasharray="7.3 13.5" />
            <circle cx="31" cy="31" r="20.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          </svg>
          {isCurrent && revealed && <span className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: chipColor, opacity: 0.3 }} />}
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
            {premiumLocked ? <IconLock size={22} className="text-gold" />
              : locked ? <IconLock size={22} />
              : completed ? <IconCheck size={26} />
              : lesson ? <IconBook size={24} /> : <IconTarget size={24} />}
          </span>
        </span>
      </button>
    </div>
  );
}
