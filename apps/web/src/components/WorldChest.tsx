import { useState } from 'react';
import type { WorldRewardView } from '@pokerpath/shared';
import { Avatar } from './Avatar.js';
import { IconGift, IconSparkles } from './Icons.js';
import { sound } from '../lib/sound.js';

/**
 * O baú é uma celebração de conclusão, não uma loteria: o conteúdo já foi
 * escolhido e gravado pelo servidor antes de esta tela aparecer.
 */
export function WorldChest({ reward, playerName }: {
  reward: WorldRewardView;
  playerName: string;
}) {
  const [opened, setOpened] = useState(false);

  if (!opened) {
    return (
      <button
        onClick={() => { sound.correct(); setOpened(true); }}
        className="card mt-5 w-full overflow-hidden border-gold/50 bg-gold/10 p-4 text-left active:scale-[0.99]"
        aria-label={`Ver recompensa do mundo: ${reward.name}`}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-white shadow-pop">
            <IconGift size={27} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-gold">Recompensa do mundo</span>
            <span className="mt-0.5 block font-extrabold text-title">{reward.name}</span>
            <span className="mt-0.5 block text-xs text-subtle">Conquista fixa deste mundo · sem sorteio.</span>
          </span>
          <IconSparkles size={21} className="shrink-0 text-gold" />
        </div>
      </button>
    );
  }

  return (
    <div className="card mt-5 w-full animate-slide-up border-gold/50 bg-gold/10 p-4 text-left">
      <div className="flex items-center gap-3">
        <Avatar name={playerName} size={58} frame={reward.code} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gold"><IconSparkles size={13} /> Cosmético liberado</p>
          <p className="mt-0.5 font-extrabold text-title">{reward.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-subtle">{reward.description}</p>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-black/10 px-3 py-2 text-center text-[11px] font-semibold text-subtle">
        Escolha este aro no seu perfil quando quiser.
      </p>
    </div>
  );
}
