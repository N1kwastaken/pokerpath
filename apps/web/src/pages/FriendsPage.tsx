import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Mascot } from '../components/Mascot.js';
import { sound } from '../lib/sound.js';

/**
 * Amigos: seu código curto (compartilhe!), adicionar pelo código e a lista
 * ordenada por XP — nome, nível, streak.
 */
export function FriendsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['friends'], queryFn: gameApi.friends });
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const addMut = useMutation({
    mutationFn: (c: string) => gameApi.addFriend(c),
    onSuccess: (f) => {
      sound.correct();
      setMsg({ ok: true, text: `${f.name} agora é seu amigo! 🤝` });
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (e) => {
      sound.wrong();
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Não foi possível adicionar' });
    },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => gameApi.removeFriend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (code.trim()) addMut.mutate(code);
  }
  async function copy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard bloqueado — o código está visível mesmo assim */ }
  }

  if (isLoading) return <LogoLoader label="Chamando a galera..." />;
  if (!data) return null;

  return (
    <div className="px-5 py-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-subtle">← Voltar</button>
      <h1 className="text-3xl font-bold text-title">Amigos</h1>

      {/* Seu código */}
      <div className="card mt-5 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-subtle">Seu código de amigo</p>
        <p className="mt-2 font-display text-4xl font-black tracking-[0.3em] text-primary">{data.code}</p>
        <button onClick={copy} className="btn-soft mt-3 w-full">{copied ? 'Copiado! ✓' : 'Copiar código'}</button>
        <p className="mt-2 text-xs text-subtle">Passe esse código para um amigo te adicionar (ou adicione pelo código dele abaixo).</p>
      </div>

      {/* Adicionar */}
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          className="field flex-1 uppercase tracking-widest"
          placeholder="CÓDIGO DO AMIGO"
          value={code}
          maxLength={10}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button className="btn-primary px-5" disabled={addMut.isPending || !code.trim()}>
          {addMut.isPending ? '...' : 'Adicionar'}
        </button>
      </form>
      {msg && <p className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-primary' : 'text-error'}`}>{msg.text}</p>}

      {/* Lista */}
      {data.friends.length === 0 ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <Mascot mood="think" size={120} />
          <p className="mt-3 font-bold text-title">Ainda sem amigos por aqui</p>
          <p className="mt-1 max-w-xs text-sm text-subtle">Compartilhe seu código — treinar junto rende mais do que sozinho.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2.5">
          {data.friends.map((f, i) => (
            <div key={f.id} className="card flex items-center gap-3 p-4">
              <span className="w-6 text-center text-sm font-black text-subtle">{i + 1}º</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-bold text-title">
                  {f.name}
                  {f.isDev && <span className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-1.5 text-[9px] font-black uppercase text-accent">DEV</span>}
                </p>
                <p className="text-xs text-subtle">Nível {f.level} · {f.levelName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-title">{f.totalXp.toLocaleString('pt-BR')} XP</p>
                <p className="text-xs text-subtle">{f.currentStreak}🔥</p>
              </div>
              <button
                onClick={() => { if (window.confirm(`Remover ${f.name} dos amigos?`)) removeMut.mutate(f.id); }}
                className="ml-1 text-subtle" aria-label={`Remover ${f.name}`}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
