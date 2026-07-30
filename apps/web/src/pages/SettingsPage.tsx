import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext.js';
import { useTheme } from '../lib/theme.js';
import { ACCENTS, applyAccent, currentAccent, unlockedAccents, unlockLabel } from '../lib/accent.js';
import { sound } from '../lib/sound.js';
import { a11y } from '../lib/a11y.js';
import {
  readTablePrefs,
  saveTablePrefs,
  type CardBackStyle,
  type FeltStyle,
  type TableBrandStyle,
  type TablePrefs,
} from '../lib/tablePrefs.js';
import { ApiError } from '../lib/api.js';
import { tokenStorage } from '../lib/tokenStorage.js';
import { gameApi, systemApi, userApi } from '../api/game.js';
import { IconLogout, IconChevron, IconLock, IconWrench } from '../components/Icons.js';
import { PasswordField } from '../components/PasswordField.js';
import { changePasswordSchema, ENERGY_ITEMS } from '@pokerpath/shared';

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
  const [tablePrefs, setTablePrefs] = useState(readTablePrefs);

  const { data: trail } = useQuery({ queryKey: ['trail'], queryFn: gameApi.trail });
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: systemApi.health,
    staleTime: 5 * 60_000,
    retry: 1,
  });
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
  function updateTablePrefs(patch: Partial<TablePrefs>) {
    const next = { ...tablePrefs, ...patch };
    saveTablePrefs(next);
    setTablePrefs(next);
    sound.click();
  }
  function confirmProgressReset() {
    if (window.confirm('Reiniciar TODO o seu progresso? Apaga XP, fases, conquistas, missões e streak. Não dá para desfazer.')) {
      run(() => gameApi.resetProgress());
    }
  }
  function confirmEconomyReset() {
    if (window.confirm('Zerar fichas, itens de energia e o histórico de recompensas? Use apenas para testar.')) {
      run(() => gameApi.debugResetEconomy());
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
                    {!isUnlocked && <span className="absolute inset-0 flex items-center justify-center"><IconLock size={13} className="text-white" /></span>}
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

      <Section title="Mesa de treino">
        <div className="p-4">
          <TablePreview prefs={tablePrefs} />
          <p className="mt-3 text-xs leading-snug text-subtle">
            Deixe a mesa com a sua cara. Essas escolhas são visuais e não alteram as decisões ou os ranges.
          </p>
        </div>
        <ChoiceRow<FeltStyle>
          label="Feltro"
          value={tablePrefs.felt}
          options={[
            { value: 'accent', label: 'Dinâmico' },
            { value: 'classic', label: 'Clássico' },
            { value: 'night', label: 'Noite' },
          ]}
          onChange={(felt) => updateTablePrefs({ felt })}
        />
        <ChoiceRow<CardBackStyle>
          label="Verso das cartas"
          value={tablePrefs.cardBack}
          options={[
            { value: 'accent', label: 'Cor do app' },
            { value: 'blue', label: 'Azul' },
            { value: 'ruby', label: 'Rubi' },
          ]}
          onChange={(cardBack) => updateTablePrefs({ cardBack })}
        />
        <ChoiceRow<TableBrandStyle>
          label="Marca no feltro"
          value={tablePrefs.brand}
          options={[
            { value: 'subtle', label: 'Discreta' },
            { value: 'hidden', label: 'Oculta' },
          ]}
          onChange={(brand) => updateTablePrefs({ brand })}
        />
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
            {user.debugSimulation ? 'Simulando FREE' : user.plan === 'PREMIUM' || user.isDev ? 'Ativo' : 'Conhecer'}
            <IconChevron size={16} />
          </span>
        </Link>
        <Link to="/tour" className="flex w-full items-center justify-between p-4 active:bg-card2">
          <span className="font-medium text-title">Rever tour de introdução</span>
          <IconChevron size={16} className="text-subtle" />
        </Link>
        <ChangePassword />
      </Section>

      <Section title="Legal">
        <Link to="/privacidade" className="flex w-full items-center justify-between p-4 active:bg-card2">
          <span className="font-medium text-title">Política de Privacidade</span>
          <IconChevron size={16} className="text-subtle" />
        </Link>
        <Link to="/termos" className="flex w-full items-center justify-between p-4 active:bg-card2">
          <span className="font-medium text-title">Termos de Uso</span>
          <IconChevron size={16} className="text-subtle" />
        </Link>
      </Section>

      <button
        onClick={logout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-error/30 bg-error/10 py-3.5 font-semibold text-error transition-colors hover:bg-error/15 active:scale-[0.98]"
      >
        <IconLogout size={18} /> Sair da conta
      </button>

      {/* ── Zona de perigo: exclusão de conta (LGPD) ── */}
      <DeleteAccount />

      <p className="mt-4 text-center text-[11px] text-subtle">
        <Link to="/privacidade" className="underline">Privacidade</Link> · <Link to="/termos" className="underline">Termos</Link>
        {health?.version && <> · versão {health.version}</>}
      </p>

      {/* A API também protege cada rota. Esta condição apenas não expõe a
          ferramenta para quem não faz parte da allow-list de desenvolvimento. */}
      {user.debugEnabled && (
        <div className="mt-8 rounded-2xl border border-dashed border-primary/45 bg-card2 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary"><IconWrench size={14} /> Central de debug</p>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">Plano</p>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugSetPlan('FREE', true))}>Simular FREE</DebugBtn>
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugSetPlan('PREMIUM', false))}>Acesso DEV</DebugBtn>
          </div>
          <p className="mt-1 text-[11px] text-subtle">
            {user.debugSimulation
              ? 'Simulação ativa: energia e bloqueios FREE valem de verdade; a central continua acessível.'
              : 'Acesso DEV ativo: conteúdo Premium, energia infinita e progressão liberada.'}
          </p>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">XP</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugAddXp(100))}>+100</DebugBtn>
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugAddXp(1000))}>+1000</DebugBtn>
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugAddXp(-100000))}>Zerar</DebugBtn>
          </div>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">Fichas</p>
          <div className="mt-1 grid grid-cols-3 gap-2">
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugSetCoins(100))}>Definir 100</DebugBtn>
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugSetCoins(1000))}>Definir 1.000</DebugBtn>
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugSetCoins(0))}>Zerar</DebugBtn>
          </div>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">Itens de energia</p>
          <div className="mt-1 grid grid-cols-1 gap-2">
            {ENERGY_ITEMS.map((item) => (
              <DebugBtn key={item.code} disabled={busy} onClick={() => run(() => gameApi.debugGrantEnergyItem(item.code))}>
                Liberar {item.name} (+{item.energyCapBonus})
              </DebugBtn>
            ))}
            <button onClick={confirmEconomyReset} disabled={busy}
              className="w-full rounded-xl border border-error/40 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10 active:scale-[0.98] disabled:opacity-50">
              ↺ Zerar economia
            </button>
          </div>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-subtle">Progresso</p>
          <div className="mt-1 grid grid-cols-1 gap-2">
            <DebugBtn disabled={busy} onClick={() => run(() => gameApi.debugCompleteAll())}>✓ Completar todos os mundos</DebugBtn>
            <button onClick={confirmProgressReset} disabled={busy}
              className="w-full rounded-xl border border-error/40 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10 active:scale-[0.98] disabled:opacity-50">
              ↺ Reiniciar progresso
            </button>
          </div>

          <p className="mt-3 text-[11px] text-subtle">Operações afetam apenas a sua conta de desenvolvimento.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Troca de senha dentro da sessão. O servidor confirma a senha atual, grava o
 * novo hash e revoga todas as sessões persistentes. O reload para /login
 * garante que este dispositivo também precise autenticar novamente.
 */
