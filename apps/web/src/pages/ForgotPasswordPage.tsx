import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '@pokerpath/shared';
import { authApi } from '../api/auth.js';
import { ApiError } from '../lib/api.js';

/** "Esqueci minha senha": pede o e-mail e dispara o link de recuperação. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) return setError(parsed.error.errors[0]?.message ?? 'E-mail inválido');
    setSubmitting(true);
    try {
      await authApi.forgotPassword(parsed.data.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <Link to="/login" className="mb-6 self-start text-sm font-medium text-subtle">← Voltar ao login</Link>

      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-4xl font-black text-white shadow-pop">♠</div>
        <h1 className="mt-5 text-3xl font-bold text-title">Esqueceu a senha?</h1>
        <p className="mt-1 text-subtle">Digite seu e-mail e enviamos um link para redefinir.</p>
      </div>

      {sent ? (
        <div className="mt-8 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
          <p className="text-3xl">📬</p>
          <p className="mt-2 font-semibold text-title">Confira seu e-mail</p>
          <p className="mt-1 text-sm text-text">
            Se <b>{email}</b> tiver conta, você vai receber um link de recuperação. Ele vale por 30 minutos.
          </p>
          <Link to="/login" className="mt-4 inline-block font-bold text-primary">Voltar ao login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3.5">
          <input className="field" type="email" placeholder="E-mail" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-sm text-error">{error}</p>}
          <button className="btn-primary mt-2 w-full text-lg" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
      )}
    </div>
  );
}
