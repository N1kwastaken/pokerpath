import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExperienceLevel, Goal, PlayFrequency } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { userApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';

const EXPERIENCE: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: '🌱 Nunca joguei' }, { value: 'recreational', label: '🎲 Casualmente' },
  { value: 'intermediate', label: '♠ Com frequência' }, { value: 'advanced', label: '🔥 Experiente' },
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = experienceLevel && playFrequency && goal;

  async function handleFinish() {
    if (!ready) return;
    setSubmitting(true); setError(null);
    try {
      const u = await userApi.onboarding({ experienceLevel, playFrequency, goal });
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
        {EXPERIENCE.map((o) => <Choice key={o.value} on={experienceLevel === o.value} onClick={() => setExperience(o.value)}>{o.label}</Choice>)}
      </Group>
      <Group title="Com que frequência joga?">
        {FREQUENCY.map((o) => <Choice key={o.value} on={playFrequency === o.value} onClick={() => setFrequency(o.value)}>{o.label}</Choice>)}
      </Group>
      <Group title="Seu objetivo?">
        {GOALS.map((o) => <Choice key={o.value} on={goal === o.value} onClick={() => setGoal(o.value)}>{o.label}</Choice>)}
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
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`chip ${on ? 'chip-on' : 'chip-off'} py-4 text-left`}>{children}</button>;
}
