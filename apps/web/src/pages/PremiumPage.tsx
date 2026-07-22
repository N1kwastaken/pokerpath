import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconCheck } from '../components/Icons.js';
import { sound } from '../lib/sound.js';

const BENEFITS = [
  ['♠', 'Postflop completo dos níveis Intermediário e Avançado'],
  ['⚡', 'Energia infinita — exercícios ilimitados por dia'],
  ['📊', 'Estatísticas detalhadas por categoria'],
  ['🔥', 'Recuperação de streak (1/semana)'],
  ['🚫', 'Sem anúncios'],
] as const;

/**
 * Tela premium — a vitrine da assinatura. OURO, não verde: o verde é o app
 * inteiro; o dourado é a cor do que se conquista e do que se paga. Os planos
 * são selecionáveis desde já (o toque no plano é metade da decisão de compra),
 * mesmo com o CTA aguardando o gateway de pagamento.
 */
export function PremiumPage() {
  const [plan, setPlan] = useState<'anual' | 'mensal'>('anual');
  const stag = (i: number) => ({ animationDelay: `${i * 90}ms`, animationFillMode: 'backwards' as const });

  return (
    <div className="px-5 py-8">
      <Link to="/profile" className="mb-6 inline-block text-sm font-medium text-subtle">← Voltar</Link>

      {/* Herói dourado sobre fundo escuro — a moldura do produto. */}
      <div className="animate-slide-up relative overflow-hidden rounded-3xl border border-gold/50 bg-card p-7 text-center shadow-pop" style={stag(0)}>
        <div className="pointer-events-none absolute inset-0 shimmer opacity-30" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.28) 0%, transparent 70%)' }}
        />
        <div className="relative animate-float text-5xl">👑</div>
        <h1 className="relative mt-2 text-3xl font-black text-title">
          PokerPath <span className="text-gold">Premium</span>
        </h1>
        <p className="relative mt-1 text-sm text-text">Tudo liberado para virar um Poker Master.</p>
      </div>

      <div className="animate-slide-up mt-4 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-center" style={stag(1)}>
        <p className="font-extrabold text-gold">🎁 14 dias por nossa conta</p>
        <p className="mt-1 text-xs text-text">Teste tudo de graça. Cancele quando quiser, sem custo.</p>
      </div>

      <ul className="mt-5 space-y-2.5">
        {BENEFITS.map(([icon, b], i) => (
          <li key={b} className="animate-slide-up card flex items-center gap-3 px-4 py-3" style={stag(2 + i)}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-base">{icon}</span>
            <span className="text-sm text-text">{b}</span>
            <IconCheck size={16} className="ml-auto shrink-0 text-gold" />
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        <div className="animate-slide-up" style={stag(7)}>
          <Plan
            title="Anual" price="R$ 9,90" per="/mês" note="R$ 118,80 cobrados por ano"
            badge="Mais popular · economize 50%"
            selected={plan === 'anual'} onSelect={() => { sound.click(); setPlan('anual'); }}
          />
        </div>
        <div className="animate-slide-up" style={stag(8)}>
          <Plan
            title="Mensal" price="R$ 19,90" per="/mês" note="Sem fidelidade, cancele quando quiser"
            selected={plan === 'mensal'} onSelect={() => { sound.click(); setPlan('mensal'); }}
          />
        </div>
      </div>

      <div className="animate-slide-up" style={stag(9)}>
        <button className="btn-primary mt-8 w-full" disabled>Começar os 14 dias grátis (em breve)</button>
        <p className="mt-3 text-center text-xs text-subtle">Sem cobrança nos primeiros 14 dias · cancele a qualquer momento.</p>
      </div>
    </div>
  );
}

function Plan({ title, price, per, note, badge, selected, onSelect }: {
  title: string; price: string; per: string; note?: string; badge?: string;
  selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative block w-full rounded-2xl border-2 p-4 pt-5 text-left transition-all active:scale-[0.99] ${
        selected ? 'border-gold bg-gold/10 shadow-pop' : 'border-line bg-card'
      }`}
    >
      {badge && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-3">
        {/* rádio */}
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-gold' : 'border-line'}`}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-gold" />}
        </span>
        <span className="font-bold text-title">{title}</span>
        <span className="ml-auto text-right">
          <span className={`text-xl font-black ${selected ? 'text-gold' : 'text-title'}`}>{price}</span>
          <span className="text-xs font-semibold text-subtle">{per}</span>
        </span>
      </div>
      {note && <p className="mt-1.5 pl-8 text-xs text-subtle">{note}</p>}
    </button>
  );
}
