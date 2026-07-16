import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { useStats, useEnergy, useTrail } from '../hooks/useGame.js';
import { stageGroup } from '../lib/stageGroup.js';
import { MissionsCard } from '../components/MissionsCard.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { IconChevron, IconBolt } from '../components/Icons.js';

/** Home — enxuta e game-like: um CTA grande para voltar à mão, sem cards corporativos. */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: trail } = useTrail();
  const { data: stats } = useStats();
  const { data: energy } = useEnergy();

  // Cadastro de quem JÁ JOGA marca a prova de nivelamento como pendente —
  // o redirect acontece aqui porque o RegisterPage é desmontado pelo guard.
  useEffect(() => {
    if (localStorage.getItem('pp.placementPending')) {
      localStorage.removeItem('pp.placementPending');
      navigate('/placement', { replace: true });
    }
  }, [navigate]);

  if (!user) return null;
  const accuracy = stats && stats.totalAnswered > 0 ? Math.round(stats.overallAccuracy * 100) : null;
  const curWorld = trail?.find((w) => w.stages.some((s) => s.status === 'IN_PROGRESS')) ?? null;
  const curStage = curWorld?.stages.find((s) => s.status === 'IN_PROGRESS') ?? null;
  const category = curStage ? stageGroup(curStage.concept) : null;
  const pct = curWorld && curWorld.stages.length > 0 ? Math.round((curWorld.stages.filter((s) => s.status === 'COMPLETED').length / curWorld.stages.length) * 100) : 0;

  return (
    <div className="px-5 py-7">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-subtle">Bom jogo,</p>
          <h1 className="text-2xl font-bold text-title">{user.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {energy && <span className="flex items-center gap-0.5 rounded-full bg-card2 px-2.5 py-1 text-xs font-bold text-call"><IconBolt size={14} />{energy.infinite ? '∞' : energy.remaining}</span>}
          <ThemeToggle />
        </div>
      </header>

      {/* Faixa de status compacta */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <Pill value={`${user.currentStreak}🔥`} label="Streak" />
        <Pill value={user.totalXp.toLocaleString('pt-BR')} label="XP" />
        <Pill value={accuracy != null ? `${accuracy}%` : '—'} label="Precisão" />
      </div>

      {/* CTA principal — voltar à mão */}
      {curWorld ? (
        <button
          onClick={() => navigate('/worlds')}
          className="btn3d w-full rounded-2xl p-5 text-left text-white"
          style={{ backgroundColor: curWorld.color }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Continuar treino</p>
          <h2 className="mt-1 text-2xl font-extrabold">{curWorld.icon} {category ?? curWorld.name}</h2>
          {curStage && <p className="mt-0.5 truncate text-sm text-white/85">{curStage.title}</p>}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/25">
              <div className="h-full rounded-full bg-white/90" style={{ width: `${pct}%` }} />
            </div>
            <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-extrabold" style={{ color: curWorld.color }}>
              Jogar <IconChevron size={15} />
            </span>
          </div>
        </button>
      ) : (
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-title">Tudo em dia 🎉</h2>
          <p className="mt-1 text-sm text-subtle">Você concluiu o conteúdo disponível.</p>
        </div>
      )}

      {/* Nível */}
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-card p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-subtle">Nível {user.level}</p>
          <p className="mt-0.5 text-lg font-bold text-title">{user.levelName}</p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
          {user.plan === 'PREMIUM' ? '⭐ Premium' : 'Free'}
        </span>
      </div>

      <div className="mt-4"><MissionsCard /></div>
    </div>
  );
}

function Pill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-card2 px-3 py-2.5 text-center">
      <p className="text-base font-extrabold tabular-nums text-title">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-subtle">{label}</p>
    </div>
  );
}
