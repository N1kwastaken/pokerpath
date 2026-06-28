import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { WorldDetail, StageSummary } from '@pokerpath/shared';
import { useTrail } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconCheck, IconLock, IconBook, IconTarget } from '../components/Icons.js';

/** Trilha ÚNICA ascendente. Scroll suave (com blur) só ao ENTRAR na aba; ao
 *  concluir uma fase, anima o nó (cinza→cor) e o checkmark se desenhando. */
const ACCENT = '#7C5CFF';
const DX = [0, -40, -56, -40, 0, 40, 56, 40];

function darken(hex: string, f = 0.7): string {
  const m = hex.replace('#', '');
  const r = Math.round(parseInt(m.slice(0, 2), 16) * f);
  const g = Math.round(parseInt(m.slice(2, 4), 16) * f);
  const b = Math.round(parseInt(m.slice(4, 6), 16) * f);
  return `rgb(${r}, ${g}, ${b})`;
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
  const currentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const fromExercise = !!(location.state as { fromExercise?: boolean } | null)?.fromExercise;
  // lê (e limpa) a fase recém-concluída uma vez, no 1º render
  const [completedId] = useState<string | null>(() => {
    const v = localStorage.getItem('pp.justCompleted');
    if (v) localStorage.removeItem('pp.justCompleted');
    return v;
  });
  const currentId = trail?.flatMap((w) => w.stages).find((s) => s.status === 'IN_PROGRESS')?.id;

  useEffect(() => {
    if (!currentId) return;
    const t = setTimeout(() => {
      const el = currentRef.current;
      if (!el) return;
      // Scroll ANIMADO só quando troca de aba; ao voltar do exercício, posiciona sem animação.
      el.scrollIntoView({ behavior: fromExercise ? 'auto' : 'smooth', block: 'center' });
    }, 140);
    return () => clearTimeout(t);
  }, [currentId, fromExercise]);

  return (
    <div className="px-5 py-7">
      <header className="mb-2">
        <p className="text-xs text-subtle">Sua jornada</p>
        <h1 className="text-2xl font-bold text-title">Treino</h1>
      </header>

      {isLoading && <LogoLoader inline label="Carregando trilha..." />}
      {isError && <p className="text-error">Não foi possível carregar a trilha.</p>}

      {trail && (
        <div className="flex flex-col items-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-subtle">🏁 Topo · Mestre do Pré-flop</p>
          {[...trail].reverse().map((w) => (
            <div key={w.id} className="w-full">
              {[...w.stages].reverse().map((s, ri) => {
                const i = w.stages.length - 1 - ri;
                return (
                  <Node
                    key={s.id}
                    stage={s}
                    color={w.color}
                    idx={i}
                    isCurrent={s.id === currentId}
                    completedId={completedId}
                    nodeRef={s.id === currentId ? currentRef : undefined}
                    onOpen={() => { if (w.premiumLocked) return navigate('/premium'); if (s.status === 'LOCKED') return; navigate(`/stages/${s.id}`); }}
                  />
                );
              })}
              <SectionHeader world={w} />
            </div>
          ))}
          <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-subtle">Início ↑ comece aqui</p>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ world }: { world: WorldDetail }) {
  const done = world.stages.filter((s) => s.status === 'COMPLETED').length;
  return (
    <div className="my-5 flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: world.color }}>
      <span className="text-2xl">{world.icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">Seção {world.order}</p>
        <h2 className="truncate text-base font-extrabold text-white">{world.name}</h2>
      </div>
      <span className="ml-auto shrink-0 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold text-white">
        {world.premiumLocked ? '🔒 Premium' : `${done}/${world.stages.length}`}
      </span>
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
  const animateUnlock = isCurrent && !!completedId; // o próximo nó "abre" (cinza→cor)

  const [revealed, setRevealed] = useState(!animateUnlock);
  useEffect(() => {
    if (!animateUnlock) return;
    const t = setTimeout(() => setRevealed(true), 380); // depois do check do nó anterior
    return () => clearTimeout(t);
  }, [animateUnlock]);

  const colored = lesson ? ACCENT : color;
  const fill = !revealed ? 'rgb(var(--subtle))' : locked ? 'rgb(var(--subtle))' : colored;
  const edge = !revealed || locked ? 'rgba(0,0,0,0.45)' : darken(colored);

  return (
    <div ref={nodeRef} className="flex flex-col items-center" style={{ transform: `translateX(${DX[idx % DX.length]}px)` }}>
      <div className="h-6 w-1 rounded-full" style={{ backgroundColor: completed ? 'rgb(var(--primary))' : 'rgb(var(--line))' }} />
      <button onClick={onOpen} disabled={locked} aria-label={stage.title} className="group relative my-1 flex items-center justify-center">
        {isCurrent && revealed && (
          <span className="absolute -top-9 left-1/2 z-10 -translate-x-1/2">
            <span className="relative block animate-float whitespace-nowrap rounded-lg bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-pop" style={{ color }}>
              Começar
              <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-white" />
            </span>
          </span>
        )}
        <span
          className="relative flex h-[62px] w-[62px] items-center justify-center rounded-full text-white shadow-[0_5px_0_0_var(--edge)] transition-[background-color,box-shadow] duration-700 group-active:translate-y-[3px]"
          style={{ backgroundColor: fill, ['--edge' as string]: edge } as React.CSSProperties}
        >
          {isCurrent && revealed && <span className="absolute inset-0 animate-ping rounded-full" style={{ backgroundColor: color, opacity: 0.3 }} />}
          {completed && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-white">
              {justChecked ? <DrawCheck /> : <IconCheck size={12} />}
            </span>
          )}
          <span className="relative flex items-center">
            {locked ? <IconLock size={22} /> : completed ? <IconCheck size={26} /> : lesson ? <IconBook size={24} /> : <IconTarget size={24} />}
          </span>
        </span>
      </button>
    </div>
  );
}
