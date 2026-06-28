import { useState } from 'react';
import type { Frequencies } from '@pokerpath/shared';

/** Barras de frequência GTO (estilo Preflop Wizard) — animadas, com explicação. */
const ROWS: { key: keyof Frequencies; label: string; color: string }[] = [
  { key: 'RAISE', label: 'Raise', color: 'bg-success' },
  { key: 'CALL', label: 'Call', color: 'bg-call' },
  { key: 'FOLD', label: 'Fold', color: 'bg-subtle' },
  { key: 'ALLIN', label: 'All In', color: 'bg-danger' },
];

export function GtoBars({ freq }: { freq: Frequencies }) {
  const [open, setOpen] = useState(false);
  const rows = ROWS.filter((r) => (freq[r.key] ?? 0) > 0);
  const mixed = rows.length > 1;
  const top = rows.reduce((a, b) => ((freq[b.key] ?? 0) > (freq[a.key] ?? 0) ? b : a), rows[0]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-subtle">Frequência GTO</p>
        <button onClick={() => setOpen((o) => !o)} className="text-xs font-bold text-primary">
          {open ? 'Fechar' : 'O que é isso?'}
        </button>
      </div>

      {rows.map((r) => {
        const v = freq[r.key] ?? 0;
        return (
          <div key={r.key} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-sm font-semibold text-text">{r.label}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card2">
              <div
                className={`h-full rounded-full ${r.color}`}
                style={{ width: `${v}%`, transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)' }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-bold text-title">{v}%</span>
          </div>
        );
      })}

      {/* Resumo automático em linguagem simples */}
      <p className="pt-1 text-xs text-text">
        {mixed ? (
          <>Estratégia <b>mista</b>: o ideal é fazer <b>{top.label}</b> na maioria das vezes ({freq[top.key]}%) e variar o resto para ficar imprevisível. Aqui, a resposta certa é a de <b>maior</b> frequência.</>
        ) : (
          <>Estratégia <b>pura</b>: nesta mão e posição, faça <b>sempre {top.label}</b> ({freq[top.key]}%).</>
        )}
      </p>

      {open && (
        <div className="mt-1 space-y-2 rounded-2xl border border-line bg-card2 p-3 text-xs leading-relaxed text-text">
          <p><b>O que é GTO?</b> É a estratégia "equilibrada" (Game Theory Optimal): a forma de jogar que o adversário <b>não consegue explorar</b>, não importa o que ele faça.</p>
          <p>As barras mostram <b>com que frequência, no longo prazo</b>, cada ação é a jogada certa <b>nesta mão, nesta posição</b> — não numa rodada só, mas se você jogasse a mesma situação centenas de vezes.</p>
          <p><b>100% numa ação</b> = sempre faça aquilo aqui (jogada pura). <b>Barras divididas</b> (ex.: 85% Raise / 15% Fold) = jogada <b>mista</b>: para não virar previsível, o GTO manda fazer a maior parte das vezes a ação principal e, de vez em quando, a outra.</p>
          <p>Você <b>não precisa decorar</b> os números. Entenda a tendência: mãos fortes pesam para <b>Raise</b>; mãos marginais pesam para <b>Fold</b>. E a <b>posição</b> empurra tudo — quanto mais tarde você age, mais mãos viram Raise.</p>
          <p className="text-subtle">Para treinar, basta escolher a ação de <b>maior</b> barra.</p>
        </div>
      )}
    </div>
  );
}
