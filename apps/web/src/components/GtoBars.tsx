import { useState } from 'react';
import type { Frequencies, Action } from '@pokerpath/shared';

/** Frequências GTO (estilo GTO Wizard): barras + a ação que VOCÊ escolheu. */
// Mesmas cores fixas dos botões: raise roxo, call azul, fold vermelho.
const ROWS: { key: keyof Frequencies; label: string; bar: string }[] = [
  { key: 'RAISE', label: 'Raise', bar: 'bg-accent' },
  { key: 'CALL', label: 'Call', bar: 'bg-call' },
  { key: 'FOLD', label: 'Fold', bar: 'bg-error' },
  { key: 'ALLIN', label: 'All In', bar: 'bg-gold' },
];

export function GtoBars({ freq, chosen, correct, aggressor = false }: {
  /**
   * `null` = não existe chart por trás deste spot (postflop, 4-bet, squeeze).
   * Aí não renderiza nada: a explicação carrega o feedback sozinha. Preencher
   * a tela com uma frequência inventada foi o que derrubou a confiança nos
   * gráficos — sem dado, o certo é não afirmar.
   */
  freq: Frequencies | null; chosen?: Action; correct?: Action;
  /** Spot de agressor (vilão deu check): Raise vira Bet e Call vira Check. */
  aggressor?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const AGG_LABEL: Partial<Record<keyof Frequencies, string>> = { RAISE: 'Bet', CALL: 'Check' };
  if (!freq) return null;

  const rows = ROWS
    .filter((r) => (freq[r.key] ?? 0) > 0)
    .map((r) => (aggressor && AGG_LABEL[r.key] ? { ...r, label: AGG_LABEL[r.key] as string } : r));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-subtle">Estratégia GTO</p>
        <button onClick={() => setOpen((o) => !o)} className="text-[11px] font-bold text-primary">{open ? 'fechar' : '?'}</button>
      </div>

      {rows.map((r) => {
        const v = freq[r.key] ?? 0;
        const isChosen = chosen === r.key;
        const isCorrect = correct === r.key;
        return (
          <div key={r.key} className="flex items-center gap-2">
            <span className={`w-11 shrink-0 text-xs font-bold ${isCorrect ? 'text-title' : 'text-subtle'}`}>{r.label}</span>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-black/30">
              <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${v}%`, transition: 'width .25s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
            <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-title">{v}%</span>
            {isChosen && (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${isCorrect ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>você</span>
            )}
          </div>
        );
      })}

      {open && (
        <p className="pt-1 text-[11px] leading-snug text-subtle">
          Quanto cada ação aparece na estratégia ótima (no longo prazo) para esta mão e posição. Barra cheia = sempre; barras divididas = jogada mista. Treine escolhendo a de <b className="text-text">maior</b> frequência.
        </p>
      )}
    </div>
  );
}
