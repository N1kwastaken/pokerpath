import { PrismaClient } from '@prisma/client';
import { RANGE_DEFS, buildCells, freqForExercise, labelOfHand } from './ranges.js';

/**
 * Seed inicial (PRD 5, 6, 7, 9.4, 9.5).
 *
 * Conteúdo 100% determinístico e validado manualmente conforme o princípio
 * fundador do PRD (seção 1.4) e as ranges de referência da seção 16.2.
 *
 * Cobertura:
 *   • Mundo 1 (Fundamentos) — 3 fases jogáveis.
 *   • Mundo 2 (UTG) e Mundo 3 (MP) — desbloqueáveis na progressão (FREE).
 *   • Mundos 4 (CO) e 5 (BTN) — conteúdo presente, mas premium (PRD 13.2).
 *   • Conquistas-base (9.5) e missões diárias/semanais (9.4).
 *
 * Notação de mãos: cada carta é Valor+naipe (♠ ♥ ♦ ♣). Naipes iguais = suited,
 * naipes diferentes = offsuit. Ex.: "A♠Q♠" = AQs, "A♠Q♥" = AQo.
 *
 * Este módulo só DECLARA o conteúdo e exporta `main()`; quem executa é o
 * `seed.main.ts`. Importar aqui não toca o banco — é o que deixa os testes
 * lerem o conteúdo direto, sem o antigo hack de transpilar o arquivo e rodar
 * num `vm`.
 */
export const prisma = new PrismaClient();

export type ExerciseSeed = {
  heroPosition: string;
  villainPosition?: string;
  callerPosition?: string;
  stackBb?: number;
  potSize?: number;
  heroHand: string;
  board?: string;
  villainAction?: string;
  correctAction: 'FOLD' | 'CALL' | 'RAISE';
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
};

export type StageSeed = {
  title: string;
  concept: string;
  description: string;
  minExercises: number;
  passRate: number;
  xpReward: number;
  exercises: ExerciseSeed[];
};

export type WorldSeed = {
  order: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  stages: StageSeed[];
};

const XP: Record<ExerciseSeed['difficulty'], number> = {
  EASY: 5,
  MEDIUM: 10,
  HARD: 15,
};

