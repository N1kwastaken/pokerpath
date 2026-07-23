import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { usernameSchema, nameSchema, type PublicUser } from '@pokerpath/shared';
import { userApi } from '../api/game.js';
import { useAuth } from '../auth/AuthContext.js';
import { ApiError } from '../lib/api.js';
import { sound } from '../lib/sound.js';
import { IconCheck } from './Icons.js';

/**
 * Editor de identidade: NOME (livre, sempre) e @ (único, 1×/30 dias).
 *
 * As duas regras são bem diferentes, então são dois campos com dois botões e
 * dois estados — juntar num "salvar tudo" esconderia o motivo de um deles estar
 * bloqueado. A validação de formato roda no cliente (feedback imediato); posse,
 * unicidade e a janela de 30 dias são decididas pelo servidor.
 */
function daysUntil(iso: string): number {
  return Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export function IdentityEditor({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [uname, setUname] = useState(user?.username ?? '');
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [unameErr, setUnameErr] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [unameSaved, setUnameSaved] = useState(false);

  const nameMut = useMutation({
    mutationFn: (n: string) => userApi.setName(n),
    onSuccess: (u) => { sound.correct(); setUser(u); setNameErr(null); setNameSaved(true); },
    onError: (e) => setNameErr(e instanceof ApiError ? e.message : 'Não deu para salvar.'),
  });
  const unameMut = useMutation({
    mutationFn: (u: string) => userApi.setUsername(u),
    onSuccess: (u) => { sound.correct(); setUser(u); setUnameErr(null); setUnameSaved(true); },
    onError: (e) => setUnameErr(e instanceof ApiError ? e.message : 'Não deu para salvar.'),
  });

  if (!user) return null;

  const blockedUntil = user.usernameNextChangeAt;
  const onCooldown = !!blockedUntil;
  const nameChanged = name.trim() !== user.name;
  const unameChanged = uname.toLowerCase() !== (user.username ?? '');

  function saveName() {
    const p = nameSchema.safeParse(name);
    if (!p.success) { setNameErr(p.error.errors[0]?.message ?? 'Nome inválido'); return; }
    setNameSaved(false); nameMut.mutate(p.data);
  }
  function saveUname() {
    const p = usernameSchema.safeParse(uname);
    if (!p.success) { setUnameErr(p.error.errors[0]?.message ?? 'Inválido'); return; }
    setUnameSaved(false); unameMut.mutate(p.data);
  }

  return (
    <div className="animate-slide-up card space-y-4 p-4">
      {/* Nome */}
      <div>
        <Label>Nome</Label>
        <div className="mt-1 flex gap-2">
          <input
            className="field flex-1" value={name} maxLength={60}
            onChange={(e) => { setName(e.target.value); setNameErr(null); setNameSaved(false); }}
            aria-label="Nome de exibição"
          />
          <SaveBtn saved={nameSaved} pending={nameMut.isPending} disabled={!nameChanged} onClick={saveName} />
        </div>
        {nameErr && <Err>{nameErr}</Err>}
        <p className="mt-1 text-[11px] text-subtle">Aparece em cima. Pode trocar quando quiser.</p>
      </div>

      {/* @username */}
      <div>
        <Label>@ (nome de usuário)</Label>
        <div className="mt-1 flex gap-2">
          <div className="flex flex-1 items-center rounded-xl border border-line bg-card px-3 focus-within:border-primary">
            <span className="text-subtle">@</span>
            <input
              className="w-full bg-transparent py-3.5 text-base text-title outline-none placeholder:text-subtle disabled:opacity-60"
              value={uname} maxLength={20} disabled={onCooldown} placeholder="seunome"
              onChange={(e) => { setUname(e.target.value.toLowerCase()); setUnameErr(null); setUnameSaved(false); }}
              aria-label="Nome de usuário"
            />
          </div>
          <SaveBtn saved={unameSaved} pending={unameMut.isPending} disabled={onCooldown || !unameChanged} onClick={saveUname} />
        </div>
        {unameErr && <Err>{unameErr}</Err>}
        <p className="mt-1 text-[11px] text-subtle">
          {onCooldown
            ? `Só dá para trocar o @ a cada 30 dias — libera em ${daysUntil(blockedUntil)} ${daysUntil(blockedUntil) === 1 ? 'dia' : 'dias'}.`
            : 'Letras, números e _. Único no app. Depois de trocar, só de novo em 30 dias.'}
        </p>
      </div>

      <button onClick={onClose} className="btn-soft w-full">Concluir</button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold uppercase tracking-wide text-subtle">{children}</span>;
}
function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs font-semibold text-error" role="alert">{children}</p>;
}
function SaveBtn({ saved, pending, disabled, onClick }: { saved: boolean; pending: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick} disabled={disabled || pending}
      className="shrink-0 rounded-xl bg-primary px-4 font-bold text-white disabled:bg-card2 disabled:text-subtle"
    >
      {saved && !pending ? <IconCheck size={18} /> : pending ? '...' : 'Salvar'}
    </button>
  );
}

/** Só o par nome + @ para exibir no cabeçalho (sem editor). */
export function IdentityLine({ user }: { user: PublicUser }) {
  return (
    <>
      {user.username && <p className="truncate text-sm font-semibold text-subtle">@{user.username}</p>}
    </>
  );
}
