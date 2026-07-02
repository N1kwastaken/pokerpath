import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MissionView } from '@pokerpath/shared';
import { useMissions } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { useAuth } from '../auth/AuthContext.js';
import { sound } from '../lib/sound.js';
import { Confetti } from './Confetti.js';
import { IconCheck } from './Icons.js';

const p2 = (n: number) => String(n).padStart(2, '0');
function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
}
function nextMidnight(): number { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); }
function nextMonday(): number { const d = new Date(); d.setHours(0, 0, 0, 0); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() + (7 - dow)); return d.getTime(); }

/** Missões em 2 setores (Diárias/Semanais) com timer até a próxima troca. */
export function MissionsCard() {
  const { data: missions, isLoading } = useMissions();
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [celebrate, setCelebrate] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

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
  const daily = missions.filter((m) => m.type === 'DAILY');
  const weekly = missions.filter((m) => m.type === 'WEEKLY');
  const dailyLeft = fmt(nextMidnight() - now);
  const wms = nextMonday() - now;
  const weeklyLeft = wms > 86_400_000 ? `${Math.ceil(wms / 86_400_000)}d` : fmt(wms);

  return (
    <section className="mt-2">
      {celebrate > 0 && <Confetti key={celebrate} count={40} />}
      {daily.length > 0 && <Group title="Diárias" timer={dailyLeft} items={daily} pending={claim.isPending} onClaim={(c) => claim.mutate(c)} />}
      {weekly.length > 0 && <Group title="Semanais" timer={weeklyLeft} items={weekly} pending={claim.isPending} onClaim={(c) => claim.mutate(c)} />}
    </section>
  );
}

function Group({ title, timer, items, pending, onClaim }: { title: string; timer: string; items: MissionView[]; pending: boolean; onClaim: (code: string) => void }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-subtle">{title}</h2>
        <span className="rounded-md bg-black/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-subtle">⏳ {timer}</span>
      </div>
      <div className="card divide-y divide-line">
        {items.map((m) => <Row key={m.code} m={m} pending={pending} onClaim={() => onClaim(m.code)} />)}
      </div>
    </div>
  );
}

function Row({ m, onClaim, pending }: { m: MissionView; onClaim: () => void; pending: boolean }) {
  const pct = m.target ? Math.round((m.progress / m.target) * 100) : 0;
  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-title">{m.title}</h3>
          <p className="mt-0.5 text-xs text-subtle">{m.progress}/{m.target} · +{m.xpReward} XP</p>
        </div>
        {m.claimed ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
            <IconCheck size={14} /> Resgatado
          </span>
        ) : m.completed ? (
          <button onClick={onClaim} disabled={pending} className="shrink-0 rounded-full bg-gold px-4 py-1.5 text-xs font-bold text-black active:scale-95">
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
