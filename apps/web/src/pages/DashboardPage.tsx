import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { useWorlds, useStats } from '../hooks/useGame.js';
import { MissionsCard } from '../components/MissionsCard.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { IconFlame, IconBolt, IconChart, IconGrid, IconChevron } from '../components/Icons.js';

/** Dashboard (PRD 4.2) — home tab, estilo Preflop Wizard. */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: worlds } = useWorlds();
  const { data: stats } = useStats();

  if (!user) return null;
  const current = worlds?.find((w) => !w.locked && !w.premiumLocked && w.completedStages < w.totalStages) ?? null;
  const accuracy = stats ? Math.round(stats.overallAccuracy * 100) : null;

  return (
    <div className="px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-subtle">Olá,</p>
          <h1 className="text-3xl font-bold text-title">{user.name}</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Continue training */}
      {current ? (
        <button
          onClick={() => navigate(`/worlds/${current.id}`)}
          className="relative w-full overflow-hidden rounded-3xl bg-primary p-6 text-left text-white shadow-pop active:scale-[0.99]"
        >
          <div className="pointer-events-none absolute inset-0 shimmer opacity-40" />
          <p className="relative text-sm opacity-90">Continue treinando</p>
          <h2 className="relative mt-1 text-2xl font-bold">{current.icon} {current.name}</h2>
          <div className="relative mt-4 flex items-center justify-between">
            <span className="text-sm opacity-90">{current.completedStages}/{current.totalStages} fases</span>
            <span className="flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-primary">
              Treinar <IconChevron size={16} />
            </span>
          </div>
        </button>
      ) : (
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-title">Tudo em dia! 🎉</h2>
          <p className="mt-1 text-sm text-subtle">Você concluiu o conteúdo disponível.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard icon={<IconFlame size={20} className="text-gold" />} value={`${user.currentStreak}`} label="Streak" />
        <StatCard icon={<IconBolt size={20} className="text-primary" />} value={user.totalXp.toLocaleString('pt-BR')} label="XP" />
        <StatCard icon={<IconChart size={20} className="text-success" />} value={accuracy != null ? `${accuracy}%` : '—'} label="Accuracy" />
      </div>

      {/* Nível */}
      <div className="card mt-4 flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-subtle">Nível {user.level}</p>
          <p className="mt-0.5 text-lg font-bold text-title">{user.levelName}</p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
          {user.plan === 'PREMIUM' ? '⭐ Premium' : 'Free'}
        </span>
      </div>

      {/* Atalhos */}
      <MissionsCard />

      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-subtle">Estudo</h2>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/charts" className="card flex items-center gap-3 p-4 active:scale-[0.98]">
          <IconGrid size={22} className="text-primary" />
          <span className="font-semibold text-title">Charts</span>
        </Link>
        <Link to="/stats" className="card flex items-center gap-3 p-4 active:scale-[0.98]">
          <IconChart size={22} className="text-primary" />
          <span className="font-semibold text-title">Stats</span>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="card p-4">
      {icon}
      <p className="mt-2 text-xl font-bold text-title">{value}</p>
      <p className="text-[11px] text-subtle">{label}</p>
    </div>
  );
}
