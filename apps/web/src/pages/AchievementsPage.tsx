import { Link } from 'react-router-dom';
import { IconTrophy } from '../components/Icons.js';
import type { AchievementView } from '@pokerpath/shared';
import { useAchievements } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { AchievementBadge } from '../components/AchievementBadge.js';

/** Conquistas (PRD 9.5) — grade de troféus desbloqueados/bloqueados. */
export function AchievementsPage() {
  const { data, isLoading } = useAchievements();
  const unlocked = data?.filter((a) => a.unlocked).length ?? 0;
  const total = data?.length ?? 0;
  const pct = total ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div className="px-5 py-8">
      <Link to="/profile" className="mb-4 inline-block text-sm font-medium text-subtle">← Perfil</Link>
      <h1 className="text-3xl font-bold text-title">Conquistas</h1>

      {isLoading ? (
        <LogoLoader inline />
      ) : (
        <>
          <div className="card mt-5 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-subtle">Desbloqueadas</p>
                <p className="mt-1 text-4xl font-bold text-title">{unlocked}<span className="text-xl text-subtle">/{total}</span></p>
              </div>
              <IconTrophy size={40} className="text-gold" />
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-card2">
              <div className="h-full origin-left rounded-full bg-gold animate-grow-x" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {data?.map((a) => <Tile key={a.code} a={a} />)}
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ a }: { a: AchievementView }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-5 text-center transition-all ${
      a.unlocked ? 'border-gold/30 bg-gold/10 shadow-card' : 'border-line bg-card2'
    }`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center">
        {a.unlocked
          ? <AchievementBadge code={a.code} size={64} />
          : <AchievementBadge code={a.code} size={64} dim />}
      </div>
      <h3 className={`mt-3 text-sm font-bold ${a.unlocked ? 'text-title' : 'text-subtle'}`}>{a.name}</h3>
      <p className="mt-1 text-[11px] leading-snug text-subtle">{a.description}</p>
      {a.unlocked && a.unlockedAt && (
        <p className="mt-2 text-[10px] font-semibold text-gold">
          {new Date(a.unlockedAt).toLocaleDateString('pt-BR')}
        </p>
      )}
    </div>
  );
}
