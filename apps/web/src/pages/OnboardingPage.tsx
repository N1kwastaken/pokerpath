import { useState } from 'react';
import { IconSeedling, IconDice, IconFlame } from '../components/Icons.js';
import { useNavigate } from 'react-router-dom';
import type { ExperienceLevel, Goal, PlayFrequency } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { userApi, gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';

const EXPERIENCE: { value: ExperienceLevel; label: string; icon: React.ReactNode }[] = [
  { value: 'beginner', label: 'Nunca joguei', icon: <IconSeedling size={18} /> }, { value: 'recreational', label: 'Casualmente', icon: <IconDice size={18} /> },
  { value: 'intermediate', label: 'Com frequência', icon: <span className="text-base leading-none">♠</span> }, { value: 'advanced', label: 'Experiente', icon: <IconFlame size={18} /> },
];
const FREQUENCY: { value: PlayFrequency; label: string }[] = [
  { value: 'never', label: 'Nunca' }, { value: 'sometimes', label: 'Às vezes' },
  { value: 'weekly', label: 'Toda semana' }, { value: 'daily', label: 'Todo dia' },
];
const GOALS: { value: Goal; label: string }[] = [
  { value: 'learn', label: 'Aprender do zero' }, { value: 'improve', label: 'Melhorar' }, { value: 'review', label: 'Revisar' },
];

export function OnboardingPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [experienceLevel, setExperience] = useState<ExperienceLevel | null>(null);
  const [playFrequency, setFrequency] = useState<PlayFrequency | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = experienceLevel && playFrequency && goal;

  async function handleFinish() {
    if (!ready) return;
    setSubmitting(true); setError(null);
    try {
      localStorage.setItem('pp.lang', language);
      const u = await userApi.onboarding({ experienceLevel, playFrequency, goal });
      // Já jogou antes? Pula os "Primeiros Passos" (Mundo 0).
      if (experienceLevel !== 'beginner') { try { await gameApi.skipBasics(); } catch { /* opcional */ } }
      setUser(u); navigate('/worlds', { replace: true });
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Algo deu errado.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="min-h-dvh px-6 py-10">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-title">Bem-vindo!</h1>
        <p className="mt-1 text-subtle">Três perguntas rápidas para personalizar sua jornada.</p>
      </header>

      <Group title="Qual seu nível?">
        {EXPERIENCE.map((o) => <Choice key={o.value} on={experienceLevel === o.value} onClick={() => setExperience(o.value)}><span className="flex items-center gap-2">{o.icon} {o.label}</span></Choice>)}
      </Group>
      <Group title="Com que frequência joga?">
        {FREQUENCY.map((o) => <Choice key={o.value} on={playFrequency === o.value} onClick={() => setFrequency(o.value)}>{o.label}</Choice>)}
      </Group>
      <Group title="Seu objetivo?">
        {GOALS.map((o) => <Choice key={o.value} on={goal === o.value} onClick={() => setGoal(o.value)}>{o.label}</Choice>)}
      </Group>
      <Group title="Idioma">
        <Choice on={language === 'pt'} onClick={() => setLanguage('pt')}>🇧🇷 Português</Choice>
        <Choice on={false} disabled onClick={() => {}}>🇺🇸 English (em breve)</Choice>
      </Group>
      {error && <p className="mt-4 text-sm text-error">{error}</p>}
      <button className="btn-primary mt-8 w-full" disabled={!ready || submitting} onClick={handleFinish}>
        {submitting ? 'Salvando...' : 'Começar a jogar'}
      </button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-subtle">{title}</h2>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}
function Choice({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={disabled ? undefined : onClick}
      className={`chip py-4 text-left ${disabled ? 'cursor-not-allowed border-line bg-card2 text-subtle opacity-40' : on ? 'chip-on' : 'chip-off'}`}>
      {children}
    </button>
  );
}
