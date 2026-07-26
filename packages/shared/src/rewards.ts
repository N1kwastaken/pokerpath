/**
 * Recompensas cosméticas por concluir um mundo.
 *
 * Não há raridade, compra, giro ou vantagem de jogo: cada mundo concede um
 * aro de perfil específico. A lista vive no shared para que API e web falem
 * exatamente o mesmo idioma sobre posse e visual.
 */
export interface WorldRewardDefinition {
  code: string;
  name: string;
  description: string;
  /** Gradiente aplicado ao aro do avatar. */
  frame: string;
}

export const WORLD_REWARDS: readonly WorldRewardDefinition[] = [
  {
    code: 'FRAME_SEED',
    name: 'Aro da Partida',
    description: 'O primeiro aro da sua jornada no PokerPath.',
    frame: 'linear-gradient(135deg, #35C97D, #22D3EE)',
  },
  {
    code: 'FRAME_TRAIL',
    name: 'Aro da Trilha',
    description: 'Para quem já domina os primeiros passos.',
    frame: 'linear-gradient(135deg, #22D3EE, #3B82F6)',
  },
  {
    code: 'FRAME_STRATEGY',
    name: 'Aro da Estratégia',
    description: 'Marca a evolução de quem pensa uma rua à frente.',
    frame: 'linear-gradient(135deg, #7C5CFF, #E74C91)',
  },
  {
    code: 'FRAME_MASTER',
    name: 'Aro do Mestre',
    description: 'O aro dourado reservado para fechar o último mundo.',
    frame: 'linear-gradient(135deg, #C9A84C, #F7D774, #A8791E)',
  },
] as const;

export function rewardForWorldOrder(order: number): WorldRewardDefinition | null {
  return WORLD_REWARDS[order] ?? null;
}

export function rewardForCode(code: string | null | undefined): WorldRewardDefinition | null {
  return WORLD_REWARDS.find((reward) => reward.code === code) ?? null;
}

/** Recompensa possuída por uma pessoa, pronta para a API e a interface. */
export interface WorldRewardView extends WorldRewardDefinition {
  worldId: string;
  worldOrder: number;
  worldName: string;
  awardedAt: string;
  equipped: boolean;
}
