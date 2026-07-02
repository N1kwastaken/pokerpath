import { PrismaClient } from '@prisma/client';

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
 */
const prisma = new PrismaClient();

type ExerciseSeed = {
  heroPosition: string;
  villainPosition?: string;
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

type StageSeed = {
  title: string;
  concept: string;
  description: string;
  minExercises: number;
  passRate: number;
  xpReward: number;
  exercises: ExerciseSeed[];
};

type WorldSeed = {
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

const WORLDS: WorldSeed[] = [
  {
    order: 0,
    name: 'Primeiros Passos',
    description: 'Nunca jogou? Comece aqui: cartas, naipes e o básico.',
    icon: '🎴',
    color: '#8B5CF6',
    stages: [
      { title: 'Bem-vindo ao poker', concept: 'Boas-vindas ao poker', description: 'O que é o jogo e qual o objetivo.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'O baralho e os naipes', concept: 'Baralho e naipes', description: '52 cartas, 4 naipes, 13 valores.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'A ordem das cartas', concept: 'Ordem das cartas', description: 'Do 2 ao Ás: quem vale mais.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'O ranking das mãos', concept: 'Ranking de mãos', description: 'Da carta alta ao royal flush.', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
      { title: 'Como funciona uma rodada', concept: 'Anatomia de uma rodada', description: 'Blinds, ações e as ruas (flop, turn, river).', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
    ],
  },
  {
    order: 1,
    name: 'Preflop',
    description: 'Do open raise à defesa: domine a primeira rua.',
    icon: '🃏',
    color: '#1B8A4C',
    stages: [
// 3 — PRÁTICA
      {
        title: 'Reconhecendo mãos fortes', concept: 'Mãos fortes', description: 'Mão forte abre (raise); lixo descarta (fold).',
        minExercises: 5, passRate: 0.7, xpReward: 50,
        exercises: [
          { heroPosition: 'BTN', heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA é a melhor mão. Sempre raise.' },
          { heroPosition: 'BTN', heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '72o é a pior mão do poker. Fold.' },
          { heroPosition: 'BTN', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK é premium. Raise.' },
          { heroPosition: 'BTN', heroHand: '9♠4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '94o é fraca demais. Fold.' },
          { heroPosition: 'BTN', heroHand: 'Q♣Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ é premium. Raise.' },
          { heroPosition: 'BTN', heroHand: 'J♥3♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'J3o não joga. Fold.' },
          { heroPosition: 'BTN', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '65s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠7♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7o fica de fora de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠6♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6o fica de fora de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠5♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5o fica de fora de BTN.' },
        ],
      },
      // 5 — AULA
      { title: 'O poder da posição', concept: 'Posição (aula)', description: 'Por que agir por último é uma vantagem.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      // 6 — PRÁTICA
      {
        title: 'O que é posição', concept: 'Posição na mesa', description: 'Pratique abrir conforme a posição.',
        minExercises: 5, passRate: 0.7, xpReward: 50,
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
          { heroPosition: 'UTG', heroHand: 'K♠J♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJs ainda é fold de UTG.' },
          { heroPosition: 'BTN', heroHand: 'Q♦9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Q9s abre no BTN.' },
          { heroPosition: 'MP', heroHand: 'Q♦9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q9s não abre de MP.' },
        ],
      },
      // 7 — AULA
      { title: 'Abrir o pote: open raise', concept: 'Abrir o pote', description: 'O que significa ser o primeiro a apostar.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
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
          { heroPosition: 'UTG', heroHand: 'K♠Q♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'De UTG, KQo fica de fora.' },
          { heroPosition: 'UTG', heroHand: '9♣9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '99 é fold de UTG.' },
          { heroPosition: 'UTG', heroHand: '8♠3♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '83o não joga. Fold.' },
          { heroPosition: 'UTG', heroHand: 'A♥Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AQo abre de UTG. Raise.' },
          { heroPosition: 'UTG', heroHand: 'K♠Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQs abre de UTG. Raise.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'AJs fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠T♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATs fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s fica de fora de UTG.' },
        ],
      },
      // 11 — AULA
      { title: 'Recapitulando os fundamentos', concept: 'Recapitulando', description: 'Tudo o que você aprendeu até aqui.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      // 12 — PRÁTICA (teste final)
      {
        title: 'Teste final do Mundo 1', concept: 'Revisão Mundo 1', description: 'Misture tudo: posição, mãos fortes e disciplina.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA sempre raise.' },
          { heroPosition: 'UTG', heroHand: '7♥2♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '72o é fold sempre.' },
          { heroPosition: 'BTN', heroHand: 'K♣Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQ no BTN é raise.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo é fold de UTG.' },
          { heroPosition: 'CO', heroHand: 'K♥K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK é premium. Raise.' },
          { heroPosition: 'UTG', heroHand: 'K♠Q♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: '9♣9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '99 é fold de UTG.' },
          { heroPosition: 'BTN', heroHand: 'A♠J♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AJ no BTN é raise.' },
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '65s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: '7♠7♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 é fold de UTG.' },
          { heroPosition: 'CO', heroHand: 'A♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'ATs abre de CO.' },
          { heroPosition: 'MP', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo ainda é fold de MP.' },
          { heroPosition: 'BTN', heroHand: 'K♠T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KTo abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'Q♠J♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'QJs é fold de UTG.' },
        ],
      },
{ title: 'UTG: a primeira a falar', concept: 'UTG explicado', description: 'Por que abrir de UTG é o mais difícil.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'O range premium do UTG', concept: 'Range de UTG', description: 'TT+, AQ+ e poucas suited. Só isso.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
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
        ],
      },
      {
        title: 'UTG: o que fica de fora', concept: 'UTG fold', description: 'Mãos que parecem boas, mas viram fold.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'K♦J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KJs ainda é fold de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♥T♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATs fica de fora: UTG é AQs pra cima.' },
          { heroPosition: 'UTG', heroHand: 'Q♠J♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'QJs abre de MP em diante, não de UTG.' },
          { heroPosition: 'UTG', heroHand: '8♣8♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '88 é fold de UTG (só TT+).' },
          { heroPosition: 'UTG', heroHand: 'A♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5s não abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♣J♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'Nem AJs abre de UTG. Disciplina!' },
          { heroPosition: 'UTG', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'AJo fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠4♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A4s fica de fora de UTG.' },
        ],
      },
      {
        title: 'UTG: teste', concept: 'Revisão UTG', description: 'Misture aberturas e folds de UTG.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'UTG', heroHand: '7♥7♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 é fold de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'T♦9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T9s não abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo é premium. Raise.' },
          { heroPosition: 'UTG', heroHand: 'Q♥Q♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ abre sempre.' },
          { heroPosition: 'UTG', heroHand: 'K♣Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'J♦T♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'JTs é fold de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'T♠T♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'TT abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQo abre de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'AJs fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠T♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATs fica de fora de UTG.' },
          { heroPosition: 'UTG', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de UTG.' },
        ],
      },
{ title: 'MP: um passo à frente', concept: 'MP explicado', description: 'Com menos gente para agir, dá pra abrir mais.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'O que entra no MP', concept: 'Range de MP', description: 'AJs, QJs e 99 passam a abrir.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'MP: novas aberturas', concept: 'MP abre', description: 'Mãos que eram fold em UTG e agora abrem.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'MP', heroHand: 'A♣J♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJs já abre de MP.' },
          { heroPosition: 'MP', heroHand: 'Q♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'QJs entra no range de MP.' },
          { heroPosition: 'MP', heroHand: '9♣9♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '99 já abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQo abre de MP.' },
          { heroPosition: 'MP', heroHand: 'K♥Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'J♣J♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'JJ é premium. Raise.' },
          { heroPosition: 'MP', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'T♠T♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'TT abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'Q♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QQ abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo abre de MP.' },
          { heroPosition: 'MP', heroHand: 'K♠K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK abre de MP.' },
        ],
      },
      {
        title: 'MP: ainda não', concept: 'MP fold', description: 'Mãos que só vão abrir mais para a frente.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'MP', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo ainda é fold de MP.' },
          { heroPosition: 'MP', heroHand: 'K♠Q♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'KQo abre de CO; de MP, fold.' },
          { heroPosition: 'MP', heroHand: 'A♥T♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATs ainda não abre de MP (AJs+).' },
          { heroPosition: 'MP', heroHand: 'K♦J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJs fica de fora do MP.' },
          { heroPosition: 'MP', heroHand: '8♣8♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '88 é fold de MP (99+).' },
          { heroPosition: 'MP', heroHand: 'J♦T♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'JTs abre de CO, não de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠4♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A4s fica de fora de MP.' },
        ],
      },
      {
        title: 'MP: teste', concept: 'Revisão MP', description: 'Misture o range de MP.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'MP', heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KK abre sempre.' },
          { heroPosition: 'MP', heroHand: '7♥7♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 é fold de MP.' },
          { heroPosition: 'MP', heroHand: 'A♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo é premium. Raise.' },
          { heroPosition: 'MP', heroHand: 'Q♥T♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'QTs ainda não abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5s não abre de MP.' },
          { heroPosition: 'MP', heroHand: 'T♣T♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'TT abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de MP.' },
          { heroPosition: 'MP', heroHand: '9♠9♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '99 abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠T♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATs fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de MP.' },
          { heroPosition: 'MP', heroHand: 'A♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s fica de fora de MP.' },
        ],
      },
{ title: 'CO: quase no botão', concept: 'CO explicado', description: 'Boa posição = muito mais mãos para abrir.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: 'O range largo do CO', concept: 'Range de CO', description: 'ATs, KJs, JTs, AJo e KQo entram.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
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
        ],
      },
      {
        title: 'CO: o limite', concept: 'CO fold', description: 'Largo, mas ainda não é qualquer coisa.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'CO', heroHand: 'A♣9♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s ainda não: CO é ATs pra cima.' },
          { heroPosition: 'CO', heroHand: 'K♠T♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KTs fica de fora (KJs+).' },
          { heroPosition: 'CO', heroHand: 'A♥T♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'ATo ainda é fold de CO (AJo+).' },
          { heroPosition: 'CO', heroHand: 'T♦9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T9s abre de BTN, não de CO.' },
          { heroPosition: 'CO', heroHand: '5♣5♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '55 é fold de CO (77+).' },
          { heroPosition: 'CO', heroHand: 'K♣J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJo ainda não abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠8♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s fica de fora de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s fica de fora de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s fica de fora de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5s fica de fora de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠4♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A4s fica de fora de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠3♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A3s fica de fora de CO.' },
        ],
      },
      {
        title: 'CO: teste', concept: 'Revisão CO', description: 'Misture o range de CO.',
        minExercises: 6, passRate: 0.75, xpReward: 90,
        exercises: [
          { heroPosition: 'CO', heroHand: '7♥7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 já abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠Q♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQo abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♦8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A8s ainda não abre de CO.' },
          { heroPosition: 'CO', heroHand: 'Q♠J♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QJs abre de CO.' },
          { heroPosition: 'CO', heroHand: '6♥6♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '66 é fold de CO.' },
          { heroPosition: 'CO', heroHand: 'A♥K♣', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AK é premium. Raise.' },
          { heroPosition: 'CO', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de CO.' },
          { heroPosition: 'CO', heroHand: '8♠8♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '88 abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠9♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A9s fica de fora de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7s fica de fora de CO.' },
          { heroPosition: 'CO', heroHand: 'A♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6s fica de fora de CO.' },
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
          { heroPosition: 'BTN', heroHand: '5♦4♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '54s já é fraco demais: BTN vai até 65s.' },
          { heroPosition: 'BTN', heroHand: 'T♦9♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'T9s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '8♠7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '87s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '2♠2♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '22 abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠J♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '3♠3♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '33 abre de BTN.' },
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
          { heroPosition: 'BTN', heroHand: '7♦5♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '75s (com gap) não abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '4♥4♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: '44 abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '65s abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠7♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A7o fica de fora de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠6♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6o fica de fora de BTN.' },
          { heroPosition: 'BTN', heroHand: 'A♠5♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5o fica de fora de BTN.' },
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
        ],
      },
      {
        title: 'SB: o que fica de fora', concept: 'SB fold', description: 'Largo não é tudo: ainda há limites.',
        minExercises: 5, passRate: 0.7, xpReward: 70,
        exercises: [
          { heroPosition: 'SB', heroHand: 'Q♦8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q8s fica de fora (Q9s pra cima).' },
          { heroPosition: 'SB', heroHand: 'J♣8♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8s não abre (J9s+).' },
          { heroPosition: 'SB', heroHand: 'K♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K7s fica de fora (K8s+).' },
          { heroPosition: 'SB', heroHand: 'A♥6♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A6o não abre (A7o+).' },
          { heroPosition: 'SB', heroHand: 'K♦9♣', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'K9o fica de fora (KTo+).' },
          { heroPosition: 'SB', heroHand: 'T♦7♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'T7s não abre (T8s+).' },
          { heroPosition: 'SB', heroHand: 'A♠5♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5o fica de fora de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠4♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A4o fica de fora de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠3♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A3o fica de fora de SB.' },
          { heroPosition: 'SB', heroHand: 'K♠6♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K6s fica de fora de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠2♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A2o fica de fora de SB.' },
          { heroPosition: 'SB', heroHand: 'K♠5♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K5s fica de fora de SB.' },
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
          { heroPosition: 'SB', heroHand: '9♣5♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '95s não conecta o suficiente. Fold.' },
          { heroPosition: 'SB', heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKs abre de SB.' },
          { heroPosition: 'SB', heroHand: '5♠4♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '54s abre de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠Q♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AQs abre de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠6♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A6o fica de fora de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠5♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A5o fica de fora de SB.' },
          { heroPosition: 'SB', heroHand: 'A♠4♥', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'A4o fica de fora de SB.' },
        ],
      },
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
        ],
      },
      { title: 'Tudo junto agora', concept: 'Revisão geral', description: 'A posição muda tudo — vamos misturar.', minExercises: 0, passRate: 0, xpReward: 30, exercises: [] },
      {
        title: 'Mix de posições I', concept: 'Mix 1', description: 'Aberturas e folds em posições variadas.',
        minExercises: 5, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♦K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AKo abre de qualquer posição.' },
          { heroPosition: 'BTN', heroHand: '2♣2♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '22 abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo é fold de UTG.' },
          { heroPosition: 'CO', heroHand: 'A♥T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'ATs abre de CO.' },
          { heroPosition: 'MP', heroHand: '8♣8♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '88 é fold de MP.' },
          { heroPosition: 'SB', heroHand: 'Q♠J♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'QJo abre da SB.' },
        ],
      },
      {
        title: 'Mix de posições II', concept: 'Mix 2', description: 'Mais decisões dependentes da posição.',
        minExercises: 5, passRate: 0.75, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', heroHand: '7♠6♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '76s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: '9♣9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '99 é fold de UTG.' },
          { heroPosition: 'CO', heroHand: 'K♠Q♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'KQo abre de CO.' },
          { heroPosition: 'MP', heroHand: 'A♠J♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AJo ainda é fold de MP.' },
          { heroPosition: 'SB', heroHand: '5♦4♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: '54s abre da SB.' },
          { heroPosition: 'BTN', heroHand: 'J♠8♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'J8o fica de fora até do BTN.' },
        ],
      },
      {
        title: 'Desafio final', concept: 'Desafio final', description: 'O teste definitivo do pré-flop.',
        minExercises: 7, passRate: 0.8, xpReward: 120,
        exercises: [
          { heroPosition: 'UTG', heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'AA sempre raise.' },
          { heroPosition: 'SB', heroHand: 'K♠7♠', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'K7s fica de fora até da SB.' },
          { heroPosition: 'CO', heroHand: '7♥7♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '77 abre de CO.' },
          { heroPosition: 'MP', heroHand: 'K♣J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJo não abre de MP.' },
          { heroPosition: 'BTN', heroHand: 'A♦2♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'A2s abre no BTN.' },
          { heroPosition: 'UTG', heroHand: 'K♣J♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJs é fold de UTG (só KQs).' },
          { heroPosition: 'CO', heroHand: '5♣5♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '55 é fold de CO (77+).' },
          { heroPosition: 'BTN', heroHand: 'T♦9♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'OPEN_RAISE', explanation: 'T9s abre no BTN.' },
        ],
      }
    ],
  },
  {
    order: 2,
    name: 'Flop',
    description: 'Continuation bet e leitura de board. (em breve)',
    icon: '🌊',
    color: '#3FA7D6',
    stages: [
      { title: 'Flop — visão geral', concept: 'Flop — intro', description: 'O que você vai aprender aqui (em breve).', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
    ],
  },
  {
    order: 3,
    name: 'Turn',
    description: 'Jogo no turno: bet/check/fold. (em breve)',
    icon: '🌀',
    color: '#F0883E',
    stages: [
      { title: 'Turn — visão geral', concept: 'Turn — intro', description: 'O que você vai aprender aqui (em breve).', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
    ],
  },
  {
    order: 4,
    name: 'River',
    description: 'Jogo no river: value/blefe/call. (em breve)',
    icon: '🏁',
    color: '#27D17C',
    stages: [
      { title: 'River — visão geral', concept: 'River — intro', description: 'O que você vai aprender aqui (em breve).', minExercises: 0, passRate: 0, xpReward: 15, exercises: [] },
    ],
  },
];

const ACHIEVEMENTS = [
  { code: 'FIRST_HAND', name: 'Primeira Mão', description: 'Completar o primeiro exercício', icon: '🃏' },
  { code: 'PERFECT_WEEK', name: 'Semana Perfeita', description: '7 dias seguidos de sessão', icon: '🔥' },
  { code: 'SHARP_SHOOTER', name: 'Sharp Shooter', description: 'Acertar 50 exercícios seguidos sem erro', icon: '🎯' },
  { code: 'EXPLORER', name: 'Explorador', description: 'Desbloquear 5 Mundos diferentes', icon: '🌎' },
  { code: 'BTN_MASTER', name: 'Mestre do BTN', description: 'Completar Mundo 5 com 90%+ de acerto', icon: '♠' },
  { code: 'THREEBET_MACHINE', name: '3Bet Machine', description: 'Acertar 100 exercícios de 3-bet', icon: '⚡' },
  { code: 'FULL_GAME', name: 'Full Game', description: 'Completar todos os 15 Mundos', icon: '👑' },
];

const MISSIONS = [
  { code: 'DAILY_PLAY', title: 'Sente à mesa', description: 'Jogue ao menos 1 exercício hoje.', type: 'DAILY', xpReward: 10, target: 1 },
  { code: 'DAILY_5_CORRECT', title: '5 acertos hoje', description: 'Acerte 5 exercícios hoje.', type: 'DAILY', xpReward: 15, target: 5 },
  { code: 'DAILY_10_CORRECT', title: '10 acertos hoje', description: 'Acerte 10 exercícios hoje.', type: 'DAILY', xpReward: 25, target: 10 },
  { code: 'DAILY_20_CORRECT', title: '20 acertos hoje', description: 'Acerte 20 exercícios hoje.', type: 'DAILY', xpReward: 45, target: 20 },
  { code: 'DAILY_FINISH_STAGE', title: 'Conclua uma fase', description: 'Complete 1 fase hoje.', type: 'DAILY', xpReward: 30, target: 1 },
  { code: 'DAILY_2_STAGES', title: 'Duas fases hoje', description: 'Complete 2 fases hoje.', type: 'DAILY', xpReward: 60, target: 2 },
  { code: 'WEEKLY_3_DAYS', title: '3 dias na semana', description: 'Jogue em 3 dias diferentes esta semana.', type: 'WEEKLY', xpReward: 100, target: 3 },
  { code: 'WEEKLY_5_DAYS', title: '5 dias na semana', description: 'Jogue em 5 dias diferentes esta semana.', type: 'WEEKLY', xpReward: 200, target: 5 },
  { code: 'WEEKLY_50_CORRECT', title: '50 acertos na semana', description: 'Acerte 50 exercícios esta semana.', type: 'WEEKLY', xpReward: 120, target: 50 },
  { code: 'WEEKLY_5_STAGES', title: '5 fases na semana', description: 'Complete 5 fases esta semana.', type: 'WEEKLY', xpReward: 150, target: 5 },
];


// ─── Geração de ranges 13x13 (RFI por posição) ─────────────────
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const RI: Record<string, number> = Object.fromEntries(RANKS.map((r, i) => [r, i]));

/** Expande tokens tipo "TT+", "AQs+", "ATo+", "KQs", "76s" em rótulos de mão. */
function expand(token: string): string[] {
  const pair = /^([AKQJT2-9])\1(\+)?$/.exec(token);
  if (pair) {
    const out: string[] = [];
    for (let i = 0; i <= RI[pair[1]]; i++) out.push(RANKS[i] + RANKS[i]);
    return pair[2] ? out : [pair[1] + pair[1]];
  }
  const m = /^([AKQJT2-9])([AKQJT2-9])(s|o)(\+)?$/.exec(token);
  if (!m) return [];
  const hi = m[1], suit = m[3], plus = m[4];
  const loStart = RI[m[2]];
  const labels: string[] = [];
  if (plus) {
    for (let lo = loStart; lo > RI[hi]; lo--) labels.push(hi + RANKS[lo] + suit);
  } else {
    labels.push(hi + m[2] + suit);
  }
  return labels;
}

function raiseSet(tokens: string[]): Set<string> {
  const set = new Set<string>();
  for (const t of tokens) for (const h of expand(t)) set.add(h);
  return set;
}

function handLabel(row: number, col: number): string {
  if (row === col) return RANKS[row] + RANKS[col];
  if (row < col) return RANKS[row] + RANKS[col] + 's';
  return RANKS[col] + RANKS[row] + 'o';
}

function buildCells(tokens: string[]): { hand: string; action: string }[][] {
  const set = raiseSet(tokens);
  const grid: { hand: string; action: string }[][] = [];
  for (let r = 0; r < 13; r++) {
    const rowCells: { hand: string; action: string }[] = [];
    for (let c = 0; c < 13; c++) {
      const hand = handLabel(r, c);
      rowCells.push({ hand, action: set.has(hand) ? 'RAISE' : 'FOLD' });
    }
    grid.push(rowCells);
  }
  return grid;
}

const RANGE_DEFS: { position: string; label: string; tokens: string[] }[] = [
  { position: 'UTG', label: 'UTG · Open Raise', tokens: ['TT+', 'AQs+', 'KQs', 'AQo+'] },
  { position: 'MP', label: 'MP · Open Raise', tokens: ['99+', 'AJs+', 'KQs', 'QJs', 'AQo+'] },
  { position: 'CO', label: 'CO · Open Raise', tokens: ['77+', 'ATs+', 'KJs+', 'QJs', 'JTs', 'AJo+', 'KQo'] },
  { position: 'BTN', label: 'BTN · Open Raise', tokens: ['22+', 'A2s+', 'K9s+', 'Q9s+', 'J9s+', 'T9s', '98s', '87s', '76s', '65s', 'A8o+', 'KTo+', 'QJo'] },
  { position: 'SB', label: 'SB · Open Raise', tokens: ['22+', 'A2s+', 'K8s+', 'Q9s+', 'J9s+', 'T8s+', '98s', '87s', '76s', '65s', '54s', 'A7o+', 'KTo+', 'QJo'] },
];

/**
 * Frequências GTO (simplificadas). A dificuldade reflete a marginalidade da
 * mão: EASY = decisão pura (100%); MEDIUM e HARD = mãos de fronteira, com uma
 * frequência secundária real — é assim que os charts GTO mostram spots mistos.
 * Pré-flop RFI: a alternativa à ação certa é sempre o oposto (RAISE ↔ FOLD).
 */
const FREQ_MAIN: Record<'EASY' | 'MEDIUM' | 'HARD', number> = { EASY: 100, MEDIUM: 85, HARD: 65 };
function mixedFreq(correct: 'FOLD' | 'CALL' | 'RAISE', difficulty: 'EASY' | 'MEDIUM' | 'HARD'): string {
  const main = FREQ_MAIN[difficulty];
  const alt = correct === 'RAISE' ? 'FOLD' : 'RAISE';
  const f: { FOLD: number; CALL: number; RAISE: number } = { FOLD: 0, CALL: 0, RAISE: 0 };
  f[correct] = main;
  f[alt] = 100 - main;
  return JSON.stringify(f);
}

async function main() {
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
      const stage = await prisma.stage.upsert({
        where: { worldId_order: { worldId: world.id, order } },
        update: {
          title: s.title, concept: s.concept, description: s.description,
          minExercises: s.minExercises, maxExercises: s.exercises.length,
          passRate: s.passRate, xpReward: s.xpReward,
        },
        create: {
          worldId: world.id, order, title: s.title, concept: s.concept,
          description: s.description, minExercises: s.minExercises,
          maxExercises: s.exercises.length, passRate: s.passRate, xpReward: s.xpReward,
        },
      });
      stageCount++;

      for (const [ei, ex] of s.exercises.entries()) {
        const exOrder = ei + 1;
        const data = {
          order: exOrder,
          heroPosition: ex.heroPosition,
          villainPosition: ex.villainPosition ?? null,
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
          frequencies: mixedFreq(ex.correctAction, ex.difficulty),
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


  let rangeCount = 0;
  for (const rd of RANGE_DEFS) {
    const cells = JSON.stringify(buildCells(rd.tokens));
    await prisma.range.upsert({
      where: { gameType_tableSize_stackBb_position: { gameType: 'CASH', tableSize: 'SIX_MAX', stackBb: 100, position: rd.position } },
      update: { label: rd.label, cells },
      create: { gameType: 'CASH', tableSize: 'SIX_MAX', stackBb: 100, position: rd.position, label: rd.label, cells },
    });
    rangeCount++;
  }
  console.log(`✓ ${rangeCount} ranges (13x13)`);

  console.log(`✅ Seed concluído: ${WORLDS.length} mundos, ${stageCount} fases, ${exerciseCount} exercícios.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
