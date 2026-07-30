import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FriendRequestView, FriendView } from '@pokerpath/shared';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.js';
import { useAchievements } from '../hooks/useGame.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Mascot } from '../components/Mascot.js';
import { Avatar } from '../components/Avatar.js';
import { ProfileBadge } from '../components/ProfileBadge.js';
import { AchievementBadge } from '../components/AchievementBadge.js';
import { IconCheck, IconX, IconMedal, IconFlame } from '../components/Icons.js';
import { sound } from '../lib/sound.js';

/**
 * Amigos — placar de XP com VOCÊ dentro.
 *
 * A versão anterior listava só os amigos: um ranking em que a própria pessoa
 * não aparece não serve para comparar nada. Aqui todo mundo entra na mesma
 * tabela, ordenada por XP, com a sua linha destacada e ancorada.
 */
type Row = FriendView & { me: boolean };


export function FriendsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['friends'], queryFn: gameApi.friends });
  const { data: achievements } = useAchievements();
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const sendMut = useMutation({
    mutationFn: (handle: string) => gameApi.sendFriendRequest(handle),
    onSuccess: (request) => {
      sound.correct();
      setMsg({ ok: true, text: `Solicitação enviada para ${request.user.name}.` });
      setUsername('');
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (e) => {
      sound.wrong();
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Não foi possível enviar a solicitação.' });
    },
  });
  const acceptMut = useMutation({
    mutationFn: (id: string) => gameApi.acceptFriendRequest(id),
    onSuccess: (friend) => {
      sound.correct();
      setMsg({ ok: true, text: `Você e ${friend.name} agora são amigos!` });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (e) => {
      sound.wrong();
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Não foi possível aceitar o pedido.' });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  const deleteRequestMut = useMutation({
    mutationFn: (id: string) => gameApi.deleteFriendRequest(id),
    onSuccess: (result) => {
      setMsg({
        ok: true,
        text: result.outcome === 'CANCELLED' ? 'Solicitação cancelada.' : 'Solicitação recusada.',
      });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (e) => {
      sound.wrong();
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Não foi possível atualizar o pedido.' });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => gameApi.removeFriend(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (username.trim()) sendMut.mutate(username);
  }

  if (isLoading) return <LogoLoader label="Chamando a galera..." />;
  if (!data || !user) return null;

  // Você entra no mesmo placar dos amigos — é o que torna o número comparável.
  const rows: Row[] = [
    ...data.friends.map((f) => ({ ...f, me: false })),
    {
      id: user.id, name: user.name, username: user.username, totalXp: user.totalXp, level: user.level,
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

      {/* O @ é a identidade visível: não obriga ninguém a ditar um código. */}
      <div className="card mt-5 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-subtle">Jogue com amigos</p>
        <p className="mt-2 text-base font-bold text-title">Envie um pedido pelo @</p>
        <p className="mt-1 text-sm text-subtle">
          A amizade e o perfil completo só aparecem depois que a outra pessoa aceitar.
        </p>
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          className="field flex-1"
          placeholder="@USUÁRIO" aria-label="@ do amigo"
          value={username} maxLength={21}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
        />
        <button className="btn-primary px-5" disabled={sendMut.isPending || !username.trim()}>
          {sendMut.isPending ? '...' : 'Enviar'}
        </button>
      </form>
      {msg && <p className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-primary' : 'text-error'}`} role="status">{msg.text}</p>}

      {data.incomingRequests.length > 0 && (
        <section className="mt-7" aria-labelledby="incoming-title">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 id="incoming-title" className="font-bold text-title">Pedidos recebidos</h2>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-black text-white">
              {data.incomingRequests.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {data.incomingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                incoming
                busy={(
                  acceptMut.isPending && acceptMut.variables === request.id
                ) || (
                  deleteRequestMut.isPending && deleteRequestMut.variables === request.id
                )}
                onAccept={() => {
                  setMsg(null);
                  acceptMut.mutate(request.id);
                }}
                onDelete={() => {
                  setMsg(null);
                  deleteRequestMut.mutate(request.id);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {data.outgoingRequests.length > 0 && (
        <section className="mt-7" aria-labelledby="outgoing-title">
          <h2 id="outgoing-title" className="mb-2.5 font-bold text-title">Aguardando resposta</h2>
          <div className="space-y-2.5">
            {data.outgoingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                busy={deleteRequestMut.isPending && deleteRequestMut.variables === request.id}
                onDelete={() => {
                  setMsg(null);
                  deleteRequestMut.mutate(request.id);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {data.friends.length === 0 ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <Mascot mood="think" size={120} />
          <p className="mt-3 font-bold text-title">Ainda sem amizades aceitas</p>
          <p className="mt-1 max-w-xs text-sm text-subtle">
            Treinar junto rende mais: com amigo na lista, o XP vira disputa e a sequência vira compromisso.
          </p>
        </div>
      ) : (
        <>
          {/* A frase que dá sentido ao placar: onde você está e o que falta. */}
          <div className="mt-6 rounded-2xl border border-line bg-card2 px-4 py-3 text-sm">
            {myPos === 1 ? (
              <p className="flex items-center gap-1.5 font-bold text-title"><IconMedal place={1} size={18} /> Você lidera entre {rows.length} — segure o topo.</p>
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
                onView={() => navigate(r.me ? '/profile' : `/friends/${r.id}`)}
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

function RequestCard({ request, incoming = false, busy, onAccept, onDelete }: {
  request: FriendRequestView;
  incoming?: boolean;
  busy: boolean;
  onAccept?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5">
      <Avatar name={request.user.name} size={42} src={request.user.avatar} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-title">{request.user.name}</p>
        <p className="truncate text-xs text-subtle">
          {request.user.username ? `@${request.user.username}` : 'Conta sem @ público'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {incoming && onAccept && (
          <button
            type="button"
            onClick={onAccept}
            disabled={busy}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white active:scale-90 disabled:opacity-50"
            aria-label={`Aceitar solicitação de ${request.user.name}`}
            title="Aceitar"
          >
            <IconCheck size={20} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card2 text-subtle active:scale-90 disabled:opacity-50"
          aria-label={`${incoming ? 'Recusar' : 'Cancelar'} solicitação de ${request.user.name}`}
          title={incoming ? 'Recusar' : 'Cancelar'}
        >
          <IconX size={19} />
        </button>
      </div>
    </div>
  );
}

function RankRow({ row, pos, achievements, accent, onView, onRemove }: {
  row: Row; pos: number;
  achievements: Parameters<typeof ProfileBadge>[0]['achievements'];
  accent: boolean;
  onView: () => void;
  onRemove?: () => void;
}) {
  return (
    // gap-2.5 em vez de 3: com medalha + avatar + XP + remover, cada 2px de
    // folga vira caractere a mais do nome numa tela de 360px.
    <div className={`flex items-center gap-2.5 rounded-2xl border p-3 ${
      accent ? 'border-primary/60 bg-primary/10' : 'border-line bg-card'
    }`}>
      <button onClick={onView} className="flex min-w-0 flex-1 items-center gap-2.5 text-left active:scale-[0.99]" aria-label={`Ver perfil de ${row.name}`}>
        <span className="w-6 shrink-0 text-center text-sm font-black tabular-nums text-subtle">
          {pos <= 3 ? <IconMedal place={pos as 1 | 2 | 3} size={22} /> : `${pos}º`}
        </span>
        <Avatar name={row.name} size={38} ring={accent} src={row.avatar} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-bold text-title">
            <span className="truncate">{row.name}</span>
            {accent && <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-primary">você</span>}
            {row.isDev && <span className="shrink-0" title="Conta DEV"><AchievementBadge code="DEV" size={16} /></span>}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-subtle">
            {/* @ quando existe; senão o nível. É a identidade estável do amigo. */}
            <span className="truncate">{row.username ? `@${row.username}` : row.levelName}</span>
            {/* A vitrine dele — é o que faz escolher badge valer alguma coisa. */}
            {row.showcaseBadges.slice(0, 2).map((id) => (
              <ProfileBadge key={id} id={id} achievements={achievements} assumeOwned={!row.me} size={16} />
            ))}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-black tabular-nums text-title">{row.totalXp.toLocaleString('pt-BR')}</p>
          <p className="flex items-center justify-end gap-0.5 text-xs tabular-nums text-subtle">{row.currentStreak}<IconFlame size={12} className="text-gold" /></p>
        </div>
      </button>
      {onRemove && (
        <button onClick={onRemove} className="shrink-0 text-subtle active:scale-90" aria-label={`Remover ${row.name}`}>
          <IconX size={16} />
        </button>
      )}
    </div>
  );
}
