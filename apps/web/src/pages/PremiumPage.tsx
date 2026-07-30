import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.js';
import { IconBolt, IconCheck, IconCrown, IconLock } from '../components/Icons.js';

const PREMIUM_READY = [
  ['♠', 'Fases postflop dos níveis Intermediário e Avançado'],
  [<IconBolt size={16} />, 'Energia ilimitada para exercícios'],
] as const;

const FREE_GUARANTEES = [
  'Todo o conteúdo preflop permanece grátis.',
  'Fases Premium não travam a progressão nem a conclusão dos mundos.',
  'Nenhum cartão ou pagamento é solicitado durante o beta.',
] as const;

/**
 * Vitrine honesta do Premium enquanto a cobrança não existe.
 *
 * Não exibe preço, desconto ou período de teste hipotético. Esses elementos só
 * voltam quando houver gateway funcional e termos comerciais definitivos.
 */
export function PremiumPage() {
  const { user } = useAuth();
  const active = user?.plan === 'PREMIUM' || !!(user?.isDev && !user.debugSimulation);
  const stag = (i: number) => ({
    animationDelay: `${i * 90}ms`,
    animationFillMode: 'backwards' as const,
  });

  return (
    <div className="px-5 py-8">
      <Link to="/profile" className="mb-6 inline-block text-sm font-medium text-subtle">← Voltar</Link>

      <div
        className="animate-slide-up relative overflow-hidden rounded-3xl border border-gold/50 bg-card p-7 text-center shadow-pop"
        style={stag(0)}
      >
        <div className="pointer-events-none absolute inset-0 shimmer opacity-25" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.28) 0%, transparent 70%)' }}
        />
        <span className="relative inline-flex rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gold">
          Em preparação
        </span>
        <IconCrown size={52} className="relative mx-auto mt-3 animate-float text-gold" />
        <h1 className="relative mt-2 text-3xl font-black text-title">
          PokerPath <span className="text-gold">Premium</span>
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-text">
          A assinatura ainda não está à venda. Esta página mostra o que já está
          preparado, sem preço ou promessa de teste fictício.
        </p>
      </div>

      <div
        className={`animate-slide-up mt-4 rounded-2xl border p-4 ${
          active ? 'border-gold/45 bg-gold/10' : 'border-primary/30 bg-primary/10'
        }`}
        style={stag(1)}
      >
        <p className={`flex items-center gap-2 font-extrabold ${active ? 'text-gold' : 'text-primary'}`}>
          {active ? <IconCheck size={18} /> : <IconLock size={18} />}
          {active ? 'Acesso beta ativo nesta conta' : 'Sem cobrança ativa'}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-text">
          {active
            ? 'Você já pode usar os recursos Premium liberados para esta conta durante o beta.'
            : 'Você pode continuar toda a trilha gratuita. Planos só aparecerão quando compra, cancelamento e suporte estiverem funcionando.'}
        </p>
      </div>

      <section className="mt-7">
        <h2 className="text-xs font-black uppercase tracking-wider text-subtle">Já preparado para o Premium</h2>
        <ul className="mt-3 space-y-2.5">
          {PREMIUM_READY.map(([icon, benefit], i) => (
            <li
              key={benefit}
              className="animate-slide-up card flex items-center gap-3 px-4 py-3"
              style={stag(2 + i)}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-base text-gold">
                {icon}
              </span>
              <span className="text-sm text-text">{benefit}</span>
              <IconCheck size={16} className="ml-auto shrink-0 text-gold" />
            </li>
          ))}
        </ul>
      </section>

      <section className="animate-slide-up mt-7 card p-5" style={stag(4)}>
        <h2 className="font-extrabold text-title">O grátis continua valendo</h2>
        <ul className="mt-3 space-y-3">
          {FREE_GUARANTEES.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-text">
              <IconCheck size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="animate-slide-up mt-7 rounded-2xl border border-line bg-card2 p-4 text-center" style={stag(5)}>
        <p className="text-sm font-bold text-title">Preços ainda não foram definidos</p>
        <p className="mt-1 text-xs leading-relaxed text-subtle">
          Valores, período de teste e regras de cancelamento serão exibidos antes
          de qualquer pagamento, quando o sistema de assinatura estiver pronto.
        </p>
      </div>

      <Link to="/trail" className="btn-primary mt-5 w-full">
        Continuar treinando
      </Link>
    </div>
  );
}
