import { Link } from 'react-router-dom';
import { IconCheck } from '../components/Icons.js';

const BENEFITS = [
  'Postflop completo dos níveis Intermediário e Avançado',
  'Exercícios ilimitados por dia',
  'Estatísticas detalhadas por categoria',
  'Recuperação de streak (1/semana)',
  'Sem anúncios',
];

/** Tela premium com entrada em cascata (nada aparece "de repente"). */
export function PremiumPage() {
  const stag = (i: number) => ({ animationDelay: `${i * 90}ms`, animationFillMode: 'backwards' as const });
  return (
    <div className="px-5 py-8">
      <Link to="/profile" className="mb-6 inline-block text-sm font-medium text-subtle">← Voltar</Link>
      <div className="animate-slide-up relative overflow-hidden rounded-3xl bg-primary p-7 text-center text-white shadow-pop" style={stag(0)}>
        <div className="pointer-events-none absolute inset-0 shimmer opacity-40" />
        <div className="relative text-5xl">⭐</div>
        <h1 className="relative mt-2 text-3xl font-bold text-white">PokerPath Premium</h1>
        <p className="relative mt-1 text-sm text-white/90">Tudo liberado para virar um Poker Master.</p>
      </div>

      <div className="animate-slide-up mt-4 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-center" style={stag(1)}>
        <p className="font-extrabold text-gold">🎁 14 dias por nossa conta</p>
        <p className="mt-1 text-xs text-text">Teste tudo de graça. Cancele quando quiser, sem custo.</p>
      </div>

      <ul className="mt-5 space-y-2.5">
        {BENEFITS.map((b, i) => (
          <li key={b} className="animate-slide-up card flex items-center gap-3 px-4 py-3" style={stag(2 + i)}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success"><IconCheck size={15} /></span>
            <span className="text-sm text-text">{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-3">
        <div className="animate-slide-up" style={stag(7)}><Plan title="Anual" price="R$ 9,90/mês" note="R$ 118,80/ano — economize 50%" highlight /></div>
        <div className="animate-slide-up" style={stag(8)}><Plan title="Mensal" price="R$ 19,90/mês" /></div>
      </div>
      <div className="animate-slide-up" style={stag(9)}>
        <button className="btn-primary mt-8 w-full" disabled>Começar os 14 dias grátis (em breve)</button>
        <p className="mt-3 text-center text-xs text-subtle">Sem cobrança nos primeiros 14 dias · cancele a qualquer momento.</p>
      </div>
    </div>
  );
}
function Plan({ title, price, note, highlight }: { title: string; price: string; note?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-primary bg-primary-soft' : 'border-line bg-card'}`}>
      <div className="flex items-baseline justify-between">
        <span className="font-bold text-title">{title}</span>
        <span className="text-lg font-bold text-title">{price}</span>
      </div>
      {note && <p className="mt-1 text-xs text-subtle">{note}</p>}
    </div>
  );
}
