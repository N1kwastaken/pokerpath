/**
 * Economia de progressão.
 *
 * É deliberadamente pequena e determinística: fichas só nascem quando uma
 * fase é fechada perfeita pela primeira vez e servem apenas para desbloquear
 * melhorias permanentes de energia. Não há compra com dinheiro, loot box,
 * raridade ou consumível neste contrato.
 */

/** Capacidade diária inicial: cada exercício consome exatamente 1 energia. */
export const BASE_ENERGY_CAP = 10;

/** Uma resposta de prática consome uma carga; aulas não consomem nenhuma. */
export const ENERGY_COST_PER_EXERCISE = 1;
export const ENERGY_COST_PER_LESSON = 0;

/** Fichas concedidas uma única vez para cada fase perfeita. */
export const PERFECT_STAGE_COIN_REWARD = 10;

export interface EnergyItemDefinition {
  code: string;
  name: string;
  description: string;
  /** Símbolo de apoio à interface; o efeito nunca depende dele. */
  icon: string;
  /** Custo em fichas conquistadas, nunca dinheiro real. */
  coinCost: number;
  /** Espaços permanentes adicionados à capacidade diária. */
  energyCapBonus: number;
}

/**
 * Catálogo fechado no shared para a API validar custo/efeito sem confiar no
 * cliente. Cada item pode ser desbloqueado uma única vez.
 */
export const ENERGY_ITEMS: readonly EnergyItemDefinition[] = [
  {
    code: 'ENERGY_CASE',
    name: 'Estojo de energia',
    description: 'Organiza mais 2 cargas para o treino diário.',
    icon: '▣',
    coinCost: 30,
    energyCapBonus: 2,
  },
  {
    code: 'ENERGY_RESERVE',
    name: 'Reserva tática',
    description: 'Uma reserva permanente de mais 3 energias por dia.',
    icon: '◆',
    coinCost: 80,
    energyCapBonus: 3,
  },
  {
    code: 'ENERGY_VAULT',
    name: 'Cofre de fôlego',
    description: 'Expande sua rotina com mais 5 energias diárias.',
    icon: '✦',
    coinCost: 170,
    energyCapBonus: 5,
  },
] as const;

export function energyItemForCode(code: string | null | undefined): EnergyItemDefinition | null {
  return ENERGY_ITEMS.find((item) => item.code === code) ?? null;
}

/** Calcula o cap somente a partir de códigos válidos e sem duplicar itens. */
export function energyCapFromItemCodes(codes: readonly string[]): number {
  const owned = new Set(codes);
  return BASE_ENERGY_CAP + ENERGY_ITEMS.reduce(
    (total, item) => total + (owned.has(item.code) ? item.energyCapBonus : 0),
    0,
  );
}

/** Restante seguro para a UI: nunca retorna energia negativa. */
export function remainingEnergy(energyCap: number, exercisesDoneToday: number): number {
  return Math.max(0, energyCap - exercisesDoneToday * ENERGY_COST_PER_EXERCISE);
}

export interface EconomyItemView extends EnergyItemDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
}

/** Estado completo que a carteira e a tela de loadout consomem. */
export interface EconomyState {
  coins: number;
  baseEnergyCap: number;
  energyCapBonus: number;
  energyCap: number;
  perfectStageCoinReward: number;
  items: EconomyItemView[];
}

export interface ItemUnlockResult {
  item: EconomyItemView;
  economy: EconomyState;
}
