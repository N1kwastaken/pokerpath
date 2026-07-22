import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { SHOWCASE_MAX, achievementBadgeId, streakBadgeId, STREAK_BADGE_DAYS } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { useAchievements } from '../hooks/useGame.js';
import { userApi } from '../api/game.js';
import { sound } from '../lib/sound.js';
import { fileToAvatar } from '../lib/avatarFile.js';
import { ProfileBadge, badgeName } from '../components/ProfileBadge.js';
import { Avatar } from '../components/Avatar.js';
import { IconChevron, IconSettings, IconCheck, IconCamera } from '../components/Icons.js';

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
  const [avatarErr, setAvatarErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showcaseMut = useMutation({
    mutationFn: (badges: string[]) => userApi.setShowcase(badges),
    onSuccess: (u) => setUser(u),
  });

  const avatarMut = useMutation({
    mutationFn: (avatar: string | null) => userApi.setAvatar(avatar),
    onSuccess: (u) => { sound.correct(); setUser(u); setAvatarErr(null); },
    onError: (e: unknown) => setAvatarErr(e instanceof Error ? e.message : 'Não deu para salvar a foto.'),
  });

  /** Reduz no aparelho antes de enviar (a foto da galeria tem megabytes). */
  async function pickAvatar(file: File) {
    setAvatarErr(null);
    try {
      avatarMut.mutate(await fileToAvatar(file));
    } catch (e) {
      setAvatarErr(e instanceof Error ? e.message : 'Não foi possível ler a imagem.');
    }
  }

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
      {/* ── Banner + avatar (a "capa" da conta) ──
          O banner SANGRA até a borda física: desfaz o padding de safe-area do
          AppShell com margem negativa e devolve o mesmo valor como padding
          interno, então a arte sobe até em cima mas a engrenagem não fica
          embaixo do relógio do sistema. */}
      <div
        className="relative"
        style={{ marginTop: 'calc(env(safe-area-inset-top) * -1)', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div
          className="h-32 w-full"
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
          className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
        >
          <IconSettings size={20} />
        </Link>

        {/* avatar sobreposto — toque troca a foto */}
        <div className="absolute -bottom-10 left-5">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={avatarMut.isPending}
            aria-label="Trocar foto de perfil"
            className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-bg p-1.5 active:scale-95 disabled:opacity-70"
          >
            {/* O próprio usuário usa a COR DO APP (a que ele escolheu); os
                outros ganham cor derivada do nome, no Avatar. */}
            <Avatar name={user.name} size={84} color="rgb(var(--primary))" src={user.avatar} />
            <span className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-card text-title ring-2 ring-bg">
              <IconCamera size={15} />
            </span>
          </button>
        </div>
      </div>

      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ''; // permite reescolher o MESMO arquivo depois
          if (f) pickAvatar(f);
        }}
      />

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
            {avatarErr && <p className="mt-1 text-xs font-semibold text-error" role="alert">{avatarErr}</p>}
            {user.avatar && (
              <button
                onClick={() => { sound.click(); avatarMut.mutate(null); }}
                disabled={avatarMut.isPending}
                className="mt-1 text-xs font-bold text-subtle underline underline-offset-2 active:opacity-70"
              >
                Remover foto
              </button>
            )}
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
