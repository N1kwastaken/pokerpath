import { Link } from 'react-router-dom';
import type { AchievementView } from '@pokerpath/shared';
import { useAchievements } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconLock } from '../components/Icons.js';

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
              <span className="text-4xl">🏆</span>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-card2">
              <div className="h-full origin-left rounded-full bg-gradient-to-r from-gold to-primary animate-grow-x" style={{ width: `${pct}%` }} />
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
      a.unlocked ? 'border-gold/30 bg-gradient-to-b from-gold/10 to-transparent shadow-card' : 'border-line bg-card2'
    }`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
        a.unlocked ? 'bg-gradient-to-br from-gold to-primary shadow-glow-gold' : 'bg-card grayscale'
      }`}>
        {a.unlocked ? a.icon : <IconLock size={26} className="text-subtle" />}
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