function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const change = useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: () => {
      tokenStorage.clear();
      window.location.href = '/login?password=changed';
    },
  });

  function close() {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setValidationError(null);
    change.reset();
  }

  function submit() {
    setValidationError(null);
    if (newPassword !== confirmation) {
      setValidationError('As novas senhas não conferem.');
      return;
    }
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      setValidationError(parsed.error.errors[0]?.message ?? 'Confira as senhas.');
      return;
    }
    change.mutate(parsed.data);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between p-4 text-left active:bg-card2"
      >
        <span>
          <span className="block font-medium text-title">Alterar senha</span>
          <span className="mt-0.5 block text-[11px] text-subtle">Encerra as outras sessões da conta.</span>
        </span>
        <IconChevron size={16} className="text-subtle" />
      </button>
    );
  }

  const error = validationError
    ?? (change.isError
      ? change.error instanceof ApiError
        ? change.error.message
        : 'Não foi possível alterar a senha.'
      : null);

  return (
    <div className="p-4">
      <p className="font-bold text-title">Crie uma nova senha</p>
      <p className="mt-1 text-xs leading-snug text-subtle">
        Por segurança, você precisará entrar novamente em todos os dispositivos.
      </p>
      <div className="mt-3 space-y-3">
        <PasswordField
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="Senha atual"
          autoComplete="current-password"
        />
        <PasswordField
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Nova senha (mín. 8 caracteres)"
          autoComplete="new-password"
        />
        <PasswordField
          value={confirmation}
          onChange={setConfirmation}
          placeholder="Confirme a nova senha"
          autoComplete="new-password"
        />
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-error" role="alert">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={close} className="btn-soft flex-1">Cancelar</button>
        <button
          type="button"
          onClick={submit}
          disabled={change.isPending}
          className="btn-primary flex-1"
        >
          {change.isPending ? 'Alterando...' : 'Alterar senha'}
        </button>
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

function ChoiceRow<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="p-4">
      <p className="mb-2 text-sm font-semibold text-title">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
              value === option.value
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-line bg-card2 text-subtle'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TablePreview({ prefs }: { prefs: TablePrefs }) {
  const felt = prefs.felt === 'classic'
    ? 'radial-gradient(ellipse, #1d704f, #082a1d)'
    : prefs.felt === 'night'
      ? 'radial-gradient(ellipse, #293630, #090e0c)'
      : 'radial-gradient(ellipse, color-mix(in srgb, rgb(var(--primary)) 70%, #10241a), #07110b)';
  const back = prefs.cardBack === 'blue' ? '#2f6fda' : prefs.cardBack === 'ruby' ? '#b93648' : 'rgb(var(--primary))';
  return (
    <div className="relative mx-auto h-28 w-52 rounded-[44%] border-[6px] border-black/55 shadow-inner" style={{ background: felt }}>
      {prefs.brand === 'subtle' && (
        <img
          src="/logo-mark-white.png"
          alt=""
          className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{ opacity: 0.09 }}
        />
      )}
      <span className="absolute bottom-3 left-1/2 h-8 w-6 -translate-x-5 -rotate-6 rounded border border-white/50" style={{ backgroundColor: back }} />
      <span className="absolute bottom-3 left-1/2 h-8 w-6 -translate-x-1 rotate-6 rounded border border-white/50" style={{ backgroundColor: back }} />
    </div>
  );
}

