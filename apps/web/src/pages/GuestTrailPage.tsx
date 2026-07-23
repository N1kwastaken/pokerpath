import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { guestApi } from '../api/guest.js';
import { guestDone } from '../lib/guestProgress.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { Mascot } from '../components/Mascot.js';
import { IconCheck, IconGrad, IconBook, IconLock } from '../components/Icons.js';
import { sound } from '../lib/sound.js';

/**
 * Trilha do MODO CONVIDADO: só o Mundo 0 (fundamentos), jogável sem conta.
 * Progresso em localStorage; criar a conta "gradua" tudo automaticamente.
 */
export function GuestTrailPage() {
  const navigate = useNavigate();
  const { data: world, isLoading } = useQuery({ queryKey: ['guest-world0'], queryFn: guestApi.world0 });
  const done = new Set(guestDone());

  if (isLoading) return <LogoLoader label="Preparando a mesa..." />;
  if (!world) return null;

  const firstOpen = world.stages.findIndex((s) => !done.has(s.id));

  return (
    <div
      className="min-h-dvh px-5 py-8"
      style={{ background: 'radial-gradient(120% 90% at 50% 0%, var(--felt-tint, transparent), transparent)' }}
    >
      {/* Cabeçalho com o Ace */}
      <div className="flex items-center gap-3">
        <Mascot mood="wave" size={72} float={false} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Modo visitante</p>
          <h1 className="text-2xl font-extrabold leading-tight text-title">{world.icon} {world.name}</h1>
          <p className="text-sm text-subtle">{world.description}</p>
        </div>
      </div>

      {/* Já jogou? Prova de nivelamento (via conta) */}
      <Link to="/setup" className="mt-5 flex items-center justify-between rounded-2xl border border-gold/40 bg-gold/10 p-4 active:scale-[0.98]">
        <div>
          <p className="font-bold text-title">Já jogou poker antes?</p>
          <p className="text-sm text-subtle">Crie a conta e faça a prova de nivelamento — pule direto pro seu nível.</p>
        </div>
        <IconGrad size={22} className="text-primary" />
      </Link>

      {/* Fases do Mundo 0 */}
      <div className="mt-6 space-y-3">
        {world.stages.map((s, i) => {
          const isDone = done.has(s.id);
          const isOpen = isDone || i <= (firstOpen === -1 ? world.stages.length : firstOpen);
          return (
            <button
              key={s.id}
              disabled={!isOpen}
              onClick={() => { sound.click(); navigate(`/g/stages/${s.id}`); }}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition
                ${isDone ? 'border-gold/50 bg-gold/10' : isOpen ? 'border-line bg-card active:scale-[0.98]' : 'border-line bg-card opacity-45'}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 text-lg font-black
                ${isDone ? 'border-gold bg-gold text-white' : isOpen ? 'border-primary bg-primary text-white' : 'border-line bg-card2 text-subtle'}`}>
                {isDone ? <IconCheck size={20} /> : s.isLesson ? <IconBook size={18} /> : '♠'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-title">{s.title}</span>
                <span className="block truncate text-sm text-subtle">{s.description}</span>
              </span>
              {!isOpen && <IconLock size={18} />}
            </button>
          );
        })}
      </div>

      {/* CTA fixo: criar conta */}
      <div className="mt-8 rounded-3xl border border-primary/30 bg-primary/10 p-5 text-center">
        <p className="font-bold text-title">Curtiu? Os outros {3} níveis (do preflop ao river) esperam por você.</p>
        <p className="mt-1 text-sm text-subtle">Crie a conta grátis: seu progresso daqui é levado junto, com XP, streak e conquistas.</p>
        <Link to="/setup" className="btn-primary mt-4 block w-full">Criar conta grátis →</Link>
        <Link to="/login" className="btn-ghost mt-2 block w-full">Já tenho conta</Link>
      </div>
    </div>
  );
}
