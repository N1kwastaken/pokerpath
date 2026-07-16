import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GAME_TYPES, TABLE_SIZES, STACK_OPTIONS, POSITIONS } from '@pokerpath/shared';
import { useRange } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { CELL_BG, cellBackground, cellTitle } from '../components/RangeGridView.js';

/** Charts — grid 13x13 de ranges (estilo Preflop Wizard) com filtros. */
const GAME_LABEL: Record<string, string> = { CASH: 'Cash', TOURNAMENT: 'Torneio' };
const SIZE_LABEL: Record<string, string> = { SIX_MAX: '6-max', NINE_MAX: '9-max' };

/** Posições com chart em cada tipo de jogada; no 3-bet, contra quais opens. */
const RFI_POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB'];
const VS_MATRIX: Record<string, string[]> = {
  BTN: ['UTG', 'MP', 'CO'],
  SB: ['CO', 'BTN'],
  BB: ['UTG', 'MP', 'CO', 'BTN', 'SB'],
};

export function ChartsPage({ embedded = false }: { embedded?: boolean }) {
  const [gameType, setGameType] = useState<string>('CASH');
  const [tableSize, setTableSize] = useState<string>('SIX_MAX');
  const [stack, setStack] = useState<number>(100);
  const [mode, setMode] = useState<'RFI' | 'VS'>('RFI');
  const [position, setPosition] = useState<string>('BTN');
  const [villain, setVillain] = useState<string>('CO');
  const [help, setHelp] = useState<boolean>(false);

  function pickMode(m: 'RFI' | 'VS') {
    setMode(m);
    if (m === 'VS') {
      const pos = VS_MATRIX[position] ? position : 'BTN';
      setPosition(pos);
      if (!VS_MATRIX[pos].includes(villain)) setVillain(VS_MATRIX[pos][VS_MATRIX[pos].length - 1]);
    } else if (!RFI_POSITIONS.includes(position)) {
      setPosition('BTN');
    }
  }
  function pickPosition(p: string) {
    setPosition(p);
    if (mode === 'VS' && !VS_MATRIX[p]?.includes(villain)) setVillain(VS_MATRIX[p]?.[VS_MATRIX[p].length - 1] ?? 'CO');
  }

  const { data: range, isLoading } = useRange({
    gameType, tableSize, stack, position,
    scenario: mode === 'VS' ? `VS_${villain}` : 'RFI',
  });

  return (
    <div className={embedded ? '' : 'px-5 py-8'}>
      {!embedded && (
        <header className="mb-4">
          <p className="text-sm text-subtle">Estudo</p>
          <h1 className="text-3xl font-bold text-title">Charts</h1>
        </header>
      )}

      <button
        onClick={() => setHelp((h) => !h)}
        className="mb-3 flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 text-left active:scale-[0.99]"
      >
        <span className="font-semibold text-title">Como ler o chart</span>
        <span className="text-subtle">{help ? '▲' : '▼'}</span>
      </button>
      {help && (
        <div className="mb-4 space-y-3 rounded-2xl border border-line bg-card2 p-4 text-sm text-text">
          <p>Cada quadradinho é uma <b>mão inicial</b> (suas 2 cartas). São 169 combinações possíveis no Hold'em.</p>
          <p>
            A <b>diagonal</b> são os pares (AA, KK, …). <b>Acima</b> dela ficam as mãos do mesmo naipe
            (<i>suited</i>, ex.: AKs). <b>Abaixo</b>, as de naipes diferentes (<i>offsuit</i>, ex.: AKo).
          </p>
          <p>
            A cor diz a ação recomendada. Em <b>Abertura</b> (RFI): você é o primeiro a entrar no pote.
            Em <b>3-Bet / Defesa</b>: alguém abriu antes — relançar (raise), pagar (call) ou desistir (fold).
          </p>
          <div className="flex flex-wrap gap-3">
            <Legend bg={CELL_BG.RAISE} label="Raise" />
            <Legend bg={CELL_BG.CALL} label="Call" />
            <Legend bg={CELL_BG.FOLD} border label="Fold" />
            <Legend bg={`linear-gradient(135deg, ${CELL_BG.RAISE} 0%, ${CELL_BG.RAISE} 65%, ${CELL_BG.FOLD} 65%, ${CELL_BG.FOLD} 100%)`} border label="Mista (na proporção)" />
          </div>
          <p className="text-subtle">
            Célula <b>dividida</b> = mão de fronteira: jogada mista — a área de cada cor é a frequência de cada ação.
          </p>
          <p className="text-subtle">
            Os <b>filtros</b> mudam o cenário: tipo de jogo, tamanho da mesa, seu <i>stack</i> (fichas, em BB) e sua{' '}
            <b>posição</b>. Quanto mais tarde a posição (BTN), maior o range.
          </p>
          <Link to="/glossary" className="inline-block font-semibold text-primary">Ver glossário de termos →</Link>
        </div>
      )}

      <FilterCard title="Tipo de jogo">
        {GAME_TYPES.map((g) => <Chip key={g} on={gameType === g} disabled={g !== 'CASH'} onClick={() => setGameType(g)}>{GAME_LABEL[g]}</Chip>)}
      </FilterCard>
      <FilterCard title="Mesa">
        {TABLE_SIZES.map((t) => <Chip key={t} on={tableSize === t} disabled={t !== 'SIX_MAX'} onClick={() => setTableSize(t)}>{SIZE_LABEL[t]}</Chip>)}
      </FilterCard>
      <FilterCard title="Stack (BB)">
        {STACK_OPTIONS.map((sv) => <Chip key={sv} on={stack === sv} disabled={sv !== 100} onClick={() => setStack(sv)}>{sv}</Chip>)}
      </FilterCard>
      <FilterCard title="Jogada">
        <Chip on={mode === 'RFI'} onClick={() => pickMode('RFI')}>Abertura</Chip>
        <Chip on={mode === 'VS'} onClick={() => pickMode('VS')}>3-Bet / Defesa</Chip>
      </FilterCard>
      <FilterCard title="Sua posição">
        {POSITIONS.map((p) => {
          const ok = mode === 'RFI' ? RFI_POSITIONS.includes(p) : !!VS_MATRIX[p];
          return <Chip key={p} on={position === p} disabled={!ok} onClick={() => pickPosition(p)}>{p}</Chip>;
        })}
      </FilterCard>
      {mode === 'VS' && (
        <FilterCard title="Contra o open de">
          {POSITIONS.map((p) => {
            const ok = VS_MATRIX[position]?.includes(p) ?? false;
            return <Chip key={p} on={villain === p} disabled={!ok} onClick={() => setVillain(p)}>{p}</Chip>;
          })}
        </FilterCard>
      )}

      {mode === 'RFI' && (
        <p className="mb-1 rounded-xl bg-card2 p-3 text-xs text-subtle">
          Na <b>abertura</b> você é o primeiro a entrar no pote: não existe <b>call</b> — só <b>raise</b> ou <b>fold</b>.
          Para ver quando <b>pagar</b>, escolha <b>3-Bet / Defesa</b> acima.
        </p>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="card"><LogoLoader inline /></div>
        ) : range && range.cells.length ? (
          <div className="card p-3">
            <p className="mb-3 px-1 text-sm font-bold text-title">{range.label}</p>
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
              {range.cells.flatMap((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    style={{ background: cellBackground(cell) }}
                    className={`flex aspect-square items-center justify-center rounded-[3px] text-[7px] font-bold leading-none sm:text-[9px] ${cell.action === 'FOLD' && !cell.mix ? 'text-subtle' : 'text-white'}`}
                    title={cellTitle(cell)}
                  >
                    {cell.hand}
                  </div>
                )),
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 px-1">
              <Legend bg={CELL_BG.RAISE} label="Raise" />
              <Legend bg={CELL_BG.CALL} label="Call" />
              <Legend bg={CELL_BG.FOLD} border label="Fold" />
              <Legend bg={`linear-gradient(135deg, ${CELL_BG.RAISE} 0%, ${CELL_BG.RAISE} 65%, ${CELL_BG.FOLD} 65%, ${CELL_BG.FOLD} 100%)`} border label="Mista (proporção)" />
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-3xl">🗂️</p>
            <p className="mt-2 font-semibold text-title">Sem dados para esse filtro</p>
            <p className="mt-1 text-sm text-subtle">
              Por enquanto temos Cash · 6-max · 100BB: abertura de UTG/MP/CO/BTN/SB e defesa do BTN (vs UTG/MP/CO) e do BB (vs BTN).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-3">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
function Chip({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      className={`chip px-3.5 py-2 text-sm ${disabled ? 'cursor-not-allowed border-line bg-card2 text-subtle opacity-40' : on ? 'chip-on' : 'chip-off'}`}>
      {children}
    </button>
  );
}
function Legend({ bg, label, border }: { bg: string; label: string; border?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${border ? 'border border-line' : ''}`} style={{ background: bg }} />
      <span className="text-xs font-medium text-text">{label}</span>
    </div>
  );
}