/**
 * Exclusão de conta (LGPD). Pede a senha porque é irreversível — token roubado
 * não apaga a conta. Ao concluir, limpa a sessão local (a conta já não existe,
 * então não dá para chamar logout no servidor) e volta à landing.
 */
function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const del = useMutation({
    mutationFn: (pw: string) => userApi.deleteAccount(pw),
    onSuccess: () => {
      // A conta já não existe: limpa a sessão local e recarrega do zero (o
      // reload reinicializa o auth a partir do storage vazio → landing).
      tokenStorage.clear();
      window.location.href = '/';
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 w-full rounded-2xl py-3 text-center text-sm font-semibold text-subtle underline underline-offset-2 active:opacity-70"
      >
        Excluir minha conta
      </button>
    );
  }
  return (
    <div className="mt-3 rounded-2xl border border-error/40 bg-error/10 p-4">
      <p className="font-bold text-error">Excluir a conta é permanente.</p>
      <p className="mt-1 text-xs text-text">
        Apaga XP, fases, conquistas, sequência, amigos e sua foto. Não dá para desfazer.
        Confirme com sua senha.
      </p>
      <input
        type="password" value={password} placeholder="Sua senha" autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)}
        className="field mt-3"
      />
      {del.isError && (
        <p className="mt-2 text-xs font-semibold text-error" role="alert">
          {del.error instanceof ApiError ? del.error.message : 'Não foi possível excluir.'}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => { setOpen(false); setPassword(''); }}
          className="btn-soft flex-1"
        >
          Cancelar
        </button>
        <button
          onClick={() => del.mutate(password)}
          disabled={!password || del.isPending}
          className="flex-1 rounded-2xl bg-error py-3.5 font-bold text-white disabled:opacity-50"
        >
          {del.isPending ? 'Excluindo...' : 'Excluir conta'}
        </button>
      </div>
    </div>
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
