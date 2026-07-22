import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { SHOWCASE_MAX, achievementBadgeId, streakBadgeId, STREAK_BADGE_DAYS } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { useAchievements } from '../hooks/useGame.js';
import { userApi } from '../api/game.js';
import { sound } from '../lib/sound.js';
import { ProfileBadge, badgeName } from '../components/ProfileBadge.js';
import { IconChevron, IconSettings, IconCheck } from '../components/Icons.js';

/**
 * Perfil — CARTÃO DE IDENTIDADE, não painel de controle.
 *
 * Estrutura de rede social (banner + avatar sobreposto + nome + vitrine):
 * o que a pessoa conquistou fica em cima, e toda a manutenção (tema, som,
 * acessibilidade, debug) mudou para /settings, atrás da engrenagem.
 */
export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { data: achievements } = useAchievements();
  const [picking, setPicking] = useState(false);

  const showcaseMut = useMutation({
    mutationFn: (badges: string[]) => userApi.setShowcase(badges),
    onSuccess: (u) => setUser(u),
  });

  if (!user) return null;
  const unlockedAch = (achievements ?? []).filter((a) => a.unlocked);
  const owned = [
    ...unlockedAch.map((a) => achievementBadgeId(a.code)),
    ...STREAK_BADGE_DAYS.filter((d) => user.maxStreak >= d).map(streakBadgeId),
  ];
  // Fonte da verdade é o servidor; durante o salvamento mostramos o otimista.
  const showcase = (showcaseMut.isPending ? showcaseMut.variables : user.showcaseBadges) ?? [];

  function toggleBadge(id: string) {
    sound.click();
    const has = showcase.includes(id);
    const next = has
      ? showcase.filter((b) => b !== id)
      // Cheio? o novo empurra o mais antigo — evita "desmarque um primeiro".
      : [...showcase, id].slice(-SHOWCASE_MAX);
    showcaseMut.mutate(next);
  }

  return (
    <div className="pb-8">
      {/* ── Banner + avatar (a "capa" da conta) ── */}
      <div className="relative">
        <div
          className="h-28 w-full"
          style={{
            background:
              'linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--primary2)) 55%, rgb(var(--card)) 100%)',
          }}
        >
          <div
            className="h-full w-full opacity-30"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 12px)' }}
          />
        </div>

        {/* engrenagem: a manutenção agora mora atrás deste botão */}
        <Link
          to="/settings" aria-label="Configurações"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm active:scale-95"
        >
          <IconSettings size={20} />
        </Link>

        {/* avatar sobreposto, com anel na cor do app */}
        <div className="absolute -bottom-10 left-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-bg p-1.5">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-4xl font-black text-white">
              {user.name.trim().charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-12">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-black text-title">
              <span className="truncate">{user.name}</span>
              {user.isDev && (
                <span title="Beta tester: premium liberado"
                  className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent">DEV</span>
              )}
            </h1>
            <p className="truncate text-sm text-subtle">{user.levelName} · {user.email}</p>
          </div>
          {/* vitrine ao lado do nome, como num cartão de perfil */}
          {showcase.length > 0 && (
            <div className="flex shrink-0 gap-1.5 pt-1">
              {showcase.map((id) => (
                <span key={id} title={badgeName(id, achievements ?? [])}>
                  <ProfileBadge id={id} achievements={achievements ?? []} size={38} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Vitrine ── */}
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-subtle">
              Vitrine · {showcase.length}/{SHOWCASE_MAX}
            </h2>
            <button
              onClick={() => { sound.click(); setPicking((p) => !p); }}
              className="text-xs font-bold text-primary active:opacity-70"
            >
              {picking ? 'Concluir' : 'Escolher'}
            </button>
          </div>

          {picking ? (
            owned.length === 0 ? (
              <p className="card p-4 text-sm text-subtle">
                Você ainda não tem badges. Desbloqueie conquistas ou chegue a 3 dias de sequência.
              </p>
            ) : (
              <div className="card p-4">
                <p className="mb-3 text-xs text-subtle">
                  Toque para exibir no perfil. Máximo de {SHOWCASE_MAX} — o terceiro substitui o mais antigo.
                </p>
                <div className="flex flex-wrap gap-3">
                  {owned.map((id) => {
                    const on = showcase.includes(id);
                    return (
                      <button key={id} onClick={() => toggleBadge(id)} title={badgeName(id, achievements ?? [])}
                        aria-pressed={on}
                        className={`relative rounded-full transition-transform ${on ? 'scale-105' : 'opacity-55'}`}>
                        <ProfileBadge id={id} achievements={achievements ?? []} size={48} />
                        {on && (
                          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-bg">
                            <IconCheck size={11} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : showcase.length === 0 ? (
            <button onClick={() => { sound.click(); setPicking(true); }}
              className="w-full rounded-2xl border border-dashed border-line bg-card p-4 text-sm text-subtle active:scale-[0.99]">
              Nenhum badge escolhido — toque para montar sua vitrine.
            </button>
          ) : (
            <div className="card flex items-center gap-3 p-4">
              {showcase.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <ProfileBadge id={id} achievements={achievements ?? []} size={40} />
                  <span className="text-sm font-semibold text-title">{badgeName(id, achievements ?? [])}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Números ── */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Mini value={user.totalXp.toLocaleString('pt-BR')} label="XP total" />
          <Mini value={`${user.currentStreak}🔥`} label="Sequência" />
          <Mini value={`${user.maxStreak}`} label="Recorde" />
        </div>

        {/* ── Navegação ── */}
        <nav className="mt-5 space-y-3">
          <NavLink to="/achievements" icon="🏆" label="Conquistas" />
          <NavLink to="/milestones" icon="🪜" label="Marcos" />
          <NavLink to="/friends" icon="👥" label="Amigos" />
          <NavLink to="/glossary" icon="📖" label="Glossário" />
        </nav>

        {user.isDev ? (
          <div className="mt-4 w-full rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center text-sm font-semibold text-accent">
            ⭐ Conta DEV — Premium liberado como beta tester. Obrigado por testar!
          </div>
        ) : (
          <Link to="/premium" className="btn-primary mt-4 w-full">⭐ Conhecer o Premium</Link>
        )}
      </div>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link to={to} className="flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 active:scale-[0.98]">
      <span className="flex items-center gap-2 font-medium text-title"><span className="text-lg">{icon}</span> {label}</span>
      <IconChevron size={18} className="text-subtle" />
    </Link>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-lg font-bold tabular-nums text-title">{value}</p>
      <p className="truncate text-[11px] text-subtle">{label}</p>
    </div>
  );
}
