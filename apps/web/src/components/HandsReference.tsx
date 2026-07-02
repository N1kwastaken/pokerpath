import { LessonVisual } from './LessonVisual.js';

/** Referência de mãos: ranking das jogadas + notação das mãos iniciais. */
export function HandsReference() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-subtle">Ranking das mãos</h3>
        <LessonVisual visual="handranks" />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-subtle">Notação das mãos iniciais</h3>
        <div className="card space-y-2 p-4 text-sm text-text">
          <p><b className="text-title">Pares</b>: duas cartas iguais — AA, KK, …, 22. <span className="text-subtle">(13 mãos)</span></p>
          <p><b className="text-title">Suited (s)</b>: mesmo naipe — ex.: <b>AKs</b> = A♠K♠. Podem formar flush. <span className="text-subtle">(78 mãos)</span></p>
          <p><b className="text-title">Offsuit (o)</b>: naipes diferentes — ex.: <b>AKo</b> = A♠K♥. <span className="text-subtle">(78 mãos)</span></p>
          <p className="text-subtle">No total são <b className="text-text">169</b> mãos iniciais possíveis no Hold'em — exatamente o que o chart 13×13 mostra.</p>
        </div>
      </section>
    </div>
  );
}
