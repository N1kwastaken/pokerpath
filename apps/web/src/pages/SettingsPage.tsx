import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext.js';
import { useTheme } from '../lib/theme.js';
import { ACCENTS, applyAccent, currentAccent, unlockedAccents, unlockLabel } from '../lib/accent.js';
import { sound } from '../lib/sound.js';
import { a11y } from '../lib/a11y.js';
import { gameApi, userApi } from '../api/game.js';
import { IconLogout, IconChevron } from '../components/Icons.js';

/**
 * Configurações — tudo que era "preferências" empilhado no perfil.
 *
 * Separar importa: o perfil é IDENTIDADE (quem você é, o que conquistou) e
 * configuração é MANUTENÇÃO. Misturados, o perfil virava um formulário e a
 * vitrine de conquistas ficava soterrada por interruptores.
 */
export function SettingsPage() {
  const { user, logout, setUser } = useAuth();
  const { theme, toggle } = useTheme();
  const queryClient = useQueryClient();
  const [accent, setAccent] = useState(currentAccent());
  const [muted, setMuted] = useState(sound.isMuted());
  const [reduceMotion, setReduceMotion] = useState(a11y.reduceMotion());
  const [largeText, setLargeText] = useState(a11y.largeText());
  const [haptics, setHaptics] = useState(a11y.haptics());

  const { data: trail } = useQuery({ queryKey: ['trail'], queryFn: gameApi.trail });
  const unlocked = unlockedAccents(trail, user?.maxStreak ?? 0);

  const debugMut = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => { queryClient.clear(); window.location.reload(); },
    onError: (e: unknown) => { window.alert('Falha no debug: ' + (e instanceof Error ? e.message : 'erro')); },
  });
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
      <Link to="/profile" className="mb-4 inline-block text-sm font-medium text-subtle">← Perfil</Link>
      <h1 className="mb-6 text-3xl font-bold text-title">Configurações</h1>

      <Section title="Aparência">
        <Toggle label="Tema escuro" on={theme === 'dark'} onChange={() => { sound.click(); toggle(); }} />
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-title">Cor do app</span>
            <div className="flex flex-wrap justify-end gap-2">
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
          <p className="mt-1.5 text-[11px] text-subtle">
            Cores são conquistadas jogando: uma por mundo concluído, duas por sequência (30 e 100 dias),
            prata ao terminar o jogo e ouro no 100% perfeito.
          </p>
        </div>
      </Section>

      <Section title="Som e vibração">
        <Toggle label="Efeitos sonoros" hint="Acerto, erro, combo e fanfarra."
          on={!muted} onChange={() => { const m = sound.toggleMute(); setMuted(m); if (!m) sound.click(); }} />
        <Toggle label="Vibração" hint="Resposta física a cada jogada (só em aparelhos com vibração)."
          on={haptics} onChange={() => { const v = !haptics; a11y.setHaptics(v); setHaptics(v); if (v) sound.click(); }} />
      </Section>

      <Section title="Acessibilidade">
        <Toggle
          label="Reduzir animações"
          hint="Desliga movimento, confete e transições. Segue o sistema por padrão."
          on={reduceMotion}
          onChange={() => { const v = !reduceMotion; a11y.setReduceMotion(v); setReduceMotion(v); sound.click(); }}
        />
        <Toggle
          label="Texto maior"
          hint="Aumenta a interface inteira em ~18%."
          on={largeText}
          onChange={() => { const v = !largeText; a11y.setLargeText(v); setLargeText(v); sound.click(); }}
        />
      </Section>

      <Section title="Notificações">
        <Toggle
          label="Lembrete de streak por e-mail"
          hint="Um aviso por dia, só quando a sequência estiver em risco."
          on={user.emailReminders}
          busy={remindersMut.isPending}
          onChange={() => remindersMut.mutate(!user.emailReminders)}
        />
      </Section>

      <Section title="Conta">
        <Link to="/premium" className="flex w-full items-center justify-between p-4 active:bg-card2">
          <span className="font-medium text-title">⭐ Premium</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-subtle">
            {user.plan === 'PREMIUM' || user.isDev ? 'Ativo' : 'Conhecer'}
            <IconChevron size={16} />
          </span>
        </Link>
        <Link to="/tour" className="flex w-full items-center justify-between p-4 active:bg-card2">
          <span className="font-medium text-title">Rever tour de introdução</span>
          <IconChevron size={16} className="text-subtle" />
        </Link>
      </Section>

      <button
        onClick={logout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-error/30 bg-error/10 py-3.5 font-semibold text-error transition-colors hover:bg-error/15 active:scale-[0.98]"
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
          <button onClick={confirmReset} disabled={busy}
            className="w-full rounded-xl border border-error/40 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10 active:scale-[0.98] disabled:opacity-50">
            ↺ Reiniciar progresso
          </button>
        </div>

        <p className="mt-3 text-[11px] text-subtle">Visível para todos, mas as ações de plano/XP/completar só funcionam na sua conta godmode.</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">{title}</h2>
      <div className="card divide-y divide-line">{children}</div>
    </section>
  );
}

/** Interruptor de verdade (role=switch): estado visível sem depender de cor. */
function Toggle({ label, hint, on, onChange, busy }: {
  label: string; hint?: string; on: boolean; onChange: () => void; busy?: boolean;
}) {
  return (
    <button
      role="switch" aria-checked={on} aria-label={label}
      onClick={onChange} disabled={busy}
      className="flex w-full items-center justify-between gap-3 p-4 text-left active:bg-card2 disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block font-medium text-title">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-snug text-subtle">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-card2 ring-1 ring-line'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? 'left-[1.375rem]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

function DebugBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="rounded-xl border border-line bg-card py-2.5 text-sm font-semibold text-title transition-colors hover:border-primary/50 active:scale-[0.98] disabled:opacity-50">
      {children}
    </button>
  );
}
