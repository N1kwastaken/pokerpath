import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo.js';
import { Card } from '../components/Card.js';
import { Mascot } from '../components/Mascot.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { IconTarget, IconGrid, IconChart } from '../components/Icons.js';

const FEATURES = [
  { Icon: IconTarget, title: 'Trainer GTO', text: 'Decida em mãos reais e veja a frequência correta.' },
  { Icon: IconGrid, title: 'Charts 13x13', text: 'Ranges de abertura por posição, sempre à mão.' },
  { Icon: IconChart, title: 'Estatísticas', text: 'Acompanhe sua precisão por categoria.' },
];
const STEPS: [string, string, string][] = [
  ['1', 'Crie sua conta', 'Leva 10 segundos. Grátis.'],
  ['2', 'Treine jogando', 'Micro-decisões com feedback na hora.'],
  ['3', 'Evolua', 'Domine ranges e bata seus amigos.'],
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown(true), { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>{children}</div>;
}

export function LandingPage() {
  return (
    <div className="px-6 py-6">
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login" className="text-sm font-bold text-primary">Entrar</Link>
        </div>
      </header>

      {/* Hero ilustrado (gradiente + cartas flutuantes) */}
      <section className="mt-6">
        <div className="relative h-56 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent to-primary-press shadow-pop">
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -right-6 bottom-0 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute -translate-x-20 translate-y-3 -rotate-[16deg] animate-float-slow"><Card token="A♠" /></div>
            <div className="absolute translate-x-20 translate-y-3 rotate-[16deg] animate-float-slow" style={{ animationDelay: '-3s' }}><Card token="K♥" /></div>
            <div className="relative z-10"><Mascot mood="excited" size={132} /></div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-primary shadow-soft">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Estudo de poker, simples
          </span>
          <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight text-title">
            Domine o <span className="text-gradient">pré-flop</span>.
          </h1>
          <p className="mt-4 mx-auto max-w-xs text-text">
            Treine ranges com feedback GTO, do iniciante ao avançado — limpo, rápido e viciante.
          </p>
          <div className="mt-7 mx-auto w-full max-w-xs space-y-3">
            <Link to="/register" className="btn-primary w-full text-lg">Criar conta grátis</Link>
            <Link to="/login" className="btn-outline w-full">Já tenho conta</Link>
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 80}>
            <div className="card flex items-center gap-4 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary"><f.Icon size={22} /></span>
              <div><h3 className="font-bold text-title">{f.title}</h3><p className="text-sm text-subtle">{f.text}</p></div>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold text-title">Como funciona</h2>
        <div className="space-y-3">
          {STEPS.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 80}>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-white shadow-pop">{n}</div>
                <div><h3 className="font-bold text-title">{t}</h3><p className="text-sm text-subtle">{d}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-12 pb-10">
        <div className="card p-7 text-center">
          <h2 className="text-2xl font-bold text-title">Sua primeira mão te espera.</h2>
          <p className="mt-2 text-sm text-subtle">Grátis para começar. Mundos 1–3 sem custo.</p>
          <Link to="/register" className="btn-primary mt-5 w-full">Começar agora</Link>
        </div>
        <p className="mt-6 text-center text-xs text-subtle">PokerPath © 2026</p>
      </section>
    </div>
  );
}
