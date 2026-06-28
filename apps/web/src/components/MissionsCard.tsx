import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MissionView } from '@pokerpath/shared';
import { useMissions } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { useAuth } from '../auth/AuthContext.js';
import { sound } from '../lib/sound.js';
import { Confetti } from './Confetti.js';
import { IconCheck, IconBolt } from './Icons.js';

/** Card de missões diárias/semanais com progresso e resgate de XP (PRD 9.4). */
export function MissionsCard() {
  const { data: missions, isLoading } = useMissions();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [celebrate, setCelebrate] = useState(0);

  const claim = useMutation({
    mutationFn: (code: string) => gameApi.claimMission(code),
    onSuccess: (res) => {
      sound.levelUp();
      setCelebrate((c) => c + 1);
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  if (isLoading || !missions || missions.length === 0) return null;

  return (
    <section className="mt-6">
      {celebrate > 0 && <Confetti key={celebrate} count={40} />}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-subtle">Missões</h2>
        <IconBolt size={15} className="text-gold" />
      </div>
      <div className="card divide-y divide-line">
        {missions.map((m) => (
          <Row key={m.code} m={m} pending={claim.isPending} onClaim={() => claim.mutate(m.code)} />
        ))}
      </div>
    </section>
  );
}

function Row({ m, onClaim, pending }: { m: MissionView; onClaim: () => void; pending: boolean }) {
  const pct = m.target ? Math.round((m.progress / m.target) * 100) : 0;
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{m.type === 'DAILY' ? '☀️' : '🗓️'}</span>
            <h3 className="truncate font-semibold text-title">{m.title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-subtle">{m.progress}/{m.target} · +{m.xpReward} XP</p>
        </div>
        {m.claimed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-3 py-1.5 text-xs font-bold text-success">
            <IconCheck size={14} /> Resgatado
          </span>
        ) : m.completed ? (
          <button onClick={onClaim} disabled={pending}
            className="shrink-0 rounded-full bg-gradient-to-b from-gold to-gold/80 px-4 py-1.5 text-xs font-bold text-white shadow-glow-gold active:scale-95">
            Resgatar +{m.xpReward}
          </button>
        ) : null}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-card2">
        <div className={`h-full rounded-full transition-all ${m.completed ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
