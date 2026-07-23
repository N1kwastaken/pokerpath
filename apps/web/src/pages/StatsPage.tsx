import type { CategoryStat } from '@pokerpath/shared';
import { IconChart, IconFlame, IconTarget } from '../components/Icons.js';
import { useStats } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';

/** Stats — desempenho por categoria (estilo Preflop Wizard). */
export function StatsPage() {
  const { data, isLoading } = useStats();

  const cats = (data?.byCategory ?? []).filter((c) => c.total > 0);

  return (
    <div className="px-5 py-8">
      <header className="mb-6">
        <p className="text-sm text-subtle">Seu progresso</p>
        <h1 className="text-3xl font-bold text-title">Estatísticas</h1>
      </header>

      {isLoading ? (
        <div className="card"><LogoLoader inline /></div>
      ) : !data || data.totalAnswered === 0 ? (
        <div className="card p-8 text-center">
          <IconChart size={30} className="mx-auto text-subtle" />
          <p className="mt-2 font-semibold text-title">Ainda sem dados</p>
          <p className="mt-1 text-sm text-subtle">Responda alguns exercícios para ver sua precisão por categoria.</p>
        </div>
      ) : (
        <>
          {/* Accuracy geral */}
          <div className="card mb-5 p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-subtle">Accuracy geral</p>
                <p className="mt-1 text-5xl font-bold text-title">{Math.round(data.overallAccuracy * 100)}%</p>
              </div>
              <p className="text-sm text-subtle">{data.totalCorrect}/{data.totalAnswered} acertos</p>
            </div>
            <Bar value={data.overallAccuracy} />
          </div>

          {/* Recordes — dão o que perseguir (ofensiva de dias e combo de acertos). */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Record iconNode={<IconFlame size={22} className="text-gold" />} value={data.maxDayStreak} label="Maior ofensiva" unit={data.maxDayStreak === 1 ? 'dia' : 'dias'} />
            <Record iconNode={<IconTarget size={22} className="text-primary" />} value={data.bestAnswerStreak} label="Melhor sequência" unit="acertos" />
          </div>

          {/* Por categoria */}
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-subtle">Por categoria</h2>
          <div className="card divide-y divide-line">
            {cats.map((c) => <CategoryRow key={c.category} stat={c} />)}
          </div>
        </>
      )}
    </div>
  );
}

function Record({ iconNode, value, label, unit }: { iconNode: React.ReactNode; value: number; label: string; unit: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="text-3xl leading-none">{iconNode}</span>
      <div className="min-w-0">
        <p className="text-2xl font-black tabular-nums text-title">{value} <span className="text-sm font-bold text-subtle">{unit}</span></p>
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-subtle">{label}</p>
      </div>
    </div>
  );
}

function CategoryRow({ stat }: { stat: CategoryStat }) {
  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-title">{stat.label}</span>
        <span className="text-sm font-bold text-text">{Math.round(stat.accuracy * 100)}%</span>
      </div>
      <Bar value={stat.accuracy} />
      <p className="mt-1.5 text-[11px] text-subtle">{stat.correct}/{stat.total} exercícios</p>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-gold' : 'bg-error';
  return (
    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-card2">
      <div
        className={`h-full origin-left rounded-full ${color} animate-grow-x`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
