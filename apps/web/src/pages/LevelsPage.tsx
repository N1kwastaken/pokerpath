import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { USER_LEVELS, levelProgress } from '@pokerpath/shared';
import { useAuth } from '../auth/AuthContext.js';
import { gameApi } from '../api/game.js';
import { ACCENTS, unlockedAccents, unlockLabel } from '../lib/accent.js';
import { IconCheck, IconLock } from '../components/Icons.js';

/**
 * Níveis e recompensas.
 *
 * Importante: as três progressões do app são INDEPENDENTES e a tela explica
 * cada uma, em vez de fingir que tudo sai do XP:
 *   • Nível (XP)  → o título (Fish → Poker Master).
 *   • Cores       → concluir cada mundo (prata/ouro no fim do jogo).
 *   • Conquistas  → feitos específicos (streak, acertos seguidos…).
 */
export function LevelsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: trail } = useQuery({ queryKey: ['trail'], queryFn: gameApi.trail });
  const { data: achievements } = useQuery({ queryKey: ['achievements'], queryFn: gameApi.achievements });

  if (!user) return null;
  const prog = levelProgress(user.totalXp);
  const unlocked = unlockedAccents(trail, user?.maxStreak ?? 0);

  return (
    <div className="px-5 py-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-subtle">← Voltar</button>
      <h1 className="text-3xl font-bold text-title">Níveis</h1>
      <p className="mt-1 text-sm text-subtle">Seu título sobe com o XP. Jogar qualquer fase dá XP.</p>

      {/* Nível atual + barra até o próximo */}
      <div className="card mt-5 p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-subtle">Nível {prog.current.level}</p>
            <p className="text-2xl font-extrabold text-title">{prog.current.name}</p>
          </div>
          <p className="text-right text-sm font-bold tabular-nums text-title">
            {user.totalXp.toLocaleString('pt-BR')} XP
          </p>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-card2">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${prog.pct}%` }} />
        </div>

        {prog.next ? (
          <p className="mt-2 text-sm text-subtle">
            Faltam <b className="text-title">{prog.xpToNext.toLocaleString('pt-BR')} XP</b> para{' '}
            <b className="text-primary">{prog.next.name}</b>
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-gold">Nível máximo — você chegou ao topo 👑</p>
        )}
      </div>

      {/* Escada completa */}
      <h2 className="mb-2 mt-7 text-sm font-bold uppercase tracking-wide text-subtle">Todos os níveis</h2>
      <div className="card divide-y divide-line">
        {USER_LEVELS.map((lv) => {
          const reached = user.totalXp >= lv.xpRequired;
          const isCurrent = lv.level === prog.current.level;
          return (
            <div key={lv.level} className={`flex items-center gap-3 p-4 ${isCurrent ? 'bg-primary/5' : ''}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                reached ? 'bg-primary text-white' : 'bg-card2 text-subtle'
              }`}>
                {reached ? <IconCheck size={18} /> : lv.level}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-bold ${reached ? 'text-title' : 'text-subtle'}`}>
                  {lv.name}
                  {isCurrent && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-white">você</span>}
                </span>
                <span className="block text-xs text-subtle">{lv.xpRequired.toLocaleString('pt-BR')} XP</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Trilhas de recompensa — cada uma tem a SUA condição. */}
      <h2 className="mb-2 mt-7 text-sm font-bold uppercase tracking-wide text-subtle">O que você desbloqueia</h2>

      <div className="card p-4">
        <p className="font-bold text-title">🎨 Cores do app</p>
        <p className="mt-0.5 text-xs text-subtle">Liberadas ao concluir cada mundo — não pelo XP.</p>
        <div className="mt-3 space-y-2">
          {ACCENTS.map((a) => {
            const on = unlocked.has(a.key);
            return (
              <div key={a.key} className="flex items-center gap-2.5">
                <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-line" style={{ backgroundColor: a.hex, opacity: on ? 1 : 0.35 }} />
                <span className={`flex-1 text-sm font-semibold ${on ? 'text-title' : 'text-subtle'}`}>{a.name}</span>
                {on ? (
                  <span className="text-xs font-bold text-primary">Liberada</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-subtle"><IconLock size={12} />{unlockLabel(a)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mt-3 p-4">
        <p className="font-bold text-title">🏆 Conquistas</p>
        <p className="mt-0.5 text-xs text-subtle">Cada uma tem seu próprio feito — também não dependem do XP.</p>
        <div className="mt-3 space-y-2">
          {(achievements ?? []).map((a) => (
            <div key={a.code} className="flex items-center gap-2.5">
              <span className={`text-lg ${a.unlocked ? '' : 'opacity-30 grayscale'}`}>{a.icon}</span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${a.unlocked ? 'text-title' : 'text-subtle'}`}>{a.name}</span>
                <span className="block text-[11px] leading-tight text-subtle">{a.description}</span>
              </span>
              {a.unlocked && <span className="shrink-0 text-xs font-bold text-primary">✓</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
