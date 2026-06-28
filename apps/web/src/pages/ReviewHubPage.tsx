import { useState } from 'react';
import { ReviewList } from '../components/ReviewList.js';
import { ChartsPage } from './ChartsPage.js';
import { GlossaryPage } from './GlossaryPage.js';

const TABS = [
  { k: 'erros', label: 'Erros' },
  { k: 'charts', label: 'Charts' },
  { k: 'glossario', label: 'Glossário' },
] as const;
type TabKey = typeof TABS[number]['k'];

/** Aba "Revisão": retomar erros, ver charts e o glossário — 3 páginas. */
export function ReviewHubPage() {
  const [tab, setTab] = useState<TabKey>('erros');
  return (
    <div className="px-5 py-7">
      <header className="mb-4">
        <p className="text-xs text-subtle">Estudo</p>
        <h1 className="text-2xl font-bold text-title">Revisão</h1>
      </header>

      <div className="mb-5 flex gap-1 rounded-xl border border-line bg-card2 p-1">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${tab === t.k ? 'bg-primary text-white' : 'text-subtle'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'erros' ? <ReviewList /> : tab === 'charts' ? <ChartsPage embedded /> : <GlossaryPage embedded />}
    </div>
  );
}
