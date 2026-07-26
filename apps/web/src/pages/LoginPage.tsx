import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { loginSchema } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { ApiError } from '../lib/api.js';
import { tokenStorage } from '../lib/tokenStorage.js';
import { IconCheck } from '../components/Icons.js';
import { PasswordField } from '../components/PasswordField.js';

/** Tela de login (repaginada) com "lembrar de mim". */
export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(tokenStorage.isRemembered());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.errors[0]?.message ?? 'Dados inválidos');
    setSubmitting(true);
    tokenStorage.setRemember(remember);
    try {
      await login(parsed.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <Link to="/welcome?replay=1" className="mb-6 self-start text-sm font-medium text-subtle">← Voltar</Link>

      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-primary shadow-pop"><img src="/logo-mark-white.png" alt="" className="h-3/4 w-3/4 object-contain" /></div>
        <h1 className="mt-5 text-3xl font-bold text-title">Bem-vindo de volta</h1>
        <p className="mt-1 text-subtle">Entre para continuar treinando.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3.5">
        <input className="field" type="email" placeholder="E-mail" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField value={password} onChange={setPassword} placeholder="Senha" autoComplete="current-password" />

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setRemember((v) => !v)}
            className="flex items-center gap-2.5 py-1 text-sm font-medium text-text">
            <span className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${remember ? 'border-primary bg-primary text-white' : 'border-line bg-card'}`}>
              {remember && <IconCheck size={13} />}
            </span>
            Lembrar de mim
          </button>
          <Link to="/forgot-password" className="py-1 text-sm font-semibold text-primary">Esqueci minha senha</Link>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
        <button className="btn-primary mt-2 w-full text-lg" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-subtle">
        Não tem conta? <Link to="/register" className="font-bold text-primary">Cadastre-se</Link>
      </p>
    </div>
  );
}
