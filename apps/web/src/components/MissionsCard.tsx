import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MissionView } from '@pokerpath/shared';
import { useMissions } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { useAuth } from '../auth/AuthContext.js';
import { sound } from '../lib/sound.js';
import { Confetti } from './Confetti.js';
import { IconCheck } from './Icons.js';

/** Missões em 2 setores, com a renovação informada sem contagem regressiva. */
export function MissionsCard() {
  const { data: missions, isLoading } = useMissions();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [celebrate, setCelebrate] = useState(0);

  // Trava o duplo-clique sem fingir que o resgate já foi confirmado.
  const [claiming, setClaiming] = useState<Set<string>>(new Set());

  const claim = useMutation({
    mutationFn: (code: string) => gameApi.claimMission(code),
    onMutate: async (code) => {
      // Sem isto, um GET /missions que já estava em voo responde DEPOIS do
      // resgate e pode disputar a reconciliação final.
      await queryClient.cancelQueries({ queryKey: ['missions'] });
      setClaiming((s) => new Set(s).add(code));
    },
    onSuccess: (res, code) => {
      if (user) setUser({ ...user, totalXp: res.totalXp, level: res.level, levelName: res.levelName });
      queryClient.setQueryData<MissionView[]>(['missions'], (old) =>
        old?.map((mission) => (mission.code === code ? { ...mission, claimed: true } : mission)),
      );
      setClaiming((current) => {
        const next = new Set(current);
        next.delete(code);
        return next;
      });
      sound.levelUp();
      setCelebrate((c) => c + 1);
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
    onError: (_err, code) => {
      setClaiming((s) => { const n = new Set(s); n.delete(code); return n; });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  if (isLoading || !missions || missions.length === 0) return null;
  const daily = missions.filter((m) => m.type === 'DAILY');
  const weekly = missions.filter((m) => m.type === 'WEEKLY');

  return (
    <section className="mt-2">
      {celebrate > 0 && <Confetti key={celebrate} count={40} />}
      {daily.length > 0 && <Group title="Diárias" renewal="Renovam no próximo dia" items={daily} claiming={claiming} onClaim={(c) => claim.mutate(c)} />}
      {weekly.length > 0 && <Group title="Semanais" renewal="Renovam na segunda" items={weekly} claiming={claiming} onClaim={(c) => claim.mutate(c)} />}
    </section>
  );
}

function Group({ title, renewal, items, claiming, onClaim }: { title: string; renewal: string; items: MissionView[]; claiming: Set<string>; onClaim: (code: string) => void }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-subtle">{title}</h2>
        <span className="rounded-md bg-black/20 px-2 py-0.5 text-[10px] font-bold text-subtle">{renewal}</span>
      </div>
      <div className="card divide-y divide-line">
        {items.map((m) => <Row key={m.code} m={m} claiming={claiming.has(m.code)} onClaim={() => onClaim(m.code)} />)}
      </div>
    </div>
  );
}

/** Selo da dificuldade — o ouro marca a difícil, que é o alvo do dia. */
function Level({ d }: { d: MissionView['difficulty'] }) {
  const style = {
    EASY: { label: 'Fácil', cls: 'bg-card2 text-subtle' },
    MEDIUM: { label: 'Média', cls: 'bg-primary/15 text-primary' },
    HARD: { label: 'Difícil', cls: 'bg-gold/15 text-gold' },
  }[d] ?? { label: '', cls: '' };
  if (!style.label) return null;
  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.cls}`}>
      {style.label}
    </span>
  );
}

function Row({ m, onClaim, claiming }: { m: MissionView; onClaim: () => void; claiming: boolean }) {
  const pct = m.target ? Math.round((m.progress / m.target) * 100) : 0;
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-title">{m.title}</h3>
            <Level d={m.difficulty} />
          </div>
          <p className="mt-0.5 text-xs text-subtle">{m.progress}/{m.target} · +{m.xpReward} XP</p>
        </div>
        {m.claimed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
            <IconCheck size={14} /> Resgatado
          </span>
        ) : claiming ? (
          <span className="shrink-0 rounded-full bg-card2 px-3 py-1.5 text-xs font-bold text-subtle">
            Confirmando…
          </span>
        ) : m.completed ? (
          <button onClick={onClaim} className="shrink-0 rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-black active:scale-95">
            Resgatar +{m.xpReward}
          </button>
        ) : null}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/25">
        <div className={`h-full rounded-full transition-all ${m.completed ? 'bg-gold' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
