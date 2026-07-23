import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { levelProgress } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { useEnergy, useTrail } from '../hooks/useGame.js';
import { stageGroup } from '../lib/stageGroup.js';
import { MissionsCard } from '../components/MissionsCard.js';
import { IconChevron, IconBolt, IconStar, IconCrown, IconFlame, IconSparkles } from '../components/Icons.js';

/** Home — enxuta e game-like: um CTA grande para voltar à mão, sem cards corporativos. */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: trail } = useTrail();
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
  const curWorld = trail?.find((w) => w.stages.some((s) => s.status === 'IN_PROGRESS')) ?? null;
  const curStage = curWorld?.stages.find((s) => s.status === 'IN_PROGRESS') ?? null;
  const category = curStage ? stageGroup(curStage.concept) : null;
  const pct = curWorld && curWorld.stages.length > 0 ? Math.round((curWorld.stages.filter((s) => s.status === 'COMPLETED').length / curWorld.stages.length) * 100) : 0;

  return (
    <div className="px-5 py-7">
      {/* Barra de recursos — streak e energia no lugar do nome; nível à direita.
          Energia em destaque (é o que trava/libera o jogo). */}
      <header className="mb-4 flex items-center gap-2.5">
        <StatChip iconNode={<IconFlame size={22} className={`${user.streakPlayedToday && user.currentStreak > 0 ? 'animate-flame ' : ''}text-gold`} />} value={`${user.currentStreak}`} label="ofensiva" alert={user.streakAtRisk} lit={user.streakPlayedToday && user.currentStreak > 0} />
        {energy && (
          <StatChip
            iconNode={<IconBolt size={22} />}
            value={energy.infinite ? '∞' : `${energy.remaining}`}
            label="energia"
            tone="energy"
          />
        )}
        {/* XP total (o nível já tem a barra logo abaixo — repetir o nome aqui
            era redundância). Clicável: leva à escada de níveis. */}
        <button
          onClick={() => navigate('/levels')}
          className="ml-auto flex items-center gap-1.5 rounded-2xl bg-card px-3.5 py-2.5 active:scale-95"
        >
          <IconStar size={16} className="text-gold" />
          <span className="text-base font-black tabular-nums text-title">{user.totalXp.toLocaleString('pt-BR')}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-subtle">XP</span>
        </button>
      </header>

      {/* Nível + XP fundidos: uma barra fina até o próximo nível (ocupa o lugar
          do antigo card grande + pill de XP). Toca para ver a escada. */}
      <button onClick={() => navigate('/levels')} className="mb-5 block w-full text-left active:opacity-90">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-base font-extrabold text-title">{user.levelName}</span>
          <span className="text-[11px] font-bold text-subtle">
            {prog.next ? <>{prog.xpToNext.toLocaleString('pt-BR')} XP p/ {prog.next.name}</> : <span className="flex items-center gap-1">Nível máximo <IconCrown size={13} className="text-gold" /></span>}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-card2">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${prog.pct}%` }} />
        </div>
      </button>

      {/* Streak em risco: a única mensagem que precisa furar a tela. */}
      {user.streakAtRisk && (
        <button
          onClick={() => navigate('/worlds')}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-gold/50 bg-gold/10 p-3.5 text-left active:scale-[0.99]"
        >
          <IconFlame size={26} className="animate-flame text-gold" />
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
          <IconFlame size={13} className="mr-1 inline align-[-2px] text-primary" />Dia garantido — streak de {user.currentStreak} {user.currentStreak === 1 ? 'dia' : 'dias'}
        </p>
      )}

      {/* CTA principal — voltar à mão */}
      {curWorld ? (
        <button
          onClick={() => navigate('/worlds')}
          className="btn3d w-full rounded-2xl p-5 text-left text-white"
          style={{ backgroundColor: curWorld.color }}
        >
          {/* A AÇÃO é o texto gigante ("Continuar"), não o nome do mundo — é o
              que deixa óbvio que o botão retoma o treino. O mundo/fase vira o
              rótulo pequeno em cima. */}
          <p className="text-xs font-bold uppercase tracking-widest text-white/80">{curWorld.icon} {category ?? curWorld.name}</p>
          <h2 className="mt-1 flex items-center gap-2 text-4xl font-black leading-none">
            Continuar <IconChevron size={30} className="mt-0.5" />
          </h2>
          {curStage && <p className="mt-2 truncate text-sm font-semibold text-white/85">{curStage.title}</p>}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/25">
              <div className="h-full rounded-full bg-white/90" style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-black tabular-nums" style={{ color: curWorld.color }}>
              {pct}%
            </span>
          </div>
        </button>
      ) : (
        // Sem fase pendente: NÃO pode ser um beco sem saída — quem terminou
        // tudo é justamente quem mais volta. Manda para a revisão.
        <button onClick={() => navigate('/review')} className="btn3d w-full rounded-2xl bg-primary p-5 text-left text-white">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/80">Tudo em dia <IconSparkles size={14} /></p>
          <h2 className="mt-1 flex items-center gap-2 text-4xl font-black leading-none">
            Revisar <IconChevron size={30} className="mt-0.5" />
          </h2>
          <p className="mt-2 text-sm font-semibold text-white/85">Afie suas mãos erradas e mantenha o streak vivo.</p>
        </button>
      )}

      <div className="mt-4"><MissionsCard /></div>
    </div>
  );
}

/** Chip de recurso do topo: ícone grande + número em destaque + rótulo. */
function StatChip({ icon, iconNode, value, label, alert, tone, lit }: {
  icon?: string; iconNode?: React.ReactNode; value: string; label: string;
  alert?: boolean; tone?: 'energy';
  /** Chama animada: o dia está garantido — o fogo está "aceso". */
  lit?: boolean;
}) {
  const valueColor = alert ? 'text-gold' : tone === 'energy' ? 'text-call' : 'text-title';
  // Sem outline: só um fundo suave (destaque em risco vira tom dourado no fundo).
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 ${alert ? 'bg-gold/15' : 'bg-card'}`}>
      <span className={tone === 'energy' ? 'text-call' : ''}>
        {iconNode ?? <span className={`text-xl leading-none ${lit ? 'animate-flame inline-block' : ''}`}>{icon}</span>}
      </span>
      <div className="leading-none">
        <p className={`text-2xl font-black tabular-nums ${valueColor}`}>{value}</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-subtle">{label}</p>
      </div>
    </div>
  );
}
