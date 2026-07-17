import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema } from '@pokerpath/shared';
import { authApi } from '../api/auth.js';
import { ApiError } from '../lib/api.js';
import { PasswordField } from '../components/PasswordField.js';

/** Redefinição de senha via link do e-mail (?token=...). */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError('As senhas não conferem.');
    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) return setError(parsed.error.errors[0]?.message ?? 'Dados inválidos');
    setSubmitting(true);
    try {
      await authApi.resetPassword(parsed.data.token, parsed.data.password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <Link to="/login" className="mb-6 self-start text-sm font-medium text-subtle">← Voltar ao login</Link>

      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-primary shadow-pop"><img src="/logo-mark-white.png" alt="" className="h-3/4 w-3/4 object-contain" /></div>
        <h1 className="mt-5 text-3xl font-bold text-title">Nova senha</h1>
        <p className="mt-1 text-subtle">Escolha a nova senha da sua conta.</p>
      </div>

      {!token ? (
        <div className="mt-8 rounded-2xl border border-error/40 bg-error/10 p-5 text-center">
          <p className="font-semibold text-error">Link inválido</p>
          <p className="mt-1 text-sm text-text">Este link não tem um token de recuperação. Peça um novo.</p>
          <Link to="/forgot-password" className="mt-3 inline-block font-bold text-primary">Pedir novo link</Link>
        </div>
      ) : done ? (
        <div className="mt-8 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
          <p className="text-3xl">✅</p>
          <p className="mt-2 font-semibold text-title">Senha redefinida!</p>
          <p className="mt-1 text-sm text-text">Agora é só entrar com a senha nova.</p>
          <Link to="/login" className="btn-primary mt-4 inline-block px-6">Ir para o login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3.5">
          <PasswordField value={password} onChange={setPassword} placeholder="Nova senha (mín. 8 caracteres)" autoComplete="new-password" />
          <PasswordField value={confirm} onChange={setConfirm} placeholder="Confirme a nova senha" autoComplete="new-password" />
          {error && <p className="text-sm text-error">{error}</p>}
          <button className="btn-primary mt-2 w-full text-lg" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      )}
    </div>
  );
}
