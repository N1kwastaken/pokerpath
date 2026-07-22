import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MILESTONE_TRACK_LABELS, type MilestoneTrack, type MilestoneView } from '@pokerpath/shared';
import { useMilestones } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { useAuth } from '../auth/AuthContext.js';
import { sound } from '../lib/sound.js';
import { Confetti } from '../components/Confetti.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconCheck, IconBolt } from '../components/Icons.js';

/**
 * Marcos — a escada de progresso, agrupada por trilha.
 *
 * Diferente de /achievements (feitos avulsos que aparecem de surpresa), aqui a
 * pessoa VÊ o próximo degrau e a que distância ele está. É a tela que responde
 * "estou indo bem?" sem precisar de número solto na dashboard.
 */
const ORDER: MilestoneTrack[] = ['STAGES', 'CORRECT', 'STREAK', 'PERFECT'];

export function MilestonesPage() {
  const { data: milestones, isLoading } = useMilestones();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [celebrate, setCelebrate] = useState(0);
  const [claiming, setClaiming] = useState<Set<string>>(new Set());

  const claim = useMutation({
    mutationFn: (code: string) => gameApi.claimMilestone(code),
    onMutate: async (code) => {
      // Mesmo cuidado das missões: sem cancelar o que está em voo, um GET que
      // já saiu responde depois e faz o botão "Resgatar" reaparecer.
      await queryClient.cancelQueries({ queryKey: ['milestones'] });
      setClaiming((s) => new Set(s).add(code));
      sound.levelUp();
      setCelebrate((c) => c + 1);
      const previous = queryClient.getQueryData<MilestoneView[]>(['milestones']);
      queryClient.setQueryData<MilestoneView[]>(['milestones'], (old) =>
        old?.map((m) => (m.code === code ? { ...m, claimed: true } : m)),
      );
      return { previous };
    },
    onSuccess: (res) => {
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
      if (res.energyGained > 0) queryClient.invalidateQueries({ queryKey: ['energy'] });
    },
    onError: (_e, code, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['milestones'], ctx.previous);
      setClaiming((s) => { const n = new Set(s); n.delete(code); return n; });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });

  if (isLoading) return <LogoLoader label="Carregando seus marcos..." />;
  if (!milestones) return null;

  const done = milestones.filter((m) => m.reached).length;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
      {celebrate > 0 && <Confetti key={celebrate} count={60} />}

      <header className="mb-5">
        <h1 className="text-2xl font-black text-title">Marcos</h1>
        <p className="mt-1 text-sm text-subtle">
          {done} de {milestones.length} alcançados. Cada degrau paga XP — e a maioria devolve energia.
        </p>
      </header>

      <div className="space-y-6">
        {ORDER.map((track) => {
          const items = milestones.filter((m) => m.track === track);
          if (items.length === 0) return null;
          return (
            <section key={track}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">
                {MILESTONE_TRACK_LABELS[track]}
              </h2>
              <div className="card divide-y divide-line">
                {items.map((m) => (
                  <Row
                    key={m.code}
                    m={m}
                    claimed={m.claimed || claiming.has(m.code)}
                    onClaim={() => claim.mutate(m.code)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Row({ m, claimed, onClaim }: { m: MilestoneView; claimed: boolean; onClaim: () => void }) {
  const pct = Math.round((m.progress / m.target) * 100);
  return (
    <div className={`p-4 ${m.reached ? '' : 'opacity-90'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className={`text-2xl ${m.reached ? '' : 'grayscale'}`} aria-hidden>{m.icon}</span>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-title">{m.title}</h3>
            <p className="mt-0.5 text-xs text-subtle">{m.description}</p>
            <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-subtle">
              <span className="text-primary">+{m.xpReward} XP</span>
              {m.energyReward > 0 && (
                <span className="flex items-center gap-0.5 text-call">
                  <IconBolt size={12} />+{m.energyReward}
                </span>
              )}
            </p>
          </div>
        </div>
        {claimed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
            <IconCheck size={14} /> Resgatado
          </span>
        ) : m.reached ? (
          <button onClick={onClaim} className="shrink-0 rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-black active:scale-95">
            Resgatar
          </button>
        ) : (
          <span className="shrink-0 text-xs font-bold tabular-nums text-subtle">
            {m.progress}/{m.target}
          </span>
        )}
      </div>
      {!m.reached && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/25">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
