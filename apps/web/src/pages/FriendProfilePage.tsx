import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { AchievementView, FriendBadgeView } from '@pokerpath/shared';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { sound } from '../lib/sound.js';
import { speakLabel } from '../lib/speech.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Avatar } from '../components/Avatar.js';
import { AchievementBadge } from '../components/AchievementBadge.js';
import { ProfileBadge } from '../components/ProfileBadge.js';
import { PathWatermark } from '../components/BrandMark.js';
import { IconFlame, IconTrophy } from '../components/Icons.js';

/**
 * Perfil social: fica atrás da relação de amizade no servidor. A página só
 * recebe identidade, XP, sequência e badges — nunca e-mail ou plano do amigo.
 */
export function FriendProfilePage() {
  const navigate = useNavigate();
  const { friendId } = useParams();
  const [badgeNote, setBadgeNote] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: ['friend-profile', friendId],
    queryFn: () => gameApi.friendProfile(friendId!),
    enabled: !!friendId,
    retry: false,
  });

  if (profileQuery.isLoading) return <LogoLoader label="Abrindo o perfil..." />;
  if (!profileQuery.data) {
    const message = profileQuery.error instanceof ApiError && profileQuery.error.code === 'FRIEND_NOT_FOUND'
      ? 'Esse perfil não está disponível. Talvez a amizade tenha sido removida.'
      : 'Não foi possível abrir o perfil agora.';
    return (
      <div className="px-5 py-8">
        <button onClick={() => navigate('/friends')} className="text-sm font-medium text-subtle">← Amigos</button>
        <div className="card mt-5 p-5 text-center">
          <p className="font-bold text-title">Perfil indisponível</p>
          <p className="mt-1 text-sm text-subtle">{message}</p>
        </div>
      </div>
    );
  }

  const friend = profileQuery.data;
  // ProfileBadge usa a lista para confirmar a arte de achievement. Ela precisa
  // ser a lista DO AMIGO, não a coleção de quem está olhando o perfil.
  const friendAchievements: AchievementView[] = friend.badges.flatMap((badge) => (
    badge.id.startsWith('ach:')
      ? [{
          code: badge.id.slice(4),
          name: badge.name,
          description: badge.description,
          icon: '',
          unlocked: true,
          unlockedAt: null,
        }]
      : []
  ));
  const showcased = friend.showcaseBadges
    .map((id) => friend.badges.find((badge) => badge.id === id))
    .filter((badge): badge is FriendBadgeView => !!badge);

  function announceBadge(badge: FriendBadgeView | { name: string }) {
    sound.click();
    speakLabel(badge.name);
    setBadgeNote(badge.name);
  }

  return (
    <div className="pb-8">
      <div className="relative h-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--primary2)) 58%, rgb(var(--card)) 100%)' }}>
        <div className="h-full w-full opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 12px)' }} />
        <PathWatermark className="pointer-events-none absolute -right-6 -top-1 h-36 w-72 text-white/45" />
        <button
          onClick={() => navigate('/friends')}
          className="absolute left-5 top-5 rounded-full bg-black/30 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm active:scale-95"
        >
          ← Amigos
        </button>
      </div>

      <div className="px-5 pt-0">
        <div className="flex items-end gap-3">
          <div className="-mt-10 rounded-full bg-bg p-1.5">
            <Avatar name={friend.name} size={84} src={friend.avatar} />
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="flex items-center gap-2 truncate text-2xl font-black text-title">
              <span className="truncate">{friend.name}</span>
              {friend.isDev && <span title="Conta DEV" className="shrink-0"><AchievementBadge code="DEV" size={24} /></span>}
            </h1>
            {friend.username && <p className="truncate text-sm font-semibold text-subtle">@{friend.username}</p>}
            <p className="mt-0.5 truncate text-xs text-subtle">{friend.levelName}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Mini value={friend.totalXp.toLocaleString('pt-BR')} label="XP total" />
          <Mini value={`${friend.currentStreak}`} label="Sequência" icon={<IconFlame size={16} className="text-gold" />} />
          <Mini value={`${friend.maxStreak}`} label="Recorde" />
        </div>

        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">Vitrine</h2>
          {showcased.length === 0 ? (
            <div className="card p-4 text-sm text-subtle">{friend.name} ainda não escolheu badges para a vitrine.</div>
          ) : (
            <div className="card flex flex-wrap gap-3 p-4">
              {showcased.map((id) => (
                <BadgeButton key={id.id} badge={id} achievements={friendAchievements} onClick={() => announceBadge(id)} size={46} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-subtle"><IconTrophy size={15} className="text-gold" /> Badges conquistados</h2>
            <span className="text-xs font-semibold text-subtle">{friend.badges.length + (friend.isDev ? 1 : 0)}</span>
          </div>
          {friend.badges.length === 0 && !friend.isDev ? (
            <div className="card p-4 text-sm text-subtle">As primeiras conquistas de {friend.name} vão aparecer aqui.</div>
          ) : (
            <div className="card flex flex-wrap gap-3 p-4">
              {friend.isDev && (
                <button
                  onClick={() => announceBadge({ name: 'Conta DEV' })}
                  className="rounded-full active:scale-95"
                  aria-label="Badge: Conta DEV"
                  title="Conta DEV"
                >
                  <AchievementBadge code="DEV" size={44} />
                </button>
              )}
              {friend.badges.map((badge) => (
                <BadgeButton key={badge.id} badge={badge} achievements={friendAchievements} onClick={() => announceBadge(badge)} />
              ))}
            </div>
          )}
          {badgeNote && <p className="mt-2 text-sm font-semibold text-primary" role="status">{badgeNote}</p>}
        </section>
      </div>
    </div>
  );
}

function BadgeButton({ badge, achievements, onClick, size = 44 }: {
  badge: FriendBadgeView;
  achievements: AchievementView[];
  onClick: () => void;
  size?: number;
}) {
  return (
    <button onClick={onClick} className="rounded-full active:scale-95" aria-label={`Ouvir o nome da badge: ${badge.name}`} title={`Ouvir: ${badge.name}`}>
      <ProfileBadge id={badge.id} achievements={achievements} size={size} />
    </button>
  );
}

function Mini({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="card p-3 text-center">
      <p className="flex items-center justify-center gap-1 text-lg font-bold tabular-nums text-title">{value}{icon}</p>
      <p className="truncate text-[11px] text-subtle">{label}</p>
    </div>
  );
}
