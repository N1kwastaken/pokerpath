import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FriendView } from '@pokerpath/shared';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { useAchievements } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Mascot } from '../components/Mascot.js';
import { Avatar } from '../components/Avatar.js';
import { ProfileBadge } from '../components/ProfileBadge.js';
import { AchievementBadge } from '../components/AchievementBadge.js';
import { IconX } from '../components/Icons.js';
import { sound } from '../lib/sound.js';

/**
 * Amigos — placar de XP com VOCÊ dentro.
 *
 * A versão anterior listava só os amigos: um ranking em que a própria pessoa
 * não aparece não serve para comparar nada. Aqui todo mundo entra na mesma
 * tabela, ordenada por XP, com a sua linha destacada e ancorada.
 */
type Row = FriendView & { me: boolean };

const MEDALS = ['🥇', '🥈', '🥉'];

export function FriendsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['friends'], queryFn: gameApi.friends });
  const { data: achievements } = useAchievements();
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

  /** Compartilhar > copiar: no celular abre o menu nativo (WhatsApp, etc.). */
  async function share() {
    if (!data) return;
    const text = `Bora treinar poker comigo no PokerPath? Meu código de amigo é ${data.code} — https://pokerpath.onrender.com`;
    sound.click();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PokerPath', text });
        return;
      }
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* usuário cancelou o menu, ou clipboard bloqueado — o código está na tela */
    }
  }

  if (isLoading) return <LogoLoader label="Chamando a galera..." />;
  if (!data || !user) return null;

  // Você entra no mesmo placar dos amigos — é o que torna o número comparável.
  const rows: Row[] = [
    ...data.friends.map((f) => ({ ...f, me: false })),
    {
      id: user.id, name: user.name, totalXp: user.totalXp, level: user.level,
      levelName: user.levelName, currentStreak: user.currentStreak, isDev: user.isDev,
      showcaseBadges: user.showcaseBadges ?? [], avatar: user.avatar ?? null, me: true,
    },
  ].sort((a, b) => b.totalXp - a.totalXp);

  const myPos = rows.findIndex((r) => r.me) + 1;
  const ahead = myPos > 1 ? rows[myPos - 2] : null;
  const gap = ahead ? ahead.totalXp - user.totalXp : 0;

  return (
    <div className="px-5 py-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-subtle">← Voltar</button>
      <h1 className="text-3xl font-bold text-title">Amigos</h1>

      {/* Convite — o código com o compartilhamento nativo do aparelho. */}
      <div className="card mt-5 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-subtle">Seu código de amigo</p>
        <p className="mt-2 font-display text-4xl font-black tracking-[0.3em] text-primary">{data.code}</p>
        <button onClick={share} className="btn-primary mt-3 w-full">
          {copied ? 'Copiado! ✓' : 'Convidar um amigo'}
        </button>
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          className="field flex-1 uppercase tracking-widest"
          placeholder="CÓDIGO DO AMIGO" aria-label="Código do amigo"
          value={code} maxLength={10}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button className="btn-primary px-5" disabled={addMut.isPending || !code.trim()}>
          {addMut.isPending ? '...' : 'Adicionar'}
        </button>
      </form>
      {msg && <p className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-primary' : 'text-error'}`} role="status">{msg.text}</p>}

      {data.friends.length === 0 ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <Mascot mood="think" size={120} />
          <p className="mt-3 font-bold text-title">Ainda sem amigos por aqui</p>
          <p className="mt-1 max-w-xs text-sm text-subtle">
            Treinar junto rende mais: com amigo na lista, o XP vira disputa e a sequência vira compromisso.
          </p>
        </div>
      ) : (
        <>
          {/* A frase que dá sentido ao placar: onde você está e o que falta. */}
          <div className="mt-6 rounded-2xl border border-line bg-card2 px-4 py-3 text-sm">
            {myPos === 1 ? (
              <p className="font-bold text-title">🥇 Você lidera entre {rows.length} — segure o topo.</p>
            ) : (
              <p className="text-text">
                Você está em <b className="text-title">{myPos}º de {rows.length}</b> ·{' '}
                <b className="text-primary">{gap.toLocaleString('pt-BR')} XP</b> para passar {ahead!.name}.
              </p>
            )}
          </div>

          <div className="mt-3 space-y-2.5">
            {rows.map((r, i) => (
              <RankRow
                key={r.id} row={r} pos={i + 1}
                achievements={achievements ?? []}
                accent={r.me}
                onRemove={r.me ? undefined : () => {
                  if (window.confirm(`Remover ${r.name} dos amigos?`)) removeMut.mutate(r.id);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RankRow({ row, pos, achievements, accent, onRemove }: {
  row: Row; pos: number;
  achievements: Parameters<typeof ProfileBadge>[0]['achievements'];
  accent: boolean;
  onRemove?: () => void;
}) {
  return (
    // gap-2.5 em vez de 3: com medalha + avatar + XP + remover, cada 2px de
    // folga vira caractere a mais do nome numa tela de 360px.
    <div className={`flex items-center gap-2.5 rounded-2xl border p-3 ${
      accent ? 'border-primary/60 bg-primary/10' : 'border-line bg-card'
    }`}>
      <span className="w-6 shrink-0 text-center text-sm font-black tabular-nums text-subtle">
        {pos <= 3 ? <span className="text-lg">{MEDALS[pos - 1]}</span> : `${pos}º`}
      </span>
      <Avatar name={row.name} size={38} ring={accent} src={row.avatar} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-bold text-title">
          <span className="truncate">{row.name}</span>
          {accent && <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-primary">você</span>}
          {row.isDev && <span className="shrink-0" title="Beta tester"><AchievementBadge code="DEV" size={16} /></span>}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-subtle">
          <span className="truncate">{row.levelName}</span>
          {/* A vitrine dele — é o que faz escolher badge valer alguma coisa. */}
          {row.showcaseBadges.slice(0, 2).map((id) => (
            <ProfileBadge key={id} id={id} achievements={achievements} size={16} />
          ))}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-black tabular-nums text-title">{row.totalXp.toLocaleString('pt-BR')}</p>
        <p className="text-xs tabular-nums text-subtle">{row.currentStreak}🔥</p>
      </div>
      {onRemove && (
        <button onClick={onRemove} className="shrink-0 text-subtle active:scale-90" aria-label={`Remover ${row.name}`}>
          <IconX size={16} />
        </button>
      )}
    </div>
  );
}