export const WORLDS: WorldSeed[] = [
  {
    order: 0,
    name: 'Primeiros Passos',
    description: 'Nunca jogou? Comece aqui: cartas, regras e a mesa.',
    icon: '🎴',
    color: '#8B5CF6',
    stages: [
      { title: 'Bem-vindo ao poker', concept: 'Boas-vindas ao poker', description: 'O que é o jogo e qual o objetivo.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'O baralho e os naipes', concept: 'Baralho e naipes', description: '52 cartas, 4 naipes, 13 valores.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'A ordem das cartas', concept: 'Ordem das cartas', description: 'Do 2 ao Ás: quem vale mais.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'O ranking das mãos', concept: 'Ranking de mãos', description: 'Da carta alta ao royal flush.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'Lendo sua mão', concept: 'Lendo sua mão', description: 'Que jogada você tem? Treine a leitura.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'Como funciona uma rodada', concept: 'Anatomia de uma rodada', description: 'Blinds, ações e as ruas (flop, turn, river).', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'As ações na prática', concept: 'Ações na prática', description: 'Fold, call, check e raise em situações reais.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'A mesa e as posições', concept: 'Mesa e posições', description: 'Quem senta onde — e onde está VOCÊ.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      {
        title: 'Sua primeira decisão', concept: 'Primeira decisão', description: 'Mão forte aumenta; mão fraca desiste.',
        minExercises: 4, passRate: 0.6, xpReward: 40,
        exercises: [
          { heroPosition: 'BTN', heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA: o melhor par do jogo. Aumente!' },
          { heroPosition: 'BTN', heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '72o: a pior mão do poker. Desista sem dó.' },
          { heroPosition: 'BTN', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Par de reis: mão fortíssima. Aumente.' },
          { heroPosition: 'BTN', heroHand: '9♠4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '9 e 4: não combinam entre si. Desista.' },
          { heroPosition: 'BTN', heroHand: 'Q♣Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Par de damas: muito forte. Aumente.' },
          { heroPosition: 'BTN', heroHand: 'J♣3♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'J e 3: longe demais um do outro. Desista.' },
          { heroPosition: 'BTN', heroHand: 'A♦K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Ás e rei do mesmo naipe: mão premium. Aumente.' },
          { heroPosition: 'BTN', heroHand: '8♥3♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '8 e 3: fraca e desconectada. Desista.' },
          { heroPosition: 'BTN', heroHand: 'A♣Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Ás e dama: duas cartas altas. Aumente.' },
          { heroPosition: 'BTN', heroHand: 'T♠2♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'T e 2: quase nada joga junto com um 2. Desista.' },
        ],
      },
      {
        title: 'Forte ou fraca?', concept: 'Forte ou fraca', description: 'Nem sempre é óbvio — sinta o range.',
        minExercises: 4, passRate: 0.6, xpReward: 40,
        exercises: [
          { heroPosition: 'BTN', heroHand: 'T♥T♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Par de dez: forte. Aumente.' },
          { heroPosition: 'BTN', heroHand: 'Q♣3♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Dama com 3: o 3 não ajuda em nada. Desista.' },
          { heroPosition: 'BTN', heroHand: 'K♦Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Rei e dama: duas cartas altas. Aumente.' },
          { heroPosition: 'BTN', heroHand: '8♣2♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '8 e 2: sem par, sem conexão. Desista.' },
          { heroPosition: 'BTN', heroHand: 'A♥J♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Ás e valete do mesmo naipe: forte. Aumente.' },
          { heroPosition: 'BTN', heroHand: 'J♦6♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'J com 6: parece ok, mas é fraca. Desista.' },
          { heroPosition: 'BTN', heroHand: '9♦8♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Vizinhas e do mesmo naipe: podem virar sequência ou flush. Aumente.' },
          { heroPosition: 'BTN', heroHand: 'T♦4♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'T e 4: desconectadas. Desista.' },
          { heroPosition: 'BTN', heroHand: 'J♠T♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Vizinhas, altas e do mesmo naipe: aumente.' },
          { heroPosition: 'BTN', heroHand: 'K♥5♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Rei com 5: o 5 estraga a mão. Desista.' },
        ],
      },
      // Fecha o Mundo 0 apresentando o GRÁFICO: o "mapa" que resolve o
      // forte-ou-fraca de uma vez — pedido de beta testers (aparecia tarde demais).
      { title: 'O mapa das mãos', concept: 'Ler o gráfico', description: 'O gráfico 13x13: forte ou fraca, sem decoreba.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
    ],
  },

  {
    order: 1,
    name: 'Iniciante',
    description: 'O jogo completo, do preflop ao river — o essencial.',
    icon: '🌱',
    color: '#1B8A4C',
    stages: [
      // 5 — AULA
      { title: 'O poder da posição', concept: 'Posição (aula)', description: 'Por que agir por último é uma vantagem.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      // 6 — PRÁTICA
      {
        title: 'O que é posição', concept: 'Posição na mesa', description: 'Pratique abrir conforme a posição.',
        minExercises: 4, passRate: 0.7, xpReward: 50,
        exercises: [
          { heroPosition: 'BTN', heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA é sempre raise.' },
          { heroPosition: 'UTG', heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '72o é a pior mão. Fold.' },
          { heroPosition: 'CO', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK é premium. Raise.' },
          { heroPosition: 'BTN', heroHand: 'A♠J♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'No BTN, AJ abre com folga.' },
          { heroPosition: 'UTG', heroHand: 'Q♠7♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Q7o é fraca para abrir de UTG.' },
          { heroPosition: 'BTN', heroHand: 'K♣Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQ no BTN é open raise fácil.' },
          { heroPosition: 'BTN', heroHand: 'A♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A5s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'A♠5♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5o é fold de UTG.' },
          { heroPosition: 'CO', heroHand: 'K♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KJs abre de CO.' },
          { heroPosition: 'UTG', heroHand: 'K♠J♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJs abre de UTG: mesmo naipe e conectada, joga bem depois do flop.' },
          { heroPosition: 'BTN', heroHand: 'Q♦9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Q9s abre no BTN.' },
          { heroPosition: 'MP', heroHand: 'Q♦9♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q9s abre de MP.' },
        ],
      },
      // 7 — AULA
      { title: 'Abrir o pote: open raise', concept: 'Abrir o pote', description: 'O que significa ser o primeiro a apostar.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      // 3 — PRÁTICA
      {
        title: 'Reconhecendo mãos fortes', concept: 'Mãos fortes', description: 'Mão forte abre (raise); lixo descarta (fold).',
        minExercises: 4, passRate: 0.6, xpReward: 50,
        exercises: [
          { heroPosition: 'BTN', heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA é a melhor mão. Sempre raise.' },
          { heroPosition: 'BTN', heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '72o é a pior mão do poker. Fold.' },
          { heroPosition: 'BTN', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK é premium. Raise.' },
          { heroPosition: 'BTN', heroHand: '9♠4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '94o é fraca demais. Fold.' },
          { heroPosition: 'BTN', heroHand: 'Q♣Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ é premium. Raise.' },
          { heroPosition: 'BTN', heroHand: 'J♥3♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'J3o não joga. Fold.' },
          { heroPosition: 'BTN', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AK é uma das melhores mãos. Raise.' },
          { heroPosition: 'BTN', heroHand: '8♣3♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '83o não conecta nada. Fold.' },
          { heroPosition: 'BTN', heroHand: 'A♦Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQ é forte. Raise.' },
          { heroPosition: 'BTN', heroHand: 'Q♠4♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Q4o é fraca demais. Fold.' },
          { heroPosition: 'BTN', heroHand: 'J♣J♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'JJ é premium. Raise.' },
          { heroPosition: 'BTN', heroHand: 'T♠2♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'T2o não joga. Fold.' },
        ],
      },
      // 8 — PRÁTICA
      {
        title: 'Abrindo com mãos premium', concept: 'Open raise — mãos premium', description: 'As mãos fortes abrem de qualquer posição.',
        minExercises: 5, passRate: 0.7, xpReward: 50,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♠K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AK é premium. Raise.' },
          { heroPosition: 'MP', heroHand: 'Q♥Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ é premium. Raise.' },
          { heroPosition: 'CO', heroHand: 'J♦J♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'JJ abre de qualquer posição.' },
          { heroPosition: 'UTG', heroHand: 'T♠T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'TT entra no range de UTG.' },
          { heroPosition: 'BTN', heroHand: 'A♣A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA sempre raise.' },
          { heroPosition: 'CO', heroHand: 'A♥K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs é premium. Raise.' },
          { heroPosition: 'UTG', heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA abre de qualquer posição.' },
          { heroPosition: 'MP', heroHand: 'K♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK é premium.' },
          { heroPosition: 'CO', heroHand: 'Q♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ é premium.' },
          { heroPosition: 'UTG', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs é premium.' },
          { heroPosition: 'MP', heroHand: 'A♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo é premium.' },
          { heroPosition: 'CO', heroHand: 'J♠J♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'JJ abre de qualquer posição.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo não abre de UTG — quase, mas não.' },
          { heroPosition: 'UTG', heroHand: 'K♥Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQo abre de UTG — é das piores mãos offsuit que entram.' },
          { heroPosition: 'MP', heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '72o nunca abre. Fold.' },
        ],
      },
      // 9 — AULA
      { title: 'A arte do fold', concept: 'A arte do fold', description: 'Por que desistir cedo faz você ganhar.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      // 10 — PRÁTICA
      {
        title: 'Quando NÃO abrir', concept: 'Quando NÃO abrir', description: 'Mãos marginais viram fold em posição inicial.',
        minExercises: 5, passRate: 0.7, xpReward: 50,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♠J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo é fold de UTG.' },
          { heroPosition: 'UTG', heroHand: 'K♥J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KJo não abre de UTG: vive dominada por AK, AQ e KQ.' },
          { heroPosition: 'UTG', heroHand: 'K♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K9s fica de fora de UTG: o naipe não paga o kicker fraco.' },
          { heroPosition: 'UTG', heroHand: '8♠3♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '83o não joga. Fold.' },
          { heroPosition: 'UTG', heroHand: 'A♥Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AQo abre de UTG. Raise.' },
          { heroPosition: 'UTG', heroHand: 'K♠Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQs abre de UTG. Raise.' },
          { heroPosition: 'UTG', heroHand: 'Q♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q9s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠T♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATo não abre de UTG: sem o naipe, fica dominada.' },
          { heroPosition: 'UTG', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s fica de fora de UTG.' },
        ],
      },
{ title: 'Como ler o gráfico', concept: 'Ler o gráfico', description: 'O mapa de mãos 13x13, sem mistério.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      // 11 — AULA
      { title: 'Recapitulando os fundamentos', concept: 'Recapitulando', description: 'Tudo o que você aprendeu até aqui.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      // 12 — PRÁTICA (teste final)
      {
        title: 'Fundamentos: teste', concept: 'Revisão Mundo 1', description: 'Misture tudo: posição, mãos fortes e disciplina.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA sempre raise.' },
          { heroPosition: 'UTG', heroHand: '7♥2♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '72o é fold sempre.' },
          { heroPosition: 'BTN', heroHand: 'K♣Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQ no BTN é raise.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo é fold de UTG.' },
          { heroPosition: 'CO', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK é premium. Raise.' },
          { heroPosition: 'UTG', heroHand: 'K♠Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: '9♣9♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '99 abre de UTG: par médio entra no range.' },
          { heroPosition: 'BTN', heroHand: 'A♠J♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AJ no BTN é raise.' },
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '65s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: '7♠7♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 abre de UTG: par pequeno entra para caçar trinca.' },
          { heroPosition: 'CO', heroHand: 'A♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'ATs abre de CO.' },
          { heroPosition: 'MP', heroHand: 'A♠J♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo abre de MP.' },
          { heroPosition: 'BTN', heroHand: 'K♠T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KTo abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'Q♠J♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'QJs abre de UTG.' },
        ],
      },
{ title: 'UTG: a primeira a falar', concept: 'UTG explicado', description: 'Por que abrir de UTG é o mais difícil.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'O range premium do UTG', concept: 'Range de UTG', description: 'Pares, ases suited, broadway e AQ+. Umas 14 em cada 100 mãos.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'UTG: o que abre', concept: 'UTG abre', description: 'Só as mãos mais fortes valem o open.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♦Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de UTG com folga.' },
          { heroPosition: 'UTG', heroHand: 'A♣K♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs é premium. Raise.' },
          { heroPosition: 'UTG', heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK abre sempre.' },
          { heroPosition: 'UTG', heroHand: 'J♣J♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'JJ está no topo do range de UTG.' },
          { heroPosition: 'UTG', heroHand: 'T♠T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'TT é o par mais baixo que abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠Q♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AQo entra no range de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'Q♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'K♠Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♥J♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'AJs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: '9♠9♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '99 abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'K♦Q♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQo abre de UTG.' },
        ],
      },
      {
        title: 'UTG: o que fica de fora', concept: 'UTG fold', description: 'Mãos que parecem boas, mas viram fold.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'K♦9♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K9s fica de fora de UTG: o naipe não paga o kicker fraco.' },
          { heroPosition: 'UTG', heroHand: 'A♥T♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATo fica de fora de UTG: sem o naipe, vive dominada.' },
          { heroPosition: 'UTG', heroHand: 'Q♠J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'QJo fica de fora de UTG — só a versão do mesmo naipe abre.' },
          { heroPosition: 'UTG', heroHand: 'J♦9♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'J9s fica de fora de UTG: falta um degrau para JTs.' },
          { heroPosition: 'UTG', heroHand: 'K♠T♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KTo fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'T♠8♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'T8s fica de fora de UTG: só T9s entra.' },
          { heroPosition: 'UTG', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'AJo fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: '6♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '65s fica de fora de UTG: 76s é o conector mais baixo que abre.' },
          { heroPosition: 'UTG', heroHand: 'A♣A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA abre de qualquer lugar.' },
          { heroPosition: 'UTG', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'T♥T♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'TT é o limite: abre de UTG.' },
        ],
      },
      {
        title: 'UTG: teste', concept: 'Revisão UTG', description: 'Misture aberturas e folds de UTG.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'UTG', heroHand: '7♥7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'T♦9♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T9s abre de UTG: conector do mesmo naipe.' },
          { heroPosition: 'UTG', heroHand: 'A♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo é premium. Raise.' },
          { heroPosition: 'UTG', heroHand: 'Q♥Q♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ abre sempre.' },
          { heroPosition: 'UTG', heroHand: 'K♣Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'J♦T♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'JTs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'T♠T♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'TT abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQo abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'AJs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠T♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de UTG.' },
        ],
      },
{ title: 'MP: um passo à frente', concept: 'MP explicado', description: 'Com menos gente para agir, dá pra abrir mais.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'O que entra no MP', concept: 'Range de MP', description: 'Ases do meio, K9s, Q9s e KJo passam a abrir.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'MP: novas aberturas', concept: 'MP abre', description: 'Mãos que eram fold em UTG e agora abrem.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'MP', heroHand: 'A♣J♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'Q♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'QJs entra no range de MP.' },
          { heroPosition: 'MP', heroHand: '9♣9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '99 abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQo abre de MP.' },
          { heroPosition: 'MP', heroHand: 'K♥Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'J♣J♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'JJ é premium. Raise.' },
          { heroPosition: 'MP', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'T♠T♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'TT abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'Q♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo abre de MP.' },
          { heroPosition: 'MP', heroHand: 'K♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠9♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s é novidade no MP: de UTG ficava de fora.' },
          { heroPosition: 'MP', heroHand: 'K♠9♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K9s abre de MP — de UTG, não.' },
          { heroPosition: 'MP', heroHand: 'K♠J♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KJo abre de MP: um a menos atrás já muda o range.' },
        ],
      },
      {
        title: 'MP: ainda não', concept: 'MP fold', description: 'Mãos que só vão abrir mais para a frente.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'MP', heroHand: 'K♠T♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KTo não abre de MP: sem o naipe, é dominada demais.' },
          { heroPosition: 'MP', heroHand: 'Q♠T♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'QTo fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'J♠T♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'JTo fica de fora de MP — só a do mesmo naipe abre.' },
          { heroPosition: 'MP', heroHand: 'K♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K8s fica de fora de MP: o naipe não paga o kicker.' },
          { heroPosition: 'MP', heroHand: 'Q♠8♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Q8s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'J♦8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8s fica de fora de MP: falta um degrau para J9s.' },
          { heroPosition: 'MP', heroHand: 'T♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T7s fica de fora de MP: T8s é o mais baixo que entra.' },
          { heroPosition: 'MP', heroHand: '9♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '97s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: '8♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '86s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: '5♠4♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '54s fica de fora de MP: 65s é o conector mais baixo.' },
          { heroPosition: 'MP', heroHand: 'A♠9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9o fica de fora de MP: ás sem naipe e sem kicker.' },
          { heroPosition: 'MP', heroHand: 'K♠9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K9o fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: '9♦9♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '99 abre de MP.' },
          { heroPosition: 'MP', heroHand: 'Q♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'QJs entra no range de MP.' },
          { heroPosition: 'MP', heroHand: 'A♣Q♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AQo abre de MP.' },
        ],
      },
      {
        title: 'MP: teste', concept: 'Revisão MP', description: 'Misture o range de MP.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'MP', heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK abre sempre.' },
          { heroPosition: 'MP', heroHand: '7♥7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo é premium. Raise.' },
          { heroPosition: 'MP', heroHand: 'Q♥T♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'QTs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠5♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5s abre de MP: bloqueia AA/AK e faz o nut flush.' },
          { heroPosition: 'MP', heroHand: 'T♣T♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'TT abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de MP.' },
          { heroPosition: 'MP', heroHand: '9♠9♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '99 abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠T♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠9♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠8♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s abre de MP.' },
        ],
      },
{ title: 'CO: quase no botão', concept: 'CO explicado', description: 'Boa posição = muito mais mãos para abrir.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'O range largo do CO', concept: 'Range de CO', description: 'Reis médios, Q8s, conectores e broadway offsuit entram.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'CO: o range se abre', concept: 'CO abre', description: 'Mãos novas que o CO já pode abrir.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'CO', heroHand: 'A♥T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'ATs já abre de CO.' },
          { heroPosition: 'CO', heroHand: 'K♦J♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KJs abre de CO.' },
          { heroPosition: 'CO', heroHand: 'J♦T♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'JTs já abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠J♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo já abre de CO.' },
          { heroPosition: 'CO', heroHand: 'K♠Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQo abre de CO.' },
          { heroPosition: 'CO', heroHand: '8♣8♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '88 já abre de CO (77+).' },
          { heroPosition: 'CO', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de CO.' },
          { heroPosition: 'CO', heroHand: '7♠7♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de CO.' },
          { heroPosition: 'CO', heroHand: '9♠9♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '99 abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJs abre de CO.' },
          { heroPosition: 'CO', heroHand: 'T♠T♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'TT abre de CO.' },
          { heroPosition: 'CO', heroHand: 'K♠8♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K8s abre de CO — de MP, ainda não.' },
          { heroPosition: 'CO', heroHand: 'Q♠8♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q8s entra no CO.' },
          { heroPosition: 'CO', heroHand: 'A♠9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A9o abre de CO: três atrás só, dá pra alargar.' },
        ],
      },
      {
        title: 'CO: o limite', concept: 'CO fold', description: 'Largo, mas ainda não é qualquer coisa.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'CO', heroHand: 'A♠8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8o fica de fora do CO: ás sem naipe e sem kicker.' },
          { heroPosition: 'CO', heroHand: 'K♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K6s fica de fora do CO: K7s é o limite.' },
          { heroPosition: 'CO', heroHand: 'K♠9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K9o fica de fora do CO.' },
          { heroPosition: 'CO', heroHand: 'Q♠9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q9o fica de fora do CO — só a do mesmo naipe abre.' },
          { heroPosition: 'CO', heroHand: 'J♠9♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'J9o fica de fora do CO.' },
          { heroPosition: 'CO', heroHand: 'T♠9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T9o fica de fora do CO.' },
          { heroPosition: 'CO', heroHand: 'Q♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q7s fica de fora do CO: Q8s é o limite.' },
          { heroPosition: 'CO', heroHand: 'J♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J7s fica de fora do CO.' },
          { heroPosition: 'CO', heroHand: 'T♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T7s fica de fora do CO.' },
          { heroPosition: 'CO', heroHand: '9♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '96s fica de fora do CO: 97s é o limite.' },
          { heroPosition: 'CO', heroHand: '7♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '75s fica de fora do CO: tem buraco e é baixa.' },
          { heroPosition: 'CO', heroHand: '4♠3♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '43s fica de fora do CO: 54s é o conector mais baixo.' },
          { heroPosition: 'CO', heroHand: '7♥7♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '77 abre de CO — o novo limite dos pares.' },
          { heroPosition: 'CO', heroHand: 'A♣J♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo abre de CO.' },
          { heroPosition: 'CO', heroHand: 'J♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'JTs abre de CO.' },
        ],
      },
      {
        title: 'CO: teste', concept: 'Revisão CO', description: 'Misture o range de CO.',
        minExercises: 6, passRate: 0.75, xpReward: 90,
        exercises: [
          { heroPosition: 'CO', heroHand: '7♥7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 já abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQo abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♦8♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s abre de CO.' },
          { heroPosition: 'CO', heroHand: 'Q♠J♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QJs abre de CO.' },
          { heroPosition: 'CO', heroHand: '6♥6♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '66 abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♥K♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AK é premium. Raise.' },
          { heroPosition: 'CO', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de CO.' },
          { heroPosition: 'CO', heroHand: '8♠8♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '88 abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠9♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠7♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠6♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s abre de CO.' },
        ],
      },
{ title: 'BTN: a melhor cadeira', concept: 'BTN explicado', description: 'Você age por último o resto da mão.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'Jogando largo no botão', concept: 'Range de BTN', description: 'Pares pequenos, suited connectors e Ax suited.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'BTN: mãos pequenas abrem', concept: 'BTN abre', description: 'No botão, até mãozinhas valem o open.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'BTN', heroHand: '2♣2♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'No BTN, até 22 abre.' },
          { heroPosition: 'BTN', heroHand: '5♣5♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '55 abre de BTN tranquilo.' },
          { heroPosition: 'BTN', heroHand: 'A♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A5s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♦2♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Qualquer A suited abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'K♣9♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K9s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'Q♦9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Q9s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '65s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '7♠6♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '76s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '8♠7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '87s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'J♦8♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8s abre do BTN: mão pequena, mas em posição joga.' },
          { heroPosition: 'BTN', heroHand: 'A♥7♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A7o abre do BTN — qualquer ás abre daqui.' },
          { heroPosition: 'BTN', heroHand: 'K♣9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K9o abre do BTN.' },
        ],
      },
      {
        title: 'BTN: conectores', concept: 'BTN conectores', description: 'Suited connectors brilham em posição.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'BTN', heroHand: '7♠6♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '76s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '6♥5♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '65s ainda abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '9♣8♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '98s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'J♠9♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'J9s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '5♦4♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '54s abre do BTN: conector do mesmo naipe joga bem em posição.' },
          { heroPosition: 'BTN', heroHand: 'T♦9♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'T9s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '8♠7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '87s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '2♠2♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '22 abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '3♠3♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '33 abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '3♠2♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '32s não abre nem do BTN: é o conector mais baixo de todos.' },
          { heroPosition: 'BTN', heroHand: '9♦7♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '97s abre do BTN mesmo com o buraco.' },
        ],
      },
      {
        title: 'BTN: até onde vai', concept: 'Revisão BTN', description: 'O limite do range mais largo da mesa.',
        minExercises: 6, passRate: 0.75, xpReward: 100,
        exercises: [
          { heroPosition: 'BTN', heroHand: 'A♠8♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A8o já abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'K♦T♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KTo abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'Q♣J♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'QJo abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'J♠8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8o fica de fora até do BTN.' },
          { heroPosition: 'BTN', heroHand: '6♠2♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '62s fica de fora até do BTN: buraco grande e cartas baixas.' },
          { heroPosition: 'BTN', heroHand: '4♥4♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '44 abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '65s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠7♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7o abre do BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠6♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6o abre do BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠5♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5o abre do BTN.' },
        ],
      },
{ title: 'SB: você já está no pote', concept: 'SB explicado', description: 'Por que a SB abre largo, mas com cuidado.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'O range largo da SB', concept: 'Range de SB', description: 'Quase metade das mãos abrem da SB.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'SB: o que abre', concept: 'SB abre', description: 'Com só o BB para agir, o range explode.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'SB', heroHand: 'A♠2♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Qualquer A suited abre da SB.' },
          { heroPosition: 'SB', heroHand: 'K♣9♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K9s abre da SB.' },
          { heroPosition: 'SB', heroHand: '5♦4♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Até 54s abre da SB.' },
          { heroPosition: 'SB', heroHand: 'Q♠J♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QJo abre da SB.' },
          { heroPosition: 'SB', heroHand: 'A♣7♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A7o já abre da SB.' },
          { heroPosition: 'SB', heroHand: '7♠6♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '76s abre da SB.' },
          { heroPosition: 'SB', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de SB.' },
          { heroPosition: 'SB', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '65s abre de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de SB.' },
          { heroPosition: 'SB', heroHand: '8♠7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '87s abre de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJs abre de SB.' },
          { heroPosition: 'SB', heroHand: '2♠2♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '22 abre de SB.' },
          { heroPosition: 'SB', heroHand: 'J♥8♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8s abre da SB.' },
          { heroPosition: 'SB', heroHand: 'A♦6♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A6o abre da SB: só o BB atrás.' },
          { heroPosition: 'SB', heroHand: 'K♠9♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K9o abre da SB.' },
        ],
      },
      {
        title: 'SB: o que fica de fora', concept: 'SB fold', description: 'Largo não é tudo: ainda há limites.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'SB', heroHand: 'K♠6♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K6o fica de fora da SB: sem naipe, o kicker não segura.' },
          { heroPosition: 'SB', heroHand: 'Q♠8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q8o fica de fora da SB.' },
          { heroPosition: 'SB', heroHand: 'J♠8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8o fica de fora da SB — só a do mesmo naipe abre.' },
          { heroPosition: 'SB', heroHand: 'T♠8♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'T8o fica de fora da SB.' },
          { heroPosition: 'SB', heroHand: '9♠8♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '98o fica de fora da SB: sem naipe, não vale o pote OOP.' },
          { heroPosition: 'SB', heroHand: '4♠3♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '43s fica de fora da SB: 53s é o limite.' },
          { heroPosition: 'SB', heroHand: 'J♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J5s fica de fora da SB: o naipe não paga o kicker.' },
          { heroPosition: 'SB', heroHand: 'T♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T5s fica de fora da SB.' },
          { heroPosition: 'SB', heroHand: '9♠2♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '92s fica de fora da SB.' },
          { heroPosition: 'SB', heroHand: '8♠4♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '84s fica de fora da SB.' },
          { heroPosition: 'SB', heroHand: '6♠3♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '63s fica de fora da SB.' },
          { heroPosition: 'SB', heroHand: '6♠2♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '62s fica de fora da SB.' },
          { heroPosition: 'SB', heroHand: '5♥4♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '54s abre da SB.' },
          { heroPosition: 'SB', heroHand: 'T♦8♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'T8s abre da SB.' },
          { heroPosition: 'SB', heroHand: 'A♠7♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7o é o limite dos ases offsuit na SB.' },
        ],
      },
      {
        title: 'SB: teste', concept: 'Revisão SB', description: 'Misture o range largo da SB.',
        minExercises: 6, passRate: 0.75, xpReward: 90,
        exercises: [
          { heroPosition: 'SB', heroHand: '2♣2♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'Todo par abre da SB.' },
          { heroPosition: 'SB', heroHand: '4♥3♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '43s já é fraco demais (vai até 54s).' },
          { heroPosition: 'SB', heroHand: 'A♠J♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AJo abre da SB (A7o+).' },
          { heroPosition: 'SB', heroHand: 'Q♥9♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Q9s abre da SB.' },
          { heroPosition: 'SB', heroHand: 'J♠9♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'J9s abre da SB.' },
          { heroPosition: 'SB', heroHand: '9♣5♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '95s abre da SB.' },
          { heroPosition: 'SB', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de SB.' },
          { heroPosition: 'SB', heroHand: '5♠4♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '54s abre de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠6♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6o abre da SB.' },
          { heroPosition: 'SB', heroHand: 'A♠5♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5o abre da SB.' },
          { heroPosition: 'SB', heroHand: 'A♠4♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A4o abre da SB.' },
        ],
      },
      { title: 'Flop: ler o board', concept: 'Flop board', description: 'Boards secos x molhados e o que isso muda.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      { title: 'Flop: maos feitas', concept: 'Flop fortes intro', description: 'Com valor, o plano e ganhar fichas.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: 'Flop: valor', concept: 'Flop fortes', description: 'Pague ou aumente com mao forte.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♠7♦2♣', heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'AA e overpair: aumente por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'Q♣9♦4♠', heroHand: 'Q♥Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Trinca de damas: raise por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♦T♣5♠', heroHand: 'A♣K♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Top pair top kicker: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'J♠8♦3♣', heroHand: 'J♦T♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Top pair: pague a aposta.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '8♣7♦2♠', heroHand: 'A♠A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Overpair em board baixo: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♦Q♠5♣', heroHand: 'K♣J♦', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Top pair kicker medio: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♠K♦9♣', heroHand: 'A♥Q♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Top pair top kicker: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '7♠7♦2♣', heroHand: 'A♦A♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'Q♥J♣4♦', heroHand: 'Q♠Q♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Trinca de damas: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'T♦9♣3♠', heroHand: 'T♣T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Trinca de dez: raise.' },
        ],
      },
      {
        title: 'Flop: quando desistir', concept: 'Flop blefe', description: 'Sem par nem projeto, fold.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♠Q♦7♣', heroHand: '5♥4♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'C_BET', explanation: 'Sem par nem projeto: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♠T♦6♣', heroHand: '8♦7♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'C_BET', explanation: 'Nada no board: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'Q♣J♦3♠', heroHand: '6♥5♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'C_BET', explanation: 'Ar total: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♦8♣4♠', heroHand: 'A♥5♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Ace-high sem projeto: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'J♠9♥2♦', heroHand: '4♣4♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Par abaixo do board: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♣K♠7♦', heroHand: '6♦6♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'C_BET', explanation: 'Par pequeno vs duas altas: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♦Q♣8♠', heroHand: '6♥4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'C_BET', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♣T♥5♦', heroHand: '7♠2♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'C_BET', explanation: 'Lixo: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'J♦8♣3♥', heroHand: '5♣5♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Underpair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'Q♠9♦6♣', heroHand: 'A♣3♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Ace-high: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♠7♦2♣', heroHand: 'A♥K♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Top pair top kicker: não desista — pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'J♦8♣3♠', heroHand: 'Q♠Q♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair: pague a aposta.' },
        ],
      },
      { title: 'Turn: maos feitas', concept: 'Turn fortes intro', description: 'O pote cresce; valor mantem a pressao.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: 'Turn: valor', concept: 'Turn fortes', description: 'Aumente/pague com mao forte.',
        minExercises: 5, passRate: 0.7, xpReward: 75,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♠7♦2♣5♥', heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair segue forte: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♦T♣5♠8♣', heroHand: 'A♥K♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair top kicker: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♦9♣4♠2♥', heroHand: 'Q♥Q♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'TURN', explanation: 'Trinca de damas: raise valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'J♣8♦3♠T♥', heroHand: 'J♥J♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Trinca de valetes: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♥Q♦5♣7♠', heroHand: 'K♣J♥', correctAction: 'CALL', difficulty: 'HARD', category: 'TURN', explanation: 'Top pair kicker medio: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '8♦7♣2♠3♥', heroHand: 'A♠A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'TURN', explanation: 'Overpair board baixo: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♠K♦9♣4♥', heroHand: 'A♥Q♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair top kicker: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '7♠7♦2♣J♦', heroHand: 'A♦A♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♥J♣4♦8♠', heroHand: 'Q♠Q♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'TURN', explanation: 'Trinca: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'T♦9♣3♠2♥', heroHand: 'T♣T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Trinca: raise.' },
        ],
      },
      {
        title: 'Turn: quando desistir', concept: 'Turn blefe', description: 'Projeto morto e par fraco: fold.',
        minExercises: 5, passRate: 0.7, xpReward: 75,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♠Q♦7♣3♥', heroHand: '5♥4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'TURN', explanation: 'Ar no turn: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♠T♦6♣2♥', heroHand: '8♦7♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Gutshot que não veio: só 8-high, fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♣J♦3♠5♦', heroHand: '6♥5♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Par de baixo fraco: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♦8♣4♠2♥', heroHand: 'A♥5♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'TURN', explanation: 'Ace-high: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'J♠9♥2♦Q♣', heroHand: '4♣4♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Underpair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♣K♠7♦T♥', heroHand: '6♦6♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'TURN', explanation: 'Par pequeno: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♦Q♣8♠3♦', heroHand: '6♥4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'TURN', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♣T♥5♦2♠', heroHand: '7♠6♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sem projeto real: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'J♦8♣3♥T♠', heroHand: '5♣5♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Underpair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♠9♦6♣4♥', heroHand: 'A♣3♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Ace-high: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♠8♦3♣2♥', heroHand: 'A♦A♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair segue forte no turn: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♦9♣4♠2♦', heroHand: 'K♥Q♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair com bom kicker: pague.' },
        ],
      },
      { title: 'River: valor', concept: 'River fortes intro', description: 'Sem mais cartas: valor, blefe ou fold.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: 'River: aumentar por valor', concept: 'River fortes', description: 'Mao monstro: extraia o maximo.',
        minExercises: 5, passRate: 0.7, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠Q♦7♣2♥Q♣', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Full house (KKK + QQ): raise valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: '9♠8♦7♣2♠3♥', heroHand: 'J♥T♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Sequencia J-alto: raise valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'Q♣Q♥4♠4♦9♣', heroHand: 'A♠Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Full house (QQQ + 44): raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♦J♠5♣5♥8♠', heroHand: 'K♣K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Full house KK55: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♥7♦7♠3♣7♣', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Sevens full of aces: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♦T♣5♠8♦2♣', heroHand: 'A♣K♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair top kicker: value call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠K♥7♦2♣5♠', heroHand: 'A♣K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Trinca de reis: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: '9♦9♠4♣4♥J♦', heroHand: 'J♣J♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Full house: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'Q♣Q♦8♠8♥3♣', heroHand: 'A♠8♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Full house: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'T♥T♦5♣5♠K♦', heroHand: 'K♣K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Dois pares altos: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♦K♣Q♥9♦2♣', heroHand: '6♠5♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Seis-alto: sem valor no call — fold.' },
        ],
      },
      {
        title: 'River: quando desistir', concept: 'River blefe', description: 'Projeto que errou: fold.',
        minExercises: 5, passRate: 0.7, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠Q♦7♣2♥4♦', heroHand: 'J♥T♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Broadway não fechou (faltou 9 ou Á): J-high, fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠K♦8♣4♥2♠', heroHand: 'Q♥J♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: '9♥8♦2♣5♠K♣', heroHand: 'J♠T♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto de sequencia falhou: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♦7♣3♦Q♠6♣', heroHand: 'K♦J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'RIVER', explanation: 'Nut flush draw que errou: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'T♣9♦2♠4♥K♣', heroHand: '8♦7♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto morto: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'Q♦J♠6♣3♥8♦', heroHand: 'A♥K♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'RIVER', explanation: 'Ace-king high nao paga: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♣Q♦8♥5♠2♣', heroHand: 'K♦J♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♦J♣7♠4♦2♥', heroHand: 'T♠9♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto morto: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♣9♠4♦2♥7♠', heroHand: 'Q♦J♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Dama-alta: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠T♦6♣3♥K♦', heroHand: '8♣7♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'J♦7♣4♠3♥2♦', heroHand: 'A♠A♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Overpair vira bluff-catcher: pague.' },
        ],
      },
      { title: 'Tudo junto agora', concept: 'Revisão geral', description: 'A posição muda tudo — vamos misturar.', minExercises: 0, passRate: 0, xpReward: 30, exercises: [] },
      {
        title: 'Mix de posições I', concept: 'Mix 1', description: 'Aberturas e folds em posições variadas.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo abre de qualquer posição.' },
          { heroPosition: 'BTN', heroHand: '2♣2♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '22 abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo é fold de UTG.' },
          { heroPosition: 'CO', heroHand: 'A♥T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'ATs abre de CO.' },
          { heroPosition: 'MP', heroHand: '8♣8♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '88 abre de MP.' },
          { heroPosition: 'SB', heroHand: 'Q♠J♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QJo abre da SB.' },
          { heroPosition: 'UTG', heroHand: 'A♠Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AQo abre de UTG.' },
          { heroPosition: 'MP', heroHand: 'Q♦J♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'QJs abre de MP.' },
          { heroPosition: 'CO', heroHand: 'J♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'JTs abre de CO.' },
          { heroPosition: 'UTG', heroHand: 'K♥J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJo e fold de UTG.' },
        ],
      },
      {
        title: 'Mix de posições II', concept: 'Mix 2', description: 'Mais decisões dependentes da posição.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', heroHand: '7♠6♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '76s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: '9♣9♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '99 abre de UTG.' },
          { heroPosition: 'CO', heroHand: 'K♠Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQo abre de CO.' },
          { heroPosition: 'MP', heroHand: 'A♠J♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo abre de MP.' },
          { heroPosition: 'SB', heroHand: '5♦4♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '54s abre da SB.' },
          { heroPosition: 'BTN', heroHand: 'J♠8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8o fica de fora até do BTN.' },
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '65s abre do botao.' },
          { heroPosition: 'CO', heroHand: 'A♥T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'ATs abre de CO.' },
          { heroPosition: 'MP', heroHand: 'Q♣9♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q9s abre de MP.' },
          { heroPosition: 'SB', heroHand: '5♦4♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '54s abre da SB.' },
        ],
      },
    ],
  },

  {
    order: 2,
    name: 'Intermediário',
    description: 'Defesa do blind, 3-bet e o postflop de verdade.',
    icon: '🎯',
    color: '#3FA7D6',
    stages: [
      // ── Defesa do BB (enfrentar um open) ──
      { title: 'BB: o desconto do big blind', concept: 'BB explicado', description: 'Por que o BB defende muitas mãos.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'Como reagir a um open', concept: 'Defesa do BB', description: 'Fold, Call ou 3-bet contra quem abriu.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'BB: quando dar fold', concept: 'BB fold', description: 'Lixo offsuit não defende, nem com preço.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: '72o e a pior mao. Fold mesmo com preco.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♠3♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: 'J3o nao conecta o bastante. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♣4♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: 'Q4o e fraca demais. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♠4♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: '94o nao defende. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♦2♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'K2o e fraca; fold contra o open.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♥5♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'DEFEND', explanation: '85o offsuit e fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠8♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'K8o nao defende. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♦2♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: 'Q2o e lixo. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♣4♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'J4o nao conecta. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♠6♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: '96o e fraca. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'AA não folda nunca: 3-bet.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♥6♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: '76s defende pagando.' },
        ],
      },
      {
        title: 'BB: quando pagar (call)', concept: 'BB call', description: 'Com bom preco, o BB defende largo pagando.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♠6♠', correctAction: 'CALL', difficulty: 'EASY', category: 'DEFEND', explanation: '76s paga: joga bem e tem preco.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥Q♦', correctAction: 'CALL', difficulty: 'EASY', category: 'DEFEND', explanation: 'KQo defende pagando contra o BTN.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣9♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'A9s paga: forte pra foldar, fraca pra 3bet.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♦T♦', correctAction: 'CALL', difficulty: 'EASY', category: 'DEFEND', explanation: 'JTs paga facil.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '2♠2♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'Pares pequenos pagam pra tentar a trinca.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♥9♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'Q9s paga com bom preco.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '5♦4♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: '54s paga com bom preco.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♣9♣', correctAction: 'CALL', difficulty: 'EASY', category: 'DEFEND', explanation: 'T9s defende facil.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠8♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'A8o paga pelo blocker e preco.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '3♣3♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'Par pequeno paga pra buscar trinca.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♠2♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: '72o folda mesmo com preço.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'KK: relance por valor.' },
        ],
      },
      {
        title: 'BB: quando dar 3-bet', concept: 'BB 3bet', description: 'Maos premium relancam por valor.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'AA: 3-bet por valor, sempre.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'AKs: 3-bet forte.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♦Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'QQ: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'AKo: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'AQs: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'AA: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'AKo: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♥Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'QQ: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♠3♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: 'J3o não defende. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♣T♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'JTs paga — forte demais pra fold, fraca pro 3-bet.' },
        ],
      },
      {
        title: 'BB: teste de defesa', concept: 'Revisão BB', description: 'Misture fold, call e 3-bet contra o open.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: '72o e fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'AA 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠Q♥', correctAction: 'CALL', difficulty: 'EASY', category: 'DEFEND', explanation: 'KQo paga.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '6♠5♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: '65s paga com preco.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♣3♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: 'Q3o e fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥K♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'AKo 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♥T♥', correctAction: 'CALL', difficulty: 'EASY', category: 'DEFEND', explanation: 'JTs paga.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'DEFEND', explanation: 'AA: 3-bet por valor.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♦9♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'T9s paga com preco.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♣3♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: '83o e fold.' },
        ],
      },
      // ── 3-Bet: quando relançar um open ──
      { title: '3-Bet: o relanço', concept: '3bet explicado', description: 'O que é dar 3-bet e para que serve.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: '3-Bet: valor e blefe', concept: '3bet value blefe', description: 'Premium por valor; blockers suited como blefe.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: '3-Bet por valor', concept: '3bet valor', description: 'Maos premium relancam o open por valor.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AA: 3-bet por valor, sempre.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AKs: 3-bet forte por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♦Q♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'QQ: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'AKo: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♣J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'JJ: 3-bet por valor contra o CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AA: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣K♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AKs: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♥Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'QQ: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♥7♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'Q7o não entra na mão: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♦8♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: '88 prefere pagar em posição.' },
        ],
      },
      { title: '3-Bet: blockers', concept: '3bet blockers', description: 'Por que ases suited baixos servem de blefe.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: '3-Bet como blefe', concept: '3bet blefe', description: 'Ases suited baixos: bons blockers para blefar.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'A5s: blocker de ases, otimo 3-bet blefe.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣4♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'A4s: blefe com blocker e nut flush.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦3♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'THREE_BET', explanation: 'A3s: blocker suited, entra como blefe.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠2♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'K2o nao serve de blefe. Fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: '72o e lixo. Fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥5♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'THREE_BET', explanation: 'A5o offsuit nao blefa (sem flush). Fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠2♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'A2s: blocker suited, 3-bet blefe.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥4♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'A4s: blefe com blocker.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♦3♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: '83o nao blefa. Fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠9♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'K9o nao e blefe. Fold.' },
        ],
      },
      {
        title: 'Pagar em posicao', concept: '3bet call', description: 'Maos boas que preferem flatar em posicao.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♠8♦', correctAction: 'CALL', difficulty: 'EASY', category: 'THREE_BET', explanation: '88: paga em posicao pra jogar o flop.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠J♠', correctAction: 'CALL', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AJs: forte pra pagar, marginal pra 3-bet valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥Q♥', correctAction: 'CALL', difficulty: 'EASY', category: 'THREE_BET', explanation: 'KQs: paga em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♣7♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: '77: paga pra tentar a trinca.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♦T♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'TT: aqui flatamos em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣Q♦', correctAction: 'CALL', difficulty: 'HARD', category: 'THREE_BET', explanation: 'AQo: paga em posicao contra o open do CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♥9♦', correctAction: 'CALL', difficulty: 'EASY', category: 'THREE_BET', explanation: '99: paga em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦J♦', correctAction: 'CALL', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AJs: paga em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣Q♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'KQs: paga em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♦T♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'JTs: paga em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'KK: 3-bet por valor, não só call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♣7♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'T7o: fold.' },
        ],
      },
      {
        title: '3-Bet: teste', concept: 'Revisão 3bet', description: 'Misture valor, blefe, call e fold contra um open.',
        minExercises: 7, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AA: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣5♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'A5s: 3-bet blefe (blocker).' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♥8♣', correctAction: 'CALL', difficulty: 'EASY', category: 'THREE_BET', explanation: '88: paga em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♠4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: '94o e fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♦K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥J♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'AJs: paga em posicao.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♣7♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'Q7o e fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AA: 3-bet valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦4♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'A4s: 3-bet blefe.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♣2♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'Q2o e fold.' },
        ],
      },
      { title: 'Flop: projetos (aula)', concept: 'Flop projetos intro', description: 'Maos que ainda podem virar.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: 'Flop: projetos', concept: 'Flop projetos', description: 'Continue com projetos fortes.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '9♠8♦2♣', heroHand: 'J♥T♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Sequencia aberta (JT): call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '8♠5♠2♦', heroHand: 'A♠J♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Nut flush draw: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '9♥6♥2♣', heroHand: '8♥7♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Flush draw + sequencia: semi-blefe raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♠T♦4♣', heroHand: 'Q♥J♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Sequencia aberta QJ: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♦7♣3♦', heroHand: 'K♦Q♦', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Nut flush draw + overs: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'T♣9♦2♠', heroHand: '8♥7♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Sequencia aberta baixa: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '6♠5♠2♦', heroHand: 'A♠T♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Nut flush draw: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♦Q♣5♥', heroHand: 'J♠T♠', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Sequencia aberta JT: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '9♣8♠3♦', heroHand: '7♥6♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Sequencia aberta: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♥7♦2♥', heroHand: 'K♥Q♥', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Nut flush draw: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♦K♣3♥', heroHand: 'T♠9♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Sem par e sem projeto real: fold.' },
        ],
      },
      {
        title: 'Flop: teste', concept: 'Flop teste', description: 'Misture valor, projeto e fold.',
        minExercises: 7, passRate: 0.75, xpReward: 90,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♠7♦2♣', heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Overpair: raise valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '9♥6♥2♣', heroHand: '8♥7♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Monster draw: semi-blefe.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'Q♣J♦3♠', heroHand: '6♥5♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'C_BET', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♦T♣5♠', heroHand: 'A♣Q♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Top pair bom kicker: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'J♠8♦3♣', heroHand: '4♣4♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Underpair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'K♦T♠4♣', heroHand: 'Q♥J♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Sequencia aberta: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '8♣7♦2♠', heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Overpair: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '8♣7♦2♠', heroHand: 'K♦K♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: 'A♦T♣5♠', heroHand: 'J♥9♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'C_BET', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 6, board: '9♥8♥3♣', heroHand: '7♥6♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Flush+sequencia draw: semi-blefe.' },
        ],
      },
      { title: 'C-bet: agora você ataca', concept: 'Cbet intro', description: 'Você abriu e o vilão deu check: Bet ou Check?', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'C-bet por valor', concept: 'Cbet valor', description: 'Mão forte aposta; média faz check atrás.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♥7♦2♣', heroHand: 'A♠K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Top pair top kicker: aposte por valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♥7♦2♣', heroHand: 'K♦Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Top pair: aposte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♠8♦3♣', heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Overpair: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♦7♣2♠', heroHand: '7♠7♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Trinca: aposte — extraia valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'J♠8♥3♦', heroHand: 'Q♦Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair no board baixo: aposte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♥9♣4♠', heroHand: 'A♦Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Top pair com kicker forte: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'J♦9♥3♠', heroHand: 'A♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Top pair, kicker ás: aposte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♥7♠2♦', heroHand: '8♠8♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Par médio: check atrás — showdown value.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♦Q♣6♥', heroHand: '9♥9♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Duas overcards no board: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♠K♦8♣', heroHand: 'J♥J♦', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'JJ debaixo de A e K: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♣Q♦5♥', heroHand: 'T♦T♠', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'TT sob K e Q: check, showdown.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♠J♥4♦', heroHand: '6♦6♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Par pequeno: check.' },
        ],
      },
      {
        title: 'C-bet: leia a textura', concept: 'Cbet textura', description: 'Seco blefa barato; molhado só aposta valor.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♠7♥2♣', heroHand: 'A♦5♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Board seco favorece quem abriu: c-bet blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♦8♠3♥', heroHand: 'Q♣J♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Seco: blefe barato com overcards.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '8♣3♦2♠', heroHand: 'A♥K♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overcards no board seco: c-bet.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♥K♦8♠', heroHand: '5♣4♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Board do agressor (A-K): blefe — o BB quase nunca conectou.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♦7♣2♥', heroHand: 'A♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Seco e sem showdown: aposte como blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♠8♦7♦', heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair: aposte mesmo no molhado — proteja.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'T♥9♥6♣', heroHand: '8♦7♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Fez a sequência: valor no board molhado.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥7♣', heroHand: '6♥6♠', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Molhado e par pequeno: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'J♥T♥9♣', heroHand: 'A♣Q♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Molhado demais pra blefar: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '8♥7♥3♦', heroHand: 'J♠T♦', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Molhado e sem nada: check — blefe caro.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♥J♥T♣', heroHand: 'Q♥Q♠', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Board horrível para QQ: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♠K♥7♦', heroHand: '9♣9♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: '99 sob A e K: check.' },
        ],
      },
      {
        title: 'C-bet: teste', concept: 'Cbet teste', description: 'Bet ou check — decida como agressor.',
        minExercises: 7, passRate: 0.75, xpReward: 90,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♣8♦2♥', heroHand: 'A♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Top pair top kicker: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♠9♥3♦', heroHand: '8♥8♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Par médio: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♥7♦2♠', heroHand: 'A♠4♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Seco: blefe com backdoor de nut flush.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥4♣', heroHand: 'K♦J♦', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Molhado e só overcards: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♦9♦4♣', heroHand: 'K♠K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair: aposte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♣J♠5♦', heroHand: 'T♥T♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'TT sob A e J: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♣5♥2♦', heroHand: '5♠5♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Trinca: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♦7♣2♠', heroHand: 'Q♣J♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Board seco: c-bet blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'T♠9♠8♦', heroHand: '7♥7♠', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Par pequeno em board conectado: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♦8♥3♣', heroHand: 'A♥Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Top pair com kicker forte: valor.' },
        ],
      },
      { title: 'Turn: projetos (aula)', concept: 'Turn projetos intro', description: 'Resta so o river para completar.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: 'Turn: projetos', concept: 'Turn projetos', description: 'Continue so com preco e outs.',
        minExercises: 5, passRate: 0.7, xpReward: 75,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '9♠8♦2♣K♥', heroHand: 'J♥T♦', correctAction: 'CALL', difficulty: 'HARD', category: 'TURN', explanation: 'Sequencia aberta ainda viva: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '8♠5♠2♦Q♣', heroHand: 'A♠J♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Nut flush draw: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '9♥6♥2♣K♦', heroHand: '8♥7♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'TURN', explanation: 'Flush + sequencia: semi-blefe.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♠T♦4♣3♥', heroHand: 'Q♥J♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sequencia aberta QJ: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♦7♣3♦9♠', heroHand: 'K♦Q♦', correctAction: 'CALL', difficulty: 'HARD', category: 'TURN', explanation: 'Nut flush draw: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'T♣9♦2♠4♥', heroHand: '8♦7♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sequencia aberta 8-7: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '6♠5♦2♣Q♠', heroHand: 'A♠T♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Nut flush draw: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♦Q♣5♥7♦', heroHand: 'J♠T♠', correctAction: 'CALL', difficulty: 'HARD', category: 'TURN', explanation: 'Sequencia aberta: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '9♣8♠3♦K♥', heroHand: '7♥6♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sequencia aberta: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♥7♦2♥9♠', heroHand: 'K♥Q♥', correctAction: 'CALL', difficulty: 'HARD', category: 'TURN', explanation: 'Nut flush draw: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♠Q♦3♣K♥', heroHand: '8♥7♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sem par e sem projeto no turn: fold.' },
        ],
      },
      {
        title: 'Turn: teste', concept: 'Turn teste', description: 'Misture valor, projeto e fold.',
        minExercises: 7, passRate: 0.75, xpReward: 95,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♠7♦2♣5♥', heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '9♥6♥2♣K♦', heroHand: '8♥7♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'TURN', explanation: 'Monster draw: semi-blefe.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♣J♦3♠5♦', heroHand: '6♥5♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Bottom pair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♦T♣5♠8♣', heroHand: 'A♥Q♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'J♠8♦3♣T♥', heroHand: '4♣4♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Underpair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♠T♦4♣3♥', heroHand: 'Q♥J♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sequencia aberta: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '8♦7♣2♠3♥', heroHand: 'A♠A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'TURN', explanation: 'Overpair: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '8♣7♦2♠K♥', heroHand: 'A♦A♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♦T♣5♠8♦', heroHand: 'J♥9♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'TURN', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: '9♥8♥3♣Q♦', heroHand: '7♥6♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'TURN', explanation: 'Flush+seq draw: semi-blefe.' },
        ],
      },
      { title: 'Segunda bala', concept: 'Barrel intro', description: 'Você apostou o flop e o vilão deu check de novo.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'Barrel por valor', concept: 'Barrel valor', description: 'Mão forte segue apostando; média freia.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♥9♦3♣2♦', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'TURN', explanation: 'Top pair top kicker: segunda bala de valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♠8♣3♦5♥', heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'TURN', explanation: 'Overpair: siga apostando.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'J♣7♦2♥4♠', heroHand: 'Q♦Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair: valor de novo no turn.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♦8♣2♠6♦', heroHand: '8♠8♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Trinca: aposte — o pote precisa crescer.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♥9♠4♦2♣', heroHand: 'A♦Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair com kicker forte: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '5♥4♠3♦9♣', heroHand: '7♦6♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sequência feita: bale de novo.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♦7♥3♠2♠', heroHand: 'K♣Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair bom kicker: valor no turn.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'J♥8♦2♣7♠', heroHand: 'A♠J♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair, kicker ás: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♣7♦4♥J♠', heroHand: '9♠9♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Par médio virou bluff-catcher: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '8♦5♥2♣K♥', heroHand: 'A♣8♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'O K no turn esfriou sua mão: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♠9♦3♥A♦', heroHand: 'J♥J♠', correctAction: 'CALL', difficulty: 'HARD', category: 'TURN', explanation: 'A e Q no board: JJ vira check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'J♦8♠3♦K♠', heroHand: 'T♠T♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overcards demais: check atrás.' },
        ],
      },
      {
        title: 'Barrel: a carta do turn', concept: 'Barrel carta', description: 'Cartas boas balem; blanks desistem.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '8♦5♣2♥A♠', heroHand: 'Q♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'O Ás no turn é a carta do SEU range: bale de blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♥T♥2♣5♦', heroHand: '9♥8♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'TURN', explanation: 'Flush draw + gutshot: semi-blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♠8♦2♣3♥', heroHand: 'J♦T♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sequência aberta: semi-blefe no turn.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♥7♥2♠5♣', heroHand: 'Q♥J♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Flush draw e duas overcards: bale.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♦7♠2♣K♣', heroHand: 'A♣5♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Nut flush draw e o K ajuda seu range: bale.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♦8♠7♠2♣', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair: proteja apostando.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♠8♣3♥2♠', heroHand: 'A♦4♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'TURN', explanation: 'Gutshot + overcard: blefe com equity.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♦Q♥7♠2♦', heroHand: '6♣5♣', correctAction: 'CALL', difficulty: 'EASY', category: 'TURN', explanation: 'Ar total e turn blank: desista — check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♠K♥4♦2♦', heroHand: 'T♣9♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sem par e sem projeto: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'J♦8♥3♣2♥', heroHand: 'K♠Q♠', correctAction: 'CALL', difficulty: 'HARD', category: 'TURN', explanation: 'Só overcards, sem projeto no turn: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♥K♦3♠2♥', heroHand: '8♦7♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'O board alto não é do 87: check e desista.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♣J♥8♦A♣', heroHand: '4♠4♥', correctAction: 'CALL', difficulty: 'EASY', category: 'TURN', explanation: 'Par pequeno num board altíssimo: check.' },
        ],
      },
      {
        title: 'Barrel: teste', concept: 'Barrel teste', description: 'Segunda bala ou freio de mão?',
        minExercises: 7, passRate: 0.75, xpReward: 90,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♣9♠4♥2♠', heroHand: 'A♦K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'TURN', explanation: 'Top pair top kicker: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♠J♦5♥3♣', heroHand: 'T♦T♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'TT sob A e J: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♣6♦2♠A♥', heroHand: 'Q♠J♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'TURN', explanation: 'O Ás do turn é seu: blefe de novo.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♠Q♦8♥3♠', heroHand: '6♥6♦', correctAction: 'CALL', difficulty: 'EASY', category: 'TURN', explanation: 'Par pequeno: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'J♠7♥2♦8♣', heroHand: 'K♥K♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Overpair: siga no valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♥8♣2♦3♦', heroHand: 'J♣T♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sequência aberta: semi-blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♠5♦2♥K♦', heroHand: 'A♥9♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Par de 9 sob o K do turn: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♥J♣7♠2♣', heroHand: '5♦4♦', correctAction: 'CALL', difficulty: 'EASY', category: 'TURN', explanation: 'Ar sem projeto: desista.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '8♥6♣2♠Q♦', heroHand: '8♣8♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Trinca: aposte o turn.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♥T♦4♣2♥', heroHand: 'A♠Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Top pair kicker ás: valor.' },
        ],
      },
      { title: 'River: bluff-catch (aula)', concept: 'River catch intro', description: 'Pagar mao media contra blefe.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: 'River: pagar ou nao', concept: 'River catch', description: 'Top pair paga; ar desiste.',
        minExercises: 5, passRate: 0.7, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠Q♦7♣2♥5♦', heroHand: 'A♣A♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Overpair: bom bluff-catcher, pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠T♦6♣9♥2♣', heroHand: 'A♥J♦', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Top pair kicker fraco: pague fino.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'Q♦J♣8♠3♥6♦', heroHand: 'Q♥T♦', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Top pair: pague uma aposta.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♣7♦7♠4♥2♦', heroHand: 'A♦K♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair top kicker: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'T♠9♦5♣5♥2♥', heroHand: 'A♣T♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'J♥6♦6♣3♠2♣', heroHand: 'K♠J♦', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Top pair kicker rei: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♦Q♣8♠5♥2♦', heroHand: 'A♠J♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair kicker medio: bluff-catch.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠J♦7♣4♥2♠', heroHand: 'K♦T♦', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Top pair: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'Q♥9♠6♦3♣2♥', heroHand: 'A♣Q♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair top kicker: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'J♣8♦5♠4♦2♣', heroHand: 'A♠J♠', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Top pair: pague fino.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♦Q♣9♥4♦2♣', heroHand: '7♠6♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Sete-alto não ganha de nada: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠K♦8♣4♥2♦', heroHand: 'J♥T♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'O projeto não veio e JT não paga nada: fold.' },
        ],
      },
      {
        title: 'River: teste', concept: 'River teste', description: 'Misture valor, catch e fold.',
        minExercises: 7, passRate: 0.75, xpReward: 100,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♥7♦7♠3♣7♣', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Sevens full: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠Q♦7♣2♥5♦', heroHand: 'A♣A♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Overpair bluff-catch: call.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠K♦8♣4♥2♠', heroHand: 'Q♥J♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: '9♠8♦7♣2♠3♥', heroHand: 'J♥T♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Sequencia: raise valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'T♣9♦2♠4♥K♣', heroHand: '8♦7♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto morto: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠T♦6♣9♥2♣', heroHand: 'A♥J♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair: pague.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♦J♠5♣5♥8♠', heroHand: 'K♣K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Full house: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠K♥7♦2♣5♠', heroHand: 'A♣K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Trinca de reis: raise.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♣Q♦8♥5♠2♣', heroHand: 'K♦J♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'Q♥9♠6♦3♣2♥', heroHand: 'A♦Q♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair top kicker: pague.' },
        ],
      },
      { title: 'A última decisão', concept: 'Valuebet intro', description: 'O vilão deu check no river: valor, blefe ou mostra?', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'Value bet no river', concept: 'Valuebet valor', description: 'Se mão pior paga, aposte; senão, check.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♦9♣4♦2♠7♣', heroHand: 'A♥K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'RIVER', explanation: 'Top pair top kicker: extraia no river.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♥8♠3♦2♣9♦', heroHand: 'K♠Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair bom kicker: aposte fino.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♣8♦4♥2♥6♠', heroHand: 'A♦A♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'RIVER', explanation: 'Overpair: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♣7♦2♠9♠3♥', heroHand: '7♥7♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Trinca: aposte e cobre.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♦8♣2♦7♠A♣', heroHand: 'J♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Sequência: valor máximo.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♦9♠5♣3♦J♣', heroHand: 'A♣Q♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair, kicker dama: valor fino.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♣7♦3♠2♦5♠', heroHand: 'K♣K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'RIVER', explanation: 'Overpair no board baixo: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'J♦8♥3♥6♣2♣', heroHand: 'A♦J♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair kicker ás: aposte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♥6♣2♣Q♠4♠', heroHand: '9♦9♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: '99 sob K e Q: check — showdown de graça.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '8♠5♥2♥K♠J♦', heroHand: 'A♠8♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Par médio: check e mostre.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♠7♥3♣T♦2♦', heroHand: 'Q♦J♦', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Top pair, kicker mediano: só perde pra quem paga — check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♥8♥4♣6♦2♠', heroHand: 'T♥T♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'TT sob o Ás: check.' },
        ],
      },
      {
        title: 'River: virar blefe', concept: 'Valuebet blefe', description: 'Sem showdown, blefe; com showdown, check.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♥J♥4♠2♦K♦', heroHand: '9♥8♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Flush draw não veio e 9-alto não mostra: blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♦Q♦8♠3♣A♠', heroHand: '7♦6♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Projeto perdido, zero showdown: blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '9♠8♦2♣3♥K♥', heroHand: 'J♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'A sequência não veio: última bala.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'J♥9♥2♦A♦Q♣', heroHand: '5♥4♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Cinco-alto: só ganha blefando.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♠J♦4♦2♠6♥', heroHand: 'Q♣T♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Open-ended perdeu e Q-alto não mostra: blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '8♦7♦2♥A♥K♣', heroHand: 'T♦9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Dois projetos, nenhum veio: blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'T♠9♠2♦K♦A♥', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'RIVER', explanation: 'Seis-alto: blefe ou nada.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♣9♦3♦Q♥2♠', heroHand: 'A♥4♥', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Ás-alto ganha de blefes: check e mostre.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♣Q♦9♥3♠2♥', heroHand: '8♠8♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: '88 tem showdown: check — não vire blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♦J♣7♥3♣K♠', heroHand: '9♣9♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: '99: showdown de graça — check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♠J♠4♥3♣7♣', heroHand: 'K♦Q♦', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'K-alto às vezes ganha: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♠T♥3♥8♦2♦', heroHand: 'A♣J♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Ás-alto: check — você ganha dos blefes dele.' },
        ],
      },
      {
        title: 'Value bet: teste', concept: 'Valuebet teste', description: 'Valor fino, blefe ou showdown?',
        minExercises: 7, passRate: 0.75, xpReward: 90,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♥T♣5♦2♣8♥', heroHand: 'A♠K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'RIVER', explanation: 'Top pair top kicker: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♦Q♥6♠3♠2♥', heroHand: '9♠9♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: '99 sob A e Q: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♥J♥3♦2♠A♣', heroHand: '8♥7♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto morto e 8-alto: blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♣9♣4♥2♦J♠', heroHand: 'A♥Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Top pair kicker ás: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♦8♠4♣3♦2♦', heroHand: 'A♦T♠', correctAction: 'CALL', difficulty: 'HARD', category: 'RIVER', explanation: 'Ás-alto: check e mostre.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'K♠Q♦J♣9♥2♠', heroHand: '6♦6♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Par pequeno em board alto: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '8♣7♦3♠2♥5♥', heroHand: 'Q♠Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Overpair: valor no river.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: '8♣7♠2♦K♥A♦', heroHand: 'T♣9♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'RIVER', explanation: 'Open-ended morreu e T-alto não mostra: blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'Q♦9♦5♣2♣7♥', heroHand: 'K♣K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'RIVER', explanation: 'Overpair: aposte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 12, board: 'A♣K♦9♠4♦2♥', heroHand: 'J♦J♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'JJ sob A e K: check.' },
        ],
      },
    ],
  },

  {
    order: 3,
    name: 'Avançado',
    description: '4-bet, squeeze e defesas posição a posição.',
    icon: '👑',
    color: '#C2185B',
    stages: [
      { title: '4-Bet: o relanço do relanço', concept: '4bet explicado', description: 'Quando o 3-bet do vilao vira 4-bet seu.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: '4-Bet: valor, call e blefe', concept: '4bet value blefe', description: 'Premium 4-beta; QQ/AK paga; blockers blefam.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: '4-Bet por valor', concept: '4bet valor', description: 'So os monstros 4-betam por valor.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AA: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♣K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'KK: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AKs: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AA: sempre 4-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'KK: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♣K♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'AKs: 4-bet forte.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'Q♦8♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'Q8o desiste contra o 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'Q♣Q♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'QQ paga o 3-bet.' },
        ],
      },
      {
        title: '4-Bet: pagar o 3-bet', concept: '4bet call', description: 'QQ, JJ e AKo preferem pagar.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'Q♠Q♦', correctAction: 'CALL', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'QQ: paga o 3-bet (4-bet fica muito exposto).' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'J♣J♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'JJ: paga o 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♦K♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'AKo: paga o 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'Q♥Q♣', correctAction: 'CALL', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'QQ: call.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'J♦J♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'JJ: call.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♣K♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'AKo: call.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♦A♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AA: 4-bet, não só call.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'T♥8♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'T8o: fold fácil.' },
        ],
      },
      {
        title: '4-Bet: blefe e fold', concept: '4bet blefe', description: 'Blockers blefam; o resto foldam.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'A5s: 4-bet blefe (blocker de ases).' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♥4♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'FOUR_BET', explanation: 'A4s: 4-bet blefe.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♣3♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'FOUR_BET', explanation: 'A3s: 4-bet blefe com blocker.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'FOUR_BET', explanation: '72o: fold ao 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♠J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'KJo: fold ao 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: '9♥9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'FOUR_BET', explanation: '99: fold ao 3-bet (fraco pra 4-bet/call).' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'J♦J♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'JJ: paga o 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♦Q♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'KQs: bonita, mas fold contra 3-bet.' },
        ],
      },
      {
        title: '4-Bet: teste', concept: 'Revisão 4bet', description: 'Misture valor, call, blefe e fold.',
        minExercises: 7, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AA: 4-bet valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♦5♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'A5s: 4-bet blefe.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'Q♠Q♥', correctAction: 'CALL', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'QQ: paga o 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♥K♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'AKo: call.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: '7♠2♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'FOUR_BET', explanation: '72o: fold.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♦K♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'KK: 4-bet valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'J♥J♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'JJ: call.' },
        ],
      },
      { title: 'Defesa vs UTG: respeite o range', concept: 'vsUTG intro', description: 'UTG abre apertado; defenda tight.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'vs UTG: quando 3-betar', concept: 'vsUTG 3bet', description: 'So premiums relancam contra UTG.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'AA: 3-bet mesmo vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♦Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'QQ: 3-bet vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AKs: 3-bet vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥K♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'AKo: 3-bet fino vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♠J♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'JJ: 3-bet vs UTG (ou call).' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠T♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'KTo: fold vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♠T♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'TT: paga — forte, mas não relança vs UTG.' },
        ],
      },
      {
        title: 'vs UTG: pagar', concept: 'vsUTG call', description: 'Pares e suited fortes pagam em posicao.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦Q♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AQs: paga vs UTG (fraco pra 3-bet valor).' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥Q♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'KQs: paga vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♣T♦', correctAction: 'CALL', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'TT: paga pra ver flop.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♠9♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '99: paga vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣J♣', correctAction: 'CALL', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'AJs: paga vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♦8♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '88: paga barato pra buscar trinca.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♠2♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'Lixo é fold, mesmo em posição.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'KK: 3-bet até vs UTG.' },
        ],
      },
      {
        title: 'vs UTG: foldar', concept: 'vsUTG fold', description: 'Contra UTG, muita coisa vira fold.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠9♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'A9o: fraca demais vs UTG. Fold.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'KJo: fold vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♠T♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'QTo: fold vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '5♦4♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'FACING_RAISE', explanation: '54s: sem preco IP vs UTG. Fold.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'J9s: fold vs range apertado de UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '5♣5♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'FACING_RAISE', explanation: '55: fold vs UTG — set-mine raso demais sem o preço.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'AA relança sempre.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♦9♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '99 paga vs UTG.' },
        ],
      },
      { title: 'Defesa vs MP e CO: abra o leque', concept: 'vsMP-CO intro', description: 'Open mais largo pede defesa mais larga.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'vs MP: um passo além', concept: 'vsMP defesa', description: 'Defenda um pouco mais que contra UTG.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'AA: 3-bet sempre.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♦K♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AKs: 3-bet vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♠Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'QQ: 3-bet por valor vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♠T♥', correctAction: 'CALL', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'TT: paga em posição.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣Q♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AQs: paga vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠Q♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'KQs: paga vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♥8♠', correctAction: 'CALL', difficulty: 'HARD', category: 'FACING_RAISE', explanation: '88: paga pra buscar trinca.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦9♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'A9o: fraca demais. Fold.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♥T♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'QTo: fold vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣J♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'KJo: paga vs MP — em posição, dá para defender mais largo.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '6♠6♦', correctAction: 'CALL', difficulty: 'HARD', category: 'FACING_RAISE', explanation: '66: paga vs MP para buscar trinca em posição.' },
        ],
      },
      {
        title: 'vs CO: solte a mão', concept: 'vsCO defesa', description: 'CO abre largo: 3-bete e pague mais.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'AA: 3-bet sempre.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AQs: vs CO vira 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AKo: 3-bet vs CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥5♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'A5s: 3-bet blefe com blocker.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥Q♥', correctAction: 'CALL', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'KQs: paga tranquilo vs CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♣7♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '77: vs CO agora tem preço — paga.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♦T♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'JTs: paga em posição vs CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣T♣', correctAction: 'CALL', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'ATs: paga vs CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥7♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'A7o: ainda é fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠9♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'K9o: fold mesmo vs CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♦9♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'Q9o: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'J8s: bonita, mas fraca demais — fold.' },
        ],
      },
      {
        title: 'vs MP/CO: teste', concept: 'vsMP-CO teste', description: 'MP ou CO abriu — defenda na medida.',
        minExercises: 7, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'AKs: 3-bet vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♣9♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '99: paga vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥T♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'KTo: fold vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣5♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'A5s: 3-bet blefe com blocker.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♦7♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '77: paga vs CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠T♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'ATs: paga vs CO.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♥8♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'J8o: lixo — fold.' },
        ],
      },
      { title: 'Squeeze: o aperto', concept: 'Squeeze intro', description: 'Open + caller: hora de apertar os dois.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'Squeeze por valor', concept: 'Squeeze valor', description: 'Mão forte aperta; lixo desiste.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AA: squeeze — pote gordo com a melhor mão.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'K♠K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'KK: squeeze por valor.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'Q♥Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'QQ: squeeze — não deixe o pote multiway.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♦K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'AKs: squeeze por valor.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♣K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'AKo: squeeze — jogue o pote grande com iniciativa.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'J♠J♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'THREE_BET', explanation: 'JJ: squeeze fino — melhor que jogar multiway OOP.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♥8♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'A8o: fraca pra squeeze, ruim pra call OOP. Fold.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'Q♠T♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'QTo: da SB, sem squeeze e sem call. Fold.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'K♦J♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'KJo: dominada pelos ranges — fold.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: '8♠8♥', correctAction: 'CALL', difficulty: 'HARD', category: 'THREE_BET', explanation: '88: overcall pra buscar trinca no pote gordo.' },
        ],
      },
      {
        title: 'Squeeze: blefe e fold', concept: 'Squeeze blefe', description: 'Blockers apertam; o resto desiste.',
        minExercises: 6, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'A5s: squeeze blefe — blocker de AA/AK e nut flush.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♦4♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'THREE_BET', explanation: 'A4s: squeeze blefe com blocker.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♣Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'AQs: squeeze de valor fino vs CO+BTN.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'K♥K♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'KK: squeeze por valor, sempre.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: '7♥7♦', correctAction: 'CALL', difficulty: 'HARD', category: 'THREE_BET', explanation: '77: overcall minerando trinca.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'K♠9♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'K9o: lixo no aperto. Fold.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'T♣8♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'T8o: fold fácil.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'J♦9♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'J9s: bonita, mas OOP contra dois — fold.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: '7♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'THREE_BET', explanation: '76s: sem posição e sem blocker — fold.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♥J♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'THREE_BET', explanation: 'AJo: nem valor, nem blefe bom — fold da SB.' },
        ],
      },
      {
        title: 'Squeeze: teste', concept: 'Squeeze teste', description: 'Aperte, pague ou desista — na medida.',
        minExercises: 7, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♦A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'AA: squeeze máximo.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♥5♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'THREE_BET', explanation: 'A5s: squeeze blefe com blocker.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'A♠K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'AKo: squeeze por valor.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'Q♦Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'THREE_BET', explanation: 'QQ: squeeze.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: '8♦8♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: '88: overcall pra buscar trinca.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: '7♣7♠', correctAction: 'CALL', difficulty: 'HARD', category: 'THREE_BET', explanation: '77: paga minerando set.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'Q♥T♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'THREE_BET', explanation: 'QTo: fold.' },
          { heroPosition: 'SB', villainPosition: 'CO', villainAction: 'Raise 2.5x', callerPosition: 'BTN', potSize: 6.5, heroHand: 'J♥9♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'THREE_BET', explanation: 'J9s: fold OOP contra dois.' },
        ],
      },
      // ── Postflop do Avançado: TEXTURA ────────────────────────
      // O Intermediário ensina "seco x molhado"; aqui o degrau é a frequência:
      // de quem é a vantagem de range e, por isso, quanto/quando apostar.
      // Spots de agressor (vilão deu check) ⇒ botões Bet/Check.
      { title: 'Vantagem de range', concept: 'Textura vantagem', description: 'De quem é o board — e por que isso define a frequência.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'C-bet em board seco', concept: 'Textura seco', description: 'Com vantagem de range: aposta pequena, quase sempre.',
        minExercises: 6, passRate: 0.7, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♠7♦2♣', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'AA em board seco: aposte por valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♠7♦2♣', heroHand: 'A♥Q♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Ar em board seco ainda aposta: o range dele quase não tem rei.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♠7♦2♣', heroHand: '5♥4♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Blefe barato: K72 raramente acertou o BB.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♦8♣3♥', heroHand: 'K♠Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'O ás é seu: aposte pequeno com KQ.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♦8♣3♥', heroHand: 'A♣J♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Top pair: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♠6♦2♥', heroHand: 'Q♥J♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Top pair em board seco: aposte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♠6♦2♥', heroHand: '9♣8♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Board seco, vantagem sua: blefe pequeno.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♠6♦2♥', heroHand: '6♣5♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Par do meio: tem showdown, não precisa apostar. Check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♣8♠3♦', heroHand: 'K♦T♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Top pair: aposte por valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♣8♠3♦', heroHand: '7♥6♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Ar num board que é seu: aposte pequeno.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♠7♦2♣', heroHand: '7♣6♣', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Par do meio: showdown vale mais que a aposta. Check.' },
        ],
      },
      { title: 'Board molhado: freie', concept: 'Textura molhada', description: 'Sem vantagem de range, aposte menos — e maior.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'C-bet em board molhado', concept: 'Textura molhado', description: 'Quando o board é dele: valor e projeto apostam; ar dá check.',
        minExercises: 6, passRate: 0.7, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥6♣', heroHand: 'A♠A♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Overpair: aposte por valor e proteção.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥6♣', heroHand: 'A♦K♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Ar sem equity num board que é dele: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥6♣', heroHand: 'A♥K♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Projeto de flush máximo: semi-blefe.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥6♣', heroHand: '7♦7♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Par + sequência aberta: semi-blefe forte.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'J♥T♥9♣', heroHand: 'K♠Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Sequência feita (KQJT9): aposte grande por valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'J♥T♥9♣', heroHand: 'A♣2♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Board conectadíssimo e você tem ar: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '7♠6♠5♦', heroHand: '9♠8♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Sequência feita + projeto de flush: valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '7♠6♠5♦', heroHand: 'A♥K♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'AK aqui é ar: o board é do BB. Check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♦J♦T♣', heroHand: 'A♦K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Sequência máxima (AKQJT): aposte por valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♦J♦T♣', heroHand: '8♥7♥', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Ar num board que acerta o BB em cheio: check.' },
        ],
      },
      {
        title: 'Textura: teste', concept: 'Textura teste', description: 'Seco ou molhado? Decida a frequência.',
        minExercises: 8, passRate: 0.75, xpReward: 100,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♠7♦2♣', heroHand: 'J♣9♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Board seco é seu: blefe pequeno.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥6♣', heroHand: 'K♦Q♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Ar em board dele: check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♦8♣3♥', heroHand: 'Q♥Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'QQ em board de ás seco: aposte pequeno.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'J♥T♥9♣', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair em board perigoso: aposte por proteção.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♠6♦2♥', heroHand: 'A♥T♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Seco e alto: aposte mesmo sem par.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '7♠6♠5♦', heroHand: 'K♣K♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Overpair: aposte por valor e proteção.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'K♣8♠3♦', heroHand: '4♥3♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'C_BET', explanation: 'Par de baixo: tem algum showdown. Check.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'Q♦J♦T♣', heroHand: '9♥8♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'C_BET', explanation: 'Sequência feita (89TJQ): valor.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: 'A♦8♣3♥', heroHand: '6♥5♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'C_BET', explanation: 'Board de ás é seu: blefe barato funciona.' },
          { heroPosition: 'BTN', villainPosition: 'BB', villainAction: 'Check', potSize: 5.5, board: '9♥8♥6♣', heroHand: 'Q♠J♠', correctAction: 'CALL', difficulty: 'HARD', category: 'C_BET', explanation: 'Duas overcards não bastam nesse board: check.' },
        ],
      },
      {
        // Fica PRÉ-FLOP de propósito: "todo o preflop é grátis" — um exercício
        // com board aqui tornaria a fase premium (regra em main()) e trancaria
        // o capstone do pré-flop. O pós-flop do nível vive na seção Textura.
        title: 'Desafio final', concept: 'Desafio final', description: 'O teste definitivo do pré-flop.',
        minExercises: 8, passRate: 0.8, xpReward: 120,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA sempre raise.' },
          { heroPosition: 'SB', heroHand: 'K♠7♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K7s abre da SB.' },
          { heroPosition: 'CO', heroHand: '7♥7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 abre de CO.' },
          { heroPosition: 'MP', heroHand: 'K♣J♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJo abre de MP.' },
          { heroPosition: 'BTN', heroHand: 'A♦2♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A2s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'K♣J♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJs abre de UTG.' },
          { heroPosition: 'CO', heroHand: '5♣5♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '55 abre de CO.' },
          { heroPosition: 'BTN', heroHand: 'T♦9♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'T9s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'A♥J♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo é fold de UTG.' },
          { heroPosition: 'MP', heroHand: '9♥9♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '99 abre de MP.' },
        ],
      },
    ],
  },
];

/**
 * PEGADINHAS — mãos-lixo óbvias (offsuit baixas e desconexas) que devem ser
 * FOLD em qualquer posição/cenário preflop. Espalhadas 2 por fase para pegar
 * quem responde no piloto automático (ex.: 36o no CO). São FOLD universal:
 * conferido contra o RFI e as defesas mais largas (BB vs SB).
 */
const TRAP_HANDS = [
  '7♦2♣', '8♦2♣', '9♦2♣', 'T♦2♣', 'J♦2♣', 'Q♦2♣', '6♦2♣', '5♦2♣', '4♦2♣', '3♦2♣',
  '6♦3♣', '7♦3♣', '8♦3♣', '9♦3♣', 'T♦3♣', 'J♦3♣', 'Q♦3♣', '7♦4♣', '8♦4♣', '9♦4♣', 'Q♦4♣', '9♦5♣',
];

/**
 * Injeta 2 pegadinhas em cada fase de PRÁTICA preflop com pelo menos 5
 * exercícios normais (o "mínimo de 5"). Pula aula, postflop (tem board) e spot
 * de agressor (villainAction 'Check' ⇒ Bet/Check, não existe fold). A pegadinha
 * herda o contexto (posição/vilão/categoria) do 1º exercício da fase.
 */
function addTraps(worlds: WorldSeed[]): void {
  let ti = 0;
  for (const w of worlds) {
    for (const s of w.stages) {
      const exs = s.exercises;
      if (exs.length < 5) continue; // mantém o mínimo de 5 normais
      if (exs.some((e) => e.board || e.villainAction === 'Check')) continue; // postflop/agressor
      const base = exs[0];
      const used = new Set(exs.map((e) => e.heroHand));
      let added = 0;
      for (let k = 0; k < TRAP_HANDS.length && added < 2; k++) {
        const hand = TRAP_HANDS[(ti + k) % TRAP_HANDS.length];
        if (used.has(hand)) continue;
        used.add(hand);
        exs.push({
          heroPosition: base.heroPosition,
          villainPosition: base.villainPosition,
          callerPosition: base.callerPosition,
          stackBb: base.stackBb,
          potSize: base.potSize,
          villainAction: base.villainAction,
          heroHand: hand,
          correctAction: 'FOLD',
          difficulty: 'EASY',
          category: base.category,
          explanation: `${labelOfHand(hand)}: lixo — fold fácil. Não abra no piloto automático.`,
        });
        added++;
      }
      ti += 2;
    }
  }
}

addTraps(WORLDS);

/**
 * Sessões mais longas para o jogo não terminar rápido demais. Os pools são
 * grandes (~14 exercícios/fase) mas as sessões mostravam só 4-8 — muito do
 * conteúdo nunca aparecia num playthrough. Aumenta a sessão (teto = pool), o
 * que também exige mais acertos para passar. M0 (iniciante) fica curto de
 * propósito; o alongamento é do M1 em diante.
 */
function lengthenSessions(worlds: WorldSeed[]): void {
  for (const w of worlds) {
    if (w.order < 1) continue; // M0 = primeiros passos, mantém curto
    for (const s of w.stages) {
      if (s.exercises.length === 0 || s.minExercises <= 0) continue;
      s.minExercises = Math.min(s.exercises.length, s.minExercises + 4);
    }
  }
}

lengthenSessions(WORLDS);

const ACHIEVEMENTS = [
  { code: 'FIRST_HAND', name: 'Primeira Mão', description: 'Completar o primeiro exercício', icon: '🃏' },
  { code: 'HOT_STREAK', name: 'Em Chamas', description: 'Acertar 5 exercícios seguidos', icon: '🚀' },
  { code: 'PERFECT_WEEK', name: 'Semana Perfeita', description: '7 dias seguidos de sessão', icon: '🔥' },
  { code: 'SHARP_SHOOTER', name: 'Sharp Shooter', description: 'Acertar 50 exercícios seguidos sem erro', icon: '🎯' },
  { code: 'EXPLORER', name: 'Explorador', description: 'Chegar a todos os Mundos', icon: '🌎' },
  { code: 'BTN_MASTER', name: 'Nível Iniciante Perfeito', description: 'Completar o Nível Iniciante com 90%+ de acerto', icon: '♠' },
  { code: 'THREEBET_MACHINE', name: '3Bet Machine', description: 'Acertar 100 exercícios de 3-bet', icon: '⚡' },
  { code: 'FULL_GAME', name: 'Full Game', description: 'Completar todos os Mundos', icon: '👑' },
];

export const MISSIONS = [
  // DIÁRIAS — o dia serve 2 fáceis, 2 médias e 1 difícil (getMissions).
  // Há mais missões do que vagas em cada faixa: a rotação diária varia o cardápio.
  { code: 'DAILY_PLAY', title: 'Sente à mesa', description: 'Jogue ao menos 1 exercício hoje.', type: 'DAILY', difficulty: 'EASY', xpReward: 10, target: 1 },
  { code: 'DAILY_3_CORRECT', title: '3 acertos hoje', description: 'Acerte 3 exercícios hoje.', type: 'DAILY', difficulty: 'EASY', xpReward: 12, target: 3 },
  { code: 'DAILY_5_CORRECT', title: '5 acertos hoje', description: 'Acerte 5 exercícios hoje.', type: 'DAILY', difficulty: 'EASY', xpReward: 15, target: 5 },

  { code: 'DAILY_10_CORRECT', title: '10 acertos hoje', description: 'Acerte 10 exercícios hoje.', type: 'DAILY', difficulty: 'MEDIUM', xpReward: 25, target: 10 },
  { code: 'DAILY_15_CORRECT', title: '15 acertos hoje', description: 'Acerte 15 exercícios hoje.', type: 'DAILY', difficulty: 'MEDIUM', xpReward: 35, target: 15 },
  { code: 'DAILY_FINISH_STAGE', title: 'Conclua uma fase', description: 'Complete 1 fase hoje.', type: 'DAILY', difficulty: 'MEDIUM', xpReward: 30, target: 1 },
  { code: 'DAILY_STREAK_5', title: '5 seguidas', description: 'Acerte 5 exercícios em sequência hoje.', type: 'DAILY', difficulty: 'MEDIUM', xpReward: 35, target: 5 },

  { code: 'DAILY_20_CORRECT', title: '20 acertos hoje', description: 'Acerte 20 exercícios hoje.', type: 'DAILY', difficulty: 'HARD', xpReward: 50, target: 20 },
  { code: 'DAILY_30_CORRECT', title: '30 acertos hoje', description: 'Acerte 30 exercícios hoje.', type: 'DAILY', difficulty: 'HARD', xpReward: 75, target: 30 },
  { code: 'DAILY_2_STAGES', title: 'Duas fases hoje', description: 'Complete 2 fases hoje.', type: 'DAILY', difficulty: 'HARD', xpReward: 60, target: 2 },
  { code: 'DAILY_STREAK_10', title: '10 seguidas', description: 'Acerte 10 exercícios em sequência hoje.', type: 'DAILY', difficulty: 'HARD', xpReward: 80, target: 10 },
  { code: 'DAILY_PERFECT_STAGE', title: 'Fase impecável', description: 'Complete uma fase hoje sem errar nenhuma mão.', type: 'DAILY', difficulty: 'HARD', xpReward: 90, target: 1 },

  // SEMANAIS — 1 de cada faixa por semana.
  { code: 'WEEKLY_3_DAYS', title: '3 dias na semana', description: 'Jogue em 3 dias diferentes esta semana.', type: 'WEEKLY', difficulty: 'EASY', xpReward: 100, target: 3 },
  { code: 'WEEKLY_50_CORRECT', title: '50 acertos na semana', description: 'Acerte 50 exercícios esta semana.', type: 'WEEKLY', difficulty: 'EASY', xpReward: 120, target: 50 },

  { code: 'WEEKLY_5_DAYS', title: '5 dias na semana', description: 'Jogue em 5 dias diferentes esta semana.', type: 'WEEKLY', difficulty: 'MEDIUM', xpReward: 200, target: 5 },
  { code: 'WEEKLY_5_STAGES', title: '5 fases na semana', description: 'Complete 5 fases esta semana.', type: 'WEEKLY', difficulty: 'MEDIUM', xpReward: 150, target: 5 },

  { code: 'WEEKLY_7_DAYS', title: 'Semana cheia', description: 'Jogue todos os 7 dias desta semana.', type: 'WEEKLY', difficulty: 'HARD', xpReward: 350, target: 7 },
  { code: 'WEEKLY_100_CORRECT', title: '100 acertos na semana', description: 'Acerte 100 exercícios esta semana.', type: 'WEEKLY', difficulty: 'HARD', xpReward: 250, target: 100 },
  { code: 'WEEKLY_10_STAGES', title: '10 fases na semana', description: 'Complete 10 fases esta semana.', type: 'WEEKLY', difficulty: 'HARD', xpReward: 300, target: 10 },
];


export async function main() {
  console.log('🌱 Iniciando seed...');

  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({ where: { code: a.code }, update: a, create: a });
  }
  console.log(`✓ ${ACHIEVEMENTS.length} conquistas`);

  for (const m of MISSIONS) {
    await prisma.mission.upsert({ where: { code: m.code }, update: m, create: m });
  }
  console.log(`✓ ${MISSIONS.length} missões`);

  let stageCount = 0;
  let exerciseCount = 0;

  for (const w of WORLDS) {
    const world = await prisma.world.upsert({
      where: { order: w.order },
      update: { name: w.name, description: w.description, icon: w.icon, color: w.color },
      create: { order: w.order, name: w.name, description: w.description, icon: w.icon, color: w.color },
    });

    for (const [si, s] of w.stages.entries()) {
      const order = si + 1;
      // Premium = fases COM board (postflop) dos níveis 2+. Aulas e todo o
      // preflop são grátis em qualquer nível.
      const premium = w.order >= 2 && s.exercises.some((e) => e.board);
      const stage = await prisma.stage.upsert({
        where: { worldId_order: { worldId: world.id, order } },
        update: {
          title: s.title, concept: s.concept, description: s.description,
          minExercises: s.minExercises, maxExercises: s.exercises.length,
          passRate: s.passRate, xpReward: s.xpReward, premium,
        },
        create: {
          worldId: world.id, order, title: s.title, concept: s.concept,
          description: s.description, minExercises: s.minExercises,
          maxExercises: s.exercises.length, passRate: s.passRate, xpReward: s.xpReward,
          premium,
        },
      });
      stageCount++;

      for (const [ei, ex] of s.exercises.entries()) {
        const exOrder = ei + 1;
        const freq = freqForExercise(ex);
        const data = {
          order: exOrder,
          heroPosition: ex.heroPosition,
          villainPosition: ex.villainPosition ?? null,
          callerPosition: ex.callerPosition ?? null,
          stackBb: ex.stackBb ?? 100,
          potSize: ex.potSize ?? 1.5,
          heroHand: ex.heroHand,
          board: ex.board ?? null,
          villainAction: ex.villainAction ?? null,
          correctAction: ex.correctAction,
          explanation: ex.explanation,
          difficulty: ex.difficulty,
          category: ex.category,
          xpValue: XP[ex.difficulty],
          // Sai do range, nunca da `difficulty` (que é ritmo, não poker).
          // `null` = não há chart por trás (postflop/4-bet/squeeze): sem dado,
          // o app não mostra barra em vez de inventar uma.
          frequencies: freq ? JSON.stringify(freq) : null,
        };
        await prisma.exercise.upsert({
          where: { stageId_order: { stageId: stage.id, order: exOrder } },
          update: data,
          create: { ...data, stageId: stage.id },
        });
        exerciseCount++;
      }
      // Remove exercícios extras (ex.: fase virou aula).
      await prisma.exercise.deleteMany({ where: { stageId: stage.id, order: { gt: s.exercises.length } } });
    }
    // Remove fases que não existem mais neste mundo (ex.: aulas movidas).
    await prisma.stage.deleteMany({ where: { worldId: world.id, order: { gt: w.stages.length } } });
    console.log(`✓ Mundo ${w.order} — ${w.name} (${w.stages.length} fases)`);
  }
  // Remove mundos que deixaram de existir (reestruturação por níveis).
  await prisma.world.deleteMany({ where: { order: { gte: WORLDS.length } } });


  // Um loop só: RFI e defesa têm o mesmo formato (RFI é o caso sem `call`),
  // e as células saem do mesmo `freqForHand` que alimenta os exercícios.
  for (const def of RANGE_DEFS) {
    const key = { gameType: 'CASH', tableSize: 'SIX_MAX', stackBb: 100, position: def.position, scenario: def.scenario };
    const cells = JSON.stringify(buildCells(def));
    await prisma.range.upsert({
      where: { gameType_tableSize_stackBb_position_scenario: key },
      update: { label: def.label, cells },
      create: { ...key, label: def.label, cells },
    });
  }
  console.log(`✓ ${RANGE_DEFS.length} ranges (13x13)`);

  console.log(`✅ Seed concluído: ${WORLDS.length} mundos, ${stageCount} fases, ${exerciseCount} exercícios.`);
}

