import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { levelProgress } from '@pokerpath/shared';
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
  const prog = levelProgress(user.totalXp);
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
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Pill value={`${user.currentStreak}🔥`} label="Streak" alert={user.streakAtRisk} />
        <Pill value={user.totalXp.toLocaleString('pt-BR')} label="XP" />
        <Pill value={accuracy != null ? `${accuracy}%` : '—'} label="Precisão" />
      </div>

      {/* Streak em risco: a única mensagem que precisa furar a tela. */}
      {user.streakAtRisk && (
        <button
          onClick={() => navigate('/worlds')}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-3.5 text-left active:scale-[0.99]"
        >
          <span className="animate-flame text-2xl">🔥</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-title">
              Seu streak de {user.currentStreak} {user.currentStreak === 1 ? 'dia' : 'dias'} acaba hoje
            </span>
            <span className="block text-xs text-subtle">Uma mão salva ele. Leva menos de um minuto.</span>
          </span>
          <span className="shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-white">Salvar</span>
        </button>
      )}
      {!user.streakAtRisk && user.streakPlayedToday && user.currentStreak > 0 && (
        <p className="mb-5 text-center text-xs font-semibold text-primary">
          🔥 Dia garantido — streak de {user.currentStreak} {user.currentStreak === 1 ? 'dia' : 'dias'}
        </p>
      )}

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
        // Sem fase pendente: NÃO pode ser um beco sem saída — quem terminou
        // tudo é justamente quem mais volta. Manda para a revisão.
        <button onClick={() => navigate('/review')} className="btn3d w-full rounded-2xl bg-primary p-5 text-left text-white">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Tudo em dia 🎉</p>
          <h2 className="mt-1 text-2xl font-extrabold">Afie o que já aprendeu</h2>
          <p className="mt-0.5 text-sm text-white/85">Revise suas mãos erradas e mantenha o streak vivo.</p>
          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-primary">
            Revisar <IconChevron size={15} />
          </span>
        </button>
      )}

      {/* Nível — com barra até o próximo; toca para ver a escada e as recompensas. */}
      <button
        onClick={() => navigate('/levels')}
        className="mt-4 w-full rounded-2xl border border-line bg-card p-4 text-left active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-subtle">Nível {user.level}</p>
            <p className="mt-0.5 text-lg font-bold text-title">{user.levelName}</p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
            {user.plan === 'PREMIUM' ? '⭐ Premium' : 'Free'}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-card2">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${prog.pct}%` }} />
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-subtle">
          {prog.next
            ? <>Faltam <b className="text-title">{prog.xpToNext.toLocaleString('pt-BR')} XP</b> para {prog.next.name}</>
            : <>Nível máximo 👑</>}
          <IconChevron size={13} className="ml-auto" />
        </p>
      </button>

      <div className="mt-4"><MissionsCard /></div>
    </div>
  );
}

function Pill({ value, label, alert }: { value: string; label: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-center ${alert ? 'border-gold/60 bg-gold/10' : 'border-line bg-card2'}`}>
      <p className={`text-base font-extrabold tabular-nums ${alert ? 'text-gold' : 'text-title'}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-subtle">{label}</p>
    </div>
  );
}
