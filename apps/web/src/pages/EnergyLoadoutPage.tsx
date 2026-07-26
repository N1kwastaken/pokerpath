import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEconomy, useEnergy } from '../hooks/useGame.js';
import { gameApi } from '../api/game.js';
import { ApiError } from '../lib/api.js';
import { sound } from '../lib/sound.js';
import { LogoLoader } from '../components/LogoLoader.js';
import { IconBolt, IconCheck, IconLock, IconStar } from '../components/Icons.js';

/**
 * Loadout de energia: itens permanentes, preço fixo e carteira conquistada.
 * Não há moeda vendida, giro ou chance escondida nesta tela.
 */
export function EnergyLoadoutPage() {
  const { data: economy, isLoading } = useEconomy();
  const { data: energy } = useEnergy();
  const queryClient = useQueryClient();

  const unlock = useMutation({
    mutationFn: (code: string) => gameApi.unlockEnergyItem(code),
    onSuccess: (result) => {
      sound.levelUp();
      queryClient.setQueryData(['economy'], result.economy);
      queryClient.invalidateQueries({ queryKey: ['energy'] });
    },
  });

  if (isLoading || !economy) return <LogoLoader label="Preparando seus itens..." />;
  const error = unlock.error instanceof ApiError ? unlock.error.message : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-5">
      <Link to="/" className="text-sm font-semibold text-subtle">← Início</Link>
      <header className="mt-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Loadout</p>
        <h1 className="mt-1 text-3xl font-black text-title">Fôlego de treino</h1>
        <p className="mt-2 text-sm text-subtle">
          Cada exercício usa 1 energia. Aulas são gratuitas; o fôlego recarrega no dia seguinte.
        </p>
      </header>

      <section className="hero-surface surface-grid mt-5 overflow-hidden p-5">
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/75">Energia de hoje</p>
            <p className="mt-1 text-4xl font-black tabular-nums">
              {energy?.infinite ? '∞' : `${energy?.remaining ?? 0}/${energy?.max ?? economy.energyCap}`}
            </p>
            <p className="mt-1 text-xs font-semibold text-white/80">
              Cap base {economy.baseEnergyCap}{economy.energyCapBonus > 0 ? ` + ${economy.energyCapBonus} de itens` : ''}
            </p>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 text-white shadow-pop">
            <IconBolt size={38} />
          </span>
        </div>
      </section>

      <section className="mt-4 card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-subtle">Fichas conquistadas</p>
            <p className="mt-0.5 text-3xl font-black tabular-nums text-gold">{economy.coins}</p>
          </div>
          <IconStar size={34} className="text-gold" />
        </div>
        <p className="mt-2 text-xs text-subtle">
          +{economy.perfectStageCoinReward} fichas na primeira sessão perfeita de cada fase. Sem compra com dinheiro.
        </p>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-black uppercase tracking-wide text-subtle">Itens de capacidade</h2>
          <span className="text-xs font-semibold text-subtle">cap máximo {economy.baseEnergyCap + economy.items.reduce((sum, item) => sum + item.energyCapBonus, 0)}</span>
        </div>
        <div className="space-y-3">
          {economy.items.map((item) => {
            const affordable = economy.coins >= item.coinCost;
            const pending = unlock.isPending && unlock.variables === item.code;
            return (
              <article key={item.code} className={`card flex items-center gap-3 p-4 ${item.unlocked ? 'border-primary/35 bg-primary/5' : ''}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${item.unlocked ? 'bg-primary/15 text-primary' : 'bg-card2 text-subtle'}`} aria-hidden>
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-black text-title">{item.name}</h3>
                    <span className="shrink-0 rounded-full bg-call/12 px-2 py-0.5 text-[11px] font-black text-call">+{item.energyCapBonus}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-subtle">{item.description}</p>
                </div>
                {item.unlocked ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-xl bg-primary/15 px-2.5 py-2 text-xs font-black text-primary"><IconCheck size={14} /> Ativo</span>
                ) : (
                  <button
                    type="button"
                    disabled={!affordable || unlock.isPending}
                    onClick={() => unlock.mutate(item.code)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${affordable ? 'bg-gold text-black' : 'bg-card2 text-subtle'}`}
                    title={affordable ? `Desbloquear por ${item.coinCost} fichas` : 'Conquiste mais fichas em fases perfeitas'}
                  >
                    {pending ? '...' : affordable ? <span className="flex items-center gap-1"><IconStar size={13} /> {item.coinCost}</span> : <span className="flex items-center gap-1"><IconLock size={13} /> {item.coinCost}</span>}
                  </button>
                )}
              </article>
            );
          })}
        </div>
        {error && <p className="mt-3 rounded-xl bg-error/10 p-3 text-xs font-semibold text-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
