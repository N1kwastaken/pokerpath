import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerSchema, type OnboardingInput } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { ApiError } from '../lib/api.js';
import { tokenStorage } from '../lib/tokenStorage.js';
import { PasswordField } from '../components/PasswordField.js';
import { userApi } from '../api/game.js';
import { SETUP_KEY, type SetupData } from './SetupPage.js';

function loadSetup(): SetupData | null {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    return raw ? (JSON.parse(raw) as SetupData) : null;
  } catch { return null; }
}

/** Respostas do /setup viram o onboarding automaticamente após o cadastro. */
function setupToOnboarding(s: SetupData): OnboardingInput {
  const experienceLevel = (['beginner', 'recreational', 'intermediate'].includes(s.experience) ? s.experience : 'beginner') as OnboardingInput['experienceLevel'];
  const playFrequency = ({ beginner: 'never', recreational: 'sometimes', intermediate: 'weekly' } as const)[experienceLevel as 'beginner' | 'recreational' | 'intermediate'] ?? 'never';
  const goal = (['learn', 'improve', 'review'].includes(s.goal) ? s.goal : 'learn') as OnboardingInput['goal'];
  return { experienceLevel, playFrequency, goal };
}

/** Tela de cadastro (repaginada). */
export function RegisterPage() {
  const { register, setUser } = useAuth();
  const [setup] = useState(() => loadSetup());
  const [name, setName] = useState(setup?.name ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) return setError(parsed.error.errors[0]?.message ?? 'Dados inválidos');
    setSubmitting(true);
    tokenStorage.setRemember(true);
    try {
      await register(parsed.data);
      // Quem montou o app no /setup já respondeu tudo: pula o onboarding.
      if (setup) {
        try {
          const updated = await userApi.onboarding(setupToOnboarding(setup));
          setUser(updated);
          localStorage.removeItem(SETUP_KEY);
        } catch { /* sem drama: cai no onboarding normal */ }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cadastrar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <Link to="/welcome?replay=1" className="mb-6 self-start text-sm font-medium text-subtle">← Voltar</Link>

      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-4xl font-black text-white shadow-pop">♠</div>
        <h1 className="mt-5 text-3xl font-bold text-title">{setup?.name ? 'Falta pouco, ' + setup.name + '!' : 'Crie sua conta'}</h1>
        <p className="mt-1 text-subtle">{setup ? 'Crie a conta para salvar seu progresso.' : 'Grátis para começar. Leva 10 segundos.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3.5">
        <input className="field" type="text" placeholder="Nome" autoComplete="name"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" type="email" placeholder="E-mail" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField value={password} onChange={setPassword} placeholder="Senha (mín. 8 caracteres)" autoComplete="new-password" />
        {error && <p className="text-sm text-error">{error}</p>}
        <button className="btn-primary mt-2 w-full text-lg" disabled={submitting}>
          {submitting ? 'Criando conta...' : 'Criar conta grátis'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-subtle">
        Já tem conta? <Link to="/login" className="font-bold text-primary">Entrar</Link>
      </p>
    </div>
  );
}
