import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/** Volta para onde o usuário estava (fase, perfil…); fallback: perfil. */
function BackButton() {
  const navigate = useNavigate();
  const hasHistory = window.history.length > 1;
  if (!hasHistory) return <Link to="/profile" className="mb-4 inline-block text-sm font-medium text-subtle">← Perfil</Link>;
  return (
    <button onClick={() => navigate(-1)} className="mb-4 inline-block text-sm font-medium text-subtle">
      ← Voltar
    </button>
  );
}

/** Glossário — termos essenciais do poker, em dropdowns por seção. */
type Term = { term: string; def: string };
type Section = { title: string; terms: Term[] };

const SECTIONS: Section[] = [
  {
    title: 'Ações',
    terms: [
      { term: 'Fold', def: 'Desistir da mão e jogar as cartas fora. Você não arrisca mais fichas.' },
      { term: 'Check', def: 'Passar a vez de graça — só é possível quando ninguém apostou ainda.' },
      { term: 'Call', def: 'Pagar o valor da aposta atual para continuar na mão.' },
      { term: 'Raise', def: 'Aumentar a aposta, pressionando os adversários.' },
      { term: 'Open raise (RFI)', def: 'Ser o primeiro a aumentar quando ninguém entrou no pote. RFI = Raise First In.' },
      { term: '3-Bet', def: 'Relançar por cima de um raise (o terceiro aumento da mão).' },
      { term: 'All-in', def: 'Apostar todas as suas fichas de uma vez.' },
    ],
  },
  {
    title: 'Posição',
    terms: [
      { term: 'Posição', def: 'Sua ordem de ação na rodada. Quem age depois tem mais informação.' },
      { term: 'UTG', def: 'Under the Gun: o primeiro a agir. Pior posição, então o range é o mais apertado.' },
      { term: 'MP / CO', def: 'Posições do meio (MP) e o Cutoff (CO), logo antes do botão.' },
      { term: 'BTN (botão)', def: 'O dealer. Age por último depois do flop — a melhor posição da mesa.' },
      { term: 'SB / BB', def: 'Small blind e big blind: pagam apostas obrigatórias e agem cedo no pós-flop.' },
      { term: 'Em posição (IP) / Fora de posição (OOP)', def: 'IP = você age depois do adversário (vantagem). OOP = você age antes (desvantagem).' },
    ],
  },
  {
    title: 'Mãos e cartas',
    terms: [
      { term: 'Suited (s)', def: 'Duas cartas do mesmo naipe, ex.: A♠Q♠. Podem formar flush.' },
      { term: 'Offsuit (o)', def: 'Duas cartas de naipes diferentes, ex.: A♠Q♥.' },
      { term: 'Mãos premium', def: 'As mais fortes: AA, KK, QQ, AK… abrem de qualquer posição.' },
      { term: 'Conectores (connectors)', def: 'Cartas em sequência, ex.: 7♠6♠. Suited connectors podem virar sequência ou flush.' },
      { term: 'Par / Dois pares / Trinca (set)', def: 'Par = 2 iguais; dois pares = dois pares diferentes; trinca = 3 iguais.' },
      { term: 'Kicker', def: 'A carta de desempate quando dois jogadores têm a mesma jogada principal.' },
    ],
  },
  {
    title: 'A rodada',
    terms: [
      { term: 'Blinds (SB/BB)', def: 'Apostas obrigatórias antes das cartas. Criam o pote inicial.' },
      { term: 'Pré-flop / Flop / Turn / River', def: 'As ruas: antes das comunitárias, depois as 3 do flop, a 4ª (turn) e a 5ª (river).' },
      { term: 'Board', def: 'As cartas comunitárias na mesa, compartilhadas por todos.' },
      { term: 'Pot (pote)', def: 'O total de fichas em disputa na mão.' },
      { term: 'Stack', def: 'Quantas fichas você tem na mesa, medido em big blinds (BB).' },
    ],
  },
  {
    title: 'Estratégia',
    terms: [
      { term: 'Range', def: 'O conjunto de mãos com que você joga numa situação (ex.: o range de abertura do BTN).' },
      { term: 'Sizing', def: 'O tamanho da aposta. Open padrão ~2,5x o BB; da SB costuma ser maior (~3x).' },
      { term: 'Value / Blefe', def: 'Value = apostar com mão forte para ser pago. Blefe = apostar com mão fraca para fazer foldar.' },
      { term: 'Equity', def: 'Sua fatia do pote: a chance da sua mão ganhar no showdown.' },
      { term: 'Estratégia mista', def: 'Quando o GTO manda jogar a mesma mão de formas diferentes numa frequência (ex.: 70% raise, 30% fold).' },
      { term: 'GTO', def: 'Game Theory Optimal: a forma de jogar equilibrada, que não pode ser explorada. Aqui usamos uma versão simplificada.' },
    ],
  },
];

export function GlossaryPage({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen] = useState<string | null>('Ações');

  return (
    <div className={embedded ? '' : 'px-5 py-8'}>
      {!embedded && (
        <>
          <BackButton />
          <h1 className="text-3xl font-bold text-title">Glossário</h1>
          <p className="mt-1 text-subtle">Toque numa seção para ver os termos.</p>
        </>
      )}

      <div className="mt-5 space-y-3">
        {SECTIONS.map((sec) => {
          const isOpen = open === sec.title;
          return (
            <div key={sec.title} className="overflow-hidden rounded-2xl border border-line bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : sec.title)}
                className="flex w-full items-center justify-between p-4 text-left active:bg-card2"
              >
                <span className="font-bold text-title">{sec.title}</span>
                <span className={`text-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-line p-4">
                  {sec.terms.map((it) => (
                    <div key={it.term}>
                      <h3 className="font-semibold text-primary">{it.term}</h3>
                      <p className="mt-0.5 text-sm text-text">{it.def}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
