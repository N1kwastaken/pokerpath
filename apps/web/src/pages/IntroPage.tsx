import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo.js';
import { Mascot, type MascotMood } from '../components/Mascot.js';
import { hasSeenIntro, markIntroSeen } from '../lib/intro.js';

/**
 * Tour de introdução.
 * - Padrão (pré-login): só aparece na 1ª abertura; depois vai direto ao login.
 *   O botão "Voltar" do login chama /welcome?replay=1 para reabrir o tour.
 * - `review` (a partir do Perfil): sempre mostra e volta para o app ao fim.
 */
type Slide = { mood: MascotMood; from: string; to: string; title: string; text: string };

const SLIDES: Slide[] = [
  { mood: 'wave', from: '#3B82F6', to: '#7C5CFF', title: 'Bem-vindo ao PokerPath', text: 'Aprenda poker como um jogo: rápido, visual e viciante.' },
  { mood: 'teaching', from: '#7C5CFF', to: '#16A34A', title: 'Treine na mesa', text: 'Decida Fold, Call ou Raise em mãos reais e veja a frequência GTO certa.' },
  { mood: 'happy', from: '#16A34A', to: '#F59E0B', title: 'Estude de verdade', text: 'Charts de ranges 13×13 por posição e estatísticas da sua precisão.' },
  { mood: 'excited', from: '#F59E0B', to: '#3B82F6', title: 'Evolua jogando', text: 'Ganhe XP, mantenha seu streak e avance por uma trilha de mundos.' },
];

export function IntroPage({ review = false }: { review?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const replay = review || new URLSearchParams(location.search).get('replay') === '1';
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (hasSeenIntro() && !replay) navigate('/login', { replace: true });
  }, [navigate, replay]);

  function finish(to: string) {
    markIntroSeen();
    navigate(to, { replace: true });
  }
  const last = i === SLIDES.length - 1;
  const go = (d: number) => setI((v) => Math.max(0, Math.min(SLIDES.length - 1, v + d)));

  const s = SLIDES[i];
  return (
    <div className="flex min-h-dvh flex-col px-6 py-6"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -40) go(1); else if (dx > 40) go(-1);
        touchX.current = null;
      }}
    >
      <header className="flex items-center justify-between">
        <Logo size="sm" />
        <button onClick={() => finish(review ? '/' : '/login')} className="text-sm font-semibold text-subtle">
          {review ? 'Fechar' : 'Pular'}
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-60 w-full max-w-xs items-center justify-center rounded-3xl shadow-pop"
          style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
          <Mascot key={s.mood} mood={s.mood} size={170} />
        </div>
        <h1 className="mt-8 text-3xl font-bold text-title">{s.title}</h1>
        <p className="mt-3 max-w-xs text-text">{s.text}</p>
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {SLIDES.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} aria-label={`Ir ao slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${idx === i ? 'w-7 bg-primary' : 'w-2 bg-line'}`} />
        ))}
      </div>

      {last ? (
        review ? (
          <button className="btn-primary w-full text-lg" onClick={() => finish('/')}>Voltar ao app</button>
        ) : (
          <div className="space-y-3">
            <button className="btn-primary w-full text-lg" onClick={() => finish('/register')}>Criar conta grátis</button>
            <button className="btn-soft w-full" onClick={() => finish('/login')}>Já tenho conta</button>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3">
          <button className="btn-soft flex-1" onClick={() => go(-1)} disabled={i === 0}>Voltar</button>
          <button className="btn-primary flex-1" onClick={() => go(1)}>Próximo</button>
        </div>
      )}
    </div>
  );
}
