import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext.js';
import { useTheme } from '../lib/theme.js';
import { ACCENTS, applyAccent, currentAccent, unlockedAccents, unlockLabel } from '../lib/accent.js';
import { sound } from '../lib/sound.js';
import { gameApi, userApi } from '../api/game.js';
import { IconUser, IconLogout, IconChevron } from '../components/Icons.js';

/** Perfil — dados do usuário, preferências, logout e painel de debug. */
export function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const { theme, toggle } = useTheme();
  const [accent, setAccent] = useState(currentAccent());
  const queryClient = useQueryClient();
  // Cores são conquistadas pelo progresso — a trilha diz o que já foi liberado.
  const { data: trail } = useQuery({ queryKey: ['trail'], queryFn: gameApi.trail });
  const unlocked = unlockedAccents(trail);
  const [muted, setMuted] = useState(sound.isMuted());

  // Qualquer ação de debug recarrega para refletir o novo estado (XP, plano, etc.).
  const debugMut = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => { queryClient.clear(); window.location.reload(); },
    onError: (e: unknown) => { window.alert('Falha no debug: ' + (e instanceof Error ? e.message : 'erro')); },
  });

  // Lembrete por e-mail: atualiza só o usuário, sem recarregar a página.
  const remindersMut = useMutation({
    mutationFn: (on: boolean) => userApi.setEmailReminders(on),
    onSuccess: (u) => { sound.click(); setUser(u); },
  });

  function run(fn: () => Promise<unknown>) { debugMut.mutate(fn); }
  function confirmReset() {
    if (window.confirm('Reiniciar TODO o seu progresso? Apaga XP, fases, conquistas, missões e streak. Não dá para desfazer.')) {
      run(() => gameApi.resetProgress());
    }
  }

  if (!user) return null;
  const busy = debugMut.isPending;

  return (
    <div className="px-5 py-8">
      <h1 className="mb-6 text-3xl font-bold text-title">Perfil</h1>

      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <IconUser size={30} />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-lg font-bold text-title">
            {user.name}
            {user.isDev && (
              <span title="Beta tester: premium liberado" className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-accent">DEV</span>
            )}
          </p>
          <p className="truncate text-sm text-subtle">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Mini value={`${user.level}`} label={user.levelName} />
        <Mini value={user.totalXp.toLocaleString('pt-BR')} label="XP total" />
        <Mini value={`${user.currentStreak}🔥`} label="Streak" />
      </div>

      <h2 className="mb-3 mt-7 text-sm font-bold uppercase tracking-wide text-subtle">Preferências</h2>
      <div className="card divide-y divide-line">
        <Row label="Tema escuro" onClick={toggle} value={theme === 'dark' ? 'Ligado' : 'Desligado'} />
        <Row label="Som" onClick={() => setMuted(sound.toggleMute())} value={muted ? 'Mudo' : 'Ligado'} />
        <Row
          label="Lembrete de streak por e-mail"
          onClick={() => remindersMut.mutate(!user.emailReminders)}
          value={remindersMut.isPending ? '...' : user.emailReminders ? 'Ligado' : 'Desligado'}
        />
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-title">Cor do app</span>
            <div className="flex gap-2">
              {ACCENTS.map((a) => {
                const isUnlocked = unlocked.has(a.key);
                return (
                  <button key={a.key} aria-label={a.name} title={isUnlocked ? a.name : unlockLabel(a)}
                    disabled={!isUnlocked}
                    onClick={() => { sound.click(); applyAccent(a.key); setAccent(a.key); }}
                    className={`relative h-7 w-7 rounded-full transition-transform ${accent === a.key ? 'scale-110 ring-2 ring-title' : isUnlocked ? 'opacity-70' : 'opacity-30'}`}
                    style={{ backgroundColor: a.hex }}>
                    {!isUnlocked && <span className="absolute inset-0 flex items-center justify-center text-[11px]">🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-subtle">Novas cores são conquistadas jogando: uma por nível — prata ao terminar o jogo e ouro no 100% perfeito.</p>
        </div>
      </div>

      <Link to="/friends" className="mt-4 flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 active:scale-[0.98]">
        <span className="flex items-center gap-2 font-medium text-title"><span className="text-lg">👥</span> Amigos</span>
        <IconChevron size={18} className="text-subtle" />
      </Link>

      <Link to="/achievements" className="mt-3 flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 active:scale-[0.98]">
        <span className="flex items-center gap-2 font-medium text-title"><span className="text-lg">🏆</span> Conquistas</span>
        <IconChevron size={18} className="text-subtle" />
      </Link>

      <Link to="/milestones" className="mt-3 flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 active:scale-[0.98]">
        <span className="flex items-center gap-2 font-medium text-title"><span className="text-lg">🪜</span> Marcos</span>
        <IconChevron size={18} className="text-subtle" />
      </Link>

      <Link to="/glossary" className="mt-3 flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 active:scale-[0.98]">
        <span className="flex items-center gap-2 font-medium text-title"><span className="text-lg">📖</span> Glossário</span>
        <IconChevron size={18} className="text-subtle" />
      </Link>

      <Link to="/tour" className="mt-3 flex w-full items-center justify-between rounded-2xl border border-line bg-card p-4 active:scale-[0.98]">
        <span className="font-medium text-title">Rever tour de introdução</span>
        <IconChevron size={18} className="text-subtle" />
      </Link>

      {user.isDev ? (
        <div className="mt-4 w-full rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center text-sm font-semibold text-accent">
          ⭐ Conta DEV — você tem o Premium liberado como beta tester. Obrigado por testar!
        </div>
      ) : (
        <Link to="/premium" className="btn-primary mt-4 w-full">⭐ Conhecer o Premium</Link>
      )}
      <button
        onClick={logout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-error/30 bg-error/10 py-3.5 font-semibold text-error transition-colors hover:bg-error/15 active:scale-[0.98]"
      >
        <IconLogout size={18} /> Sair da conta
      </button>

      {/* ── Painel de debug (godmode) ── */}
      <div className="mt-8 rounded-2xl border border-dashed border-line bg-card2 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-subtle">🛠️ Debug (godmode)</p>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">Plano</p>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugSetPlan('FREE'))}>Definir FREE</DebugBtn>
          <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugSetPlan('PREMIUM'))}>Definir PREMIUM</DebugBtn>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">XP</p>
        <div className="mt-1 grid grid-cols-3 gap-2">
          <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugAddXp(100))}>+100</DebugBtn>
          <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugAddXp(1000))}>+1000</DebugBtn>
          <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugAddXp(-100000))}>Zerar</DebugBtn>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">Progresso</p>
        <div className="mt-1 grid grid-cols-1 gap-2">
          <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugCompleteAll())}>✓ Completar todos os mundos</DebugBtn>
          <button
            onClick={confirmReset}
            disabled={busy}
            className="w-full rounded-xl border border-error/40 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10 active:scale-[0.98] disabled:opacity-50"
          >
            ↺ Reiniciar progresso
          </button>
        </div>

        <p className="mt-3 text-[11px] text-subtle">Visível para todos, mas as ações de plano/XP/completar só funcionam na sua conta godmode.</p>
      </div>
    </div>
  );
}

function DebugBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-line bg-card py-2.5 text-sm font-semibold text-title transition-colors hover:border-primary/50 active:scale-[0.98] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-lg font-bold text-title">{value}</p>
      <p className="truncate text-[11px] text-subtle">{label}</p>
    </div>
  );
}
function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between p-4 text-left active:bg-card2">
      <span className="font-medium text-title">{label}</span>
      <span className="text-sm font-semibold text-primary">{value}</span>
    </button>
  );
}
