import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MilestoneView } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import {
  useAchievements,
  useEconomy,
  useEnergy,
  useMilestones,
  useMissions,
  useWorldRewards,
} from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { sound } from '../lib/sound.js';
import { MissionsCard } from '../components/MissionsCard.js';
import { Confetti } from '../components/Confetti.js';
import {
  IconBolt,
  IconCheck,
  IconChevron,
  IconGift,
  IconLadder,
  IconSparkles,
  IconStar,
  IconTrophy,
  IconUser,
} from '../components/Icons.js';

/**
 * Uma porta única para todas as recompensas do PokerPath.
 *
 * A central não inventa um saldo paralelo: XP, fichas, marcos, missões e
 * cosméticos continuam vindo das mesmas fontes determinísticas do servidor.
 */
export function RewardsPage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: missions } = useMissions();
  const { data: milestones } = useMilestones();
  const { data: economy } = useEconomy();
  const { data: energy } = useEnergy();
  const { data: achievements } = useAchievements();
  const { data: worldRewards } = useWorldRewards();
  const [celebrate, setCelebrate] = useState(0);
  const [claiming, setClaiming] = useState<Set<string>>(new Set());

  const claimMilestone = useMutation({
    mutationFn: (code: string) => gameApi.claimMilestone(code),
    onMutate: async (code) => {
      await queryClient.cancelQueries({ queryKey: ['milestones'] });
      setClaiming((current) => new Set(current).add(code));
    },
    onSuccess: (result, code) => {
      if (user) {
        setUser({
          ...user,
          totalXp: result.totalXp,
          level: result.level,
          levelName: result.levelName,
        });
      }
      queryClient.setQueryData<MilestoneView[]>(['milestones'], (current) =>
        current?.map((milestone) => (
          milestone.code === code ? { ...milestone, claimed: true } : milestone
        )),
      );
      setClaiming((current) => {
        const next = new Set(current);
        next.delete(code);
        return next;
      });
      sound.levelUp();
      setCelebrate((count) => count + 1);
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
    onError: (_error, code) => {
      setClaiming((current) => {
        const next = new Set(current);
        next.delete(code);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  if (!user) return null;

  const readyMissions = missions?.filter((mission) => mission.completed && !mission.claimed).length ?? 0;
  const readyMilestones = milestones?.filter((milestone) => milestone.reached && !milestone.claimed) ?? [];
  const readyCount = readyMissions + readyMilestones.length;
  const claimedMilestones = milestones?.filter((milestone) => milestone.claimed).length ?? 0;
  const unlockedAchievements = achievements?.filter((achievement) => achievement.unlocked).length ?? 0;
  const unlockedItems = economy?.items.filter((item) => item.unlocked).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
      {celebrate > 0 && <Confetti key={celebrate} count={55} />}
      <Link to="/" className="text-sm font-semibold text-subtle">← Início</Link>

      <header className="hero-surface surface-grid mt-4 overflow-hidden p-5">
        <div className="relative flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-pop">
            <IconGift size={30} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">Sua evolução</p>
            <h1 className="mt-1 text-3xl font-black leading-none text-white">Recompensas</h1>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              Tudo que você conquista treinando, sem sorteio ou compra escondida.
            </p>
          </div>
          {readyCount > 0 && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-black text-black">
              {readyCount} {readyCount === 1 ? 'pronta' : 'prontas'}
            </span>
          )}
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <Resource value={user.totalXp.toLocaleString('pt-BR')} label="XP" icon={<IconStar size={14} />} />
          <Resource value={`${economy?.coins ?? 0}`} label="fichas" icon={<IconSparkles size={14} />} />
          <Resource
            value={energy?.infinite ? '∞' : `${energy?.remaining ?? 0}/${energy?.max ?? economy?.energyCap ?? 10}`}
            label="energia"
            icon={<IconBolt size={14} />}
          />
        </div>
      </header>

      {readyMilestones.length > 0 && (
        <section className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-black uppercase tracking-wide text-subtle">Pronto para resgatar</h2>
            <Link to="/milestones" className="text-xs font-bold text-primary">Ver todos</Link>
          </div>
          <div className="card divide-y divide-line">
            {readyMilestones.map((milestone) => {
              const isClaiming = claiming.has(milestone.code);
              return (
                <div key={milestone.code} className="flex items-center gap-3 p-4">
                  <span className="text-2xl" aria-hidden>{milestone.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-title">{milestone.title}</span>
                    <span className="block text-xs font-semibold text-primary">+{milestone.xpReward} XP</span>
                  </span>
                  {milestone.claimed ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
                      <IconCheck size={13} /> Resgatado
                    </span>
                  ) : isClaiming ? (
                    <span className="rounded-full bg-card2 px-3 py-1.5 text-xs font-bold text-subtle">
                      Confirmando…
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => claimMilestone.mutate(milestone.code)}
                      disabled={claimMilestone.isPending}
                      className="rounded-full bg-gold px-3.5 py-1.5 text-xs font-black text-black active:scale-95 disabled:opacity-50"
                    >
                      Resgatar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {claimMilestone.isError && (
            <p className="mt-2 rounded-xl bg-error/10 p-3 text-xs font-semibold text-error" role="alert">
              Não foi possível resgatar agora. Atualizamos seus marcos para você tentar novamente.
            </p>
          )}
        </section>
      )}

      <section className="mt-6">
        <div className="mb-2">
          <h2 className="text-sm font-black uppercase tracking-wide text-subtle">Missões</h2>
          <p className="mt-0.5 text-xs text-subtle">Objetivos claros para orientar o treino de hoje e da semana.</p>
        </div>
        <MissionsCard />
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-subtle">Seus caminhos</h2>
        <div className="grid grid-cols-2 gap-3">
          <RewardPath
            to="/loadout"
            icon={<IconBolt size={23} />}
            title="Fichas e itens"
            detail={`${economy?.coins ?? 0} fichas · ${unlockedItems}/${economy?.items.length ?? 0} itens`}
            tone="call"
          />
          <RewardPath
            to="/milestones"
            icon={<IconLadder size={23} />}
            title="Marcos"
            detail={`${claimedMilestones}/${milestones?.length ?? 0} resgatados`}
          />
          <RewardPath
            to="/achievements"
            icon={<IconTrophy size={23} />}
            title="Conquistas"
            detail={`${unlockedAchievements}/${achievements?.length ?? 0} desbloqueadas`}
            tone="gold"
          />
          <RewardPath
            to="/profile#collection"
            icon={<IconUser size={23} />}
            title="Coleção"
            detail={`${worldRewards?.length ?? 0} aros de mundo`}
          />
        </div>
      </section>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-subtle">
        Fase perfeita rende fichas uma única vez. Missões e marcos rendem XP.
        Fechar mundos libera itens cosméticos.
      </p>
    </div>
  );
}

function Resource({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-black/20 px-2 py-2.5 text-center">
      <p className="flex items-center justify-center gap-1 text-base font-black tabular-nums text-white">
        {icon}{value}
      </p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-white/65">{label}</p>
    </div>
  );
}

function RewardPath({ to, icon, title, detail, tone = 'primary' }: {
  to: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone?: 'primary' | 'call' | 'gold';
}) {
  const toneClass = tone === 'call'
    ? 'bg-call/12 text-call'
    : tone === 'gold'
      ? 'bg-gold/12 text-gold'
      : 'bg-primary/12 text-primary';
  return (
    <Link to={to} className="card flex min-h-32 flex-col p-4 active:scale-[0.98]">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>{icon}</span>
      <span className="mt-3 flex items-center justify-between gap-1 text-sm font-black text-title">
        {title}<IconChevron size={15} className="shrink-0 text-subtle" />
      </span>
      <span className="mt-1 text-[11px] leading-snug text-subtle">{detail}</span>
    </Link>
  );
}
