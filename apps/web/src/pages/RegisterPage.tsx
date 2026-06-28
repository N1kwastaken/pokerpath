import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerSchema } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { ApiError } from '../lib/api.js';
import { tokenStorage } from '../lib/tokenStorage.js';

/** Tela de cadastro (repaginada). */
export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
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
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent text-4xl font-black text-white shadow-pop">♠</div>
        <h1 className="mt-5 text-3xl font-bold text-title">Crie sua conta</h1>
        <p className="mt-1 text-subtle">Grátis para começar. Leva 10 segundos.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3.5">
        <input className="field" type="text" placeholder="Nome" autoComplete="name"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" type="email" placeholder="E-mail" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" placeholder="Senha (mín. 8 caracteres)" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
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
