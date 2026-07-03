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
        minExercises: 5, passRate: 0.6, xpReward: 50,
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
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♠8♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'K8o nao defende. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♦2♠', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: 'Q2o e lixo. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♣4♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'DEFEND', explanation: 'J4o nao conecta. Fold.' },
          { heroPosition: 'BB', villainPosition: 'BTN', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♠6♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'DEFEND', explanation: '96o e fraca. Fold.' },
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
        minExercises: 5, passRate: 0.7, xpReward: 60,
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
        ],
      },
      { title: '3-Bet: blockers', concept: '3bet blockers', description: 'Por que ases suited baixos servem de blefe.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
      {
        title: '3-Bet como blefe', concept: '3bet blefe', description: 'Ases suited baixos: bons blockers para blefar.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
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
        minExercises: 5, passRate: 0.7, xpReward: 60,
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
        ],
      },
      {
        title: '3-Bet: teste', concept: 'Revisão 3bet', description: 'Misture valor, blefe, call e fold contra um open.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
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
      { title: '4-Bet: o relanço do relanço', concept: '4bet explicado', description: 'Quando o 3-bet do vilao vira 4-bet seu.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      { title: '4-Bet: valor, call e blefe', concept: '4bet value blefe', description: 'Premium 4-beta; QQ/AK paga; blockers blefam.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: '4-Bet por valor', concept: '4bet valor', description: 'So os monstros 4-betam por valor.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♠A♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AA: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♣K♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'KK: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AKs: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♥A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'AA: sempre 4-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♥K♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'KK: 4-bet por valor.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♣K♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'AKs: 4-bet forte.' },
        ],
      },
      {
        title: '4-Bet: pagar o 3-bet', concept: '4bet call', description: 'QQ, JJ e AKo preferem pagar.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'Q♠Q♦', correctAction: 'CALL', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'QQ: paga o 3-bet (4-bet fica muito exposto).' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'J♣J♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'JJ: paga o 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♦K♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'AKo: paga o 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'Q♥Q♣', correctAction: 'CALL', difficulty: 'EASY', category: 'FOUR_BET', explanation: 'QQ: call.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'J♦J♠', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'JJ: call.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♣K♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'AKo: call.' },
        ],
      },
      {
        title: '4-Bet: blefe e fold', concept: '4bet blefe', description: 'Blockers blefam; o resto foldam.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'A5s: 4-bet blefe (blocker de ases).' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♥4♥', correctAction: 'RAISE', difficulty: 'HARD', category: 'FOUR_BET', explanation: 'A4s: 4-bet blefe.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'A♣3♣', correctAction: 'RAISE', difficulty: 'HARD', category: 'FOUR_BET', explanation: 'A3s: 4-bet blefe com blocker.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: '7♦2♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'FOUR_BET', explanation: '72o: fold ao 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: 'K♠J♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FOUR_BET', explanation: 'KJo: fold ao 3-bet.' },
          { heroPosition: 'CO', villainPosition: 'BTN', villainAction: '3-Bet 9bb', potSize: 13, heroHand: '9♥9♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'FOUR_BET', explanation: '99: fold ao 3-bet (fraco pra 4-bet/call).' },
        ],
      },
      {
        title: '4-Bet: teste', concept: 'Revisão 4bet', description: 'Misture valor, call, blefe e fold.',
        minExercises: 6, passRate: 0.75, xpReward: 80,
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
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠A♦', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'AA: 3-bet mesmo vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣K♥', correctAction: 'RAISE', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'KK: 3-bet por valor.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'Q♦Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'QQ: 3-bet vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♠K♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AKs: 3-bet vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♥K♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'AKo: 3-bet fino vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'J♠J♦', correctAction: 'RAISE', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'JJ: 3-bet vs UTG (ou call).' },
        ],
      },
      {
        title: 'vs UTG: pagar', concept: 'vsUTG call', description: 'Pares e suited fortes pagam em posicao.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♦Q♦', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'AQs: paga vs UTG (fraco pra 3-bet valor).' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♥Q♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'KQs: paga vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'T♣T♦', correctAction: 'CALL', difficulty: 'EASY', category: 'FACING_RAISE', explanation: 'TT: paga pra ver flop.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '9♠9♥', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '99: paga vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'A♣J♣', correctAction: 'CALL', difficulty: 'HARD', category: 'FACING_RAISE', explanation: 'AJs: paga vs UTG.' },
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '8♦8♣', correctAction: 'CALL', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: '88: paga barato pra buscar trinca.' },
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
          { heroPosition: 'BTN', villainPosition: 'UTG', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '7♣7♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'FACING_RAISE', explanation: '77: fold vs UTG (sem preco).' },
        ],
      },
      { title: 'Defesa vs MP e CO: abra o leque', concept: 'vsMP-CO intro', description: 'Open mais largo pede defesa mais larga.', minExercises: 0, passRate: 0, xpReward: 25, exercises: [] },
      {
        title: 'vs MP: um passo além', concept: 'vsMP defesa', description: 'Defenda um pouco mais que contra UTG.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
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
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: 'K♣J♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'FACING_RAISE', explanation: 'KJo: ainda é fold vs MP.' },
          { heroPosition: 'BTN', villainPosition: 'MP', villainAction: 'Raise 2.5x', potSize: 4, heroHand: '6♠6♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'FACING_RAISE', explanation: '66: par pequeno sem preço vs MP.' },
        ],
      },
      {
        title: 'vs CO: solte a mão', concept: 'vsCO defesa', description: 'CO abre largo: 3-bete e pague mais.',
        minExercises: 5, passRate: 0.7, xpReward: 60,
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
        minExercises: 6, passRate: 0.75, xpReward: 80,
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
          { heroPosition: 'UTG', heroHand: 'A♠Q♣', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'AQo abre de UTG.' },
          { heroPosition: 'MP', heroHand: 'Q♦J♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'QJs abre de MP.' },
          { heroPosition: 'CO', heroHand: 'J♠T♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'JTs abre de CO.' },
          { heroPosition: 'UTG', heroHand: 'K♥J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'KJo e fold de UTG.' },
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
          { heroPosition: 'BTN', heroHand: '6♠5♠', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '65s abre do botao.' },
          { heroPosition: 'CO', heroHand: 'A♥T♥', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: 'ATs abre de CO.' },
          { heroPosition: 'MP', heroHand: 'Q♣9♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'OPEN_RAISE', explanation: 'Q9s nao abre de MP.' },
          { heroPosition: 'SB', heroHand: '5♦4♦', correctAction: 'RAISE', difficulty: 'MEDIUM', category: 'OPEN_RAISE', explanation: '54s abre da SB.' },
        ],
      },
      { title: 'Flop: ler o board', concept: 'Flop board', description: 'Boards secos x molhados e o que isso muda.', minExercises: 0, passRate: 0, xpReward: 20, exercises: [] },
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
    description: 'Enfrentando apostas no flop: valor, projetos e fold.',
    icon: '🌊',
    color: '#3FA7D6',
    stages: [
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
        ],
      },
      {
        title: 'Flop: teste', concept: 'Flop teste', description: 'Misture valor, projeto e fold.',
        minExercises: 6, passRate: 0.75, xpReward: 90,
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
    ],
  },
  {
    order: 3,
    name: 'Turn',
    description: 'Enfrentando a segunda barrelada no turn.',
    icon: '🌀',
    color: '#F0883E',
    stages: [
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
        ],
      },
      {
        title: 'Turn: quando desistir', concept: 'Turn blefe', description: 'Projeto morto e par fraco: fold.',
        minExercises: 5, passRate: 0.7, xpReward: 75,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♠Q♦7♣3♥', heroHand: '5♥4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'TURN', explanation: 'Ar no turn: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♠T♦6♣9♥', heroHand: '8♦7♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Projeto que nao veio: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♣J♦3♠5♦', heroHand: '6♥5♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Par de baixo fraco: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♦8♣4♠2♥', heroHand: 'A♥5♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'TURN', explanation: 'Ace-high: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'J♠9♥2♦Q♣', heroHand: '4♣4♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Underpair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♣K♠7♦T♥', heroHand: '6♦6♣', correctAction: 'FOLD', difficulty: 'HARD', category: 'TURN', explanation: 'Par pequeno: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'A♦Q♣8♠3♦', heroHand: '6♥4♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'TURN', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'K♣T♥5♦2♠', heroHand: '7♠6♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Sem projeto real: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'J♦8♣3♥T♠', heroHand: '5♣5♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Underpair: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 12, board: 'Q♠9♦6♣4♥', heroHand: 'A♣3♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'TURN', explanation: 'Ace-high: fold.' },
        ],
      },
      {
        title: 'Turn: teste', concept: 'Turn teste', description: 'Misture valor, projeto e fold.',
        minExercises: 6, passRate: 0.75, xpReward: 95,
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
    ],
  },
  {
    order: 4,
    name: 'River',
    description: 'Valor, bluff-catch e fold no river.',
    icon: '🏁',
    color: '#27D17C',
    stages: [
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
        ],
      },
      {
        title: 'River: quando desistir', concept: 'River blefe', description: 'Projeto que errou: fold.',
        minExercises: 5, passRate: 0.7, xpReward: 80,
        exercises: [
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♠Q♦7♣2♥9♦', heroHand: 'J♥T♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Sequencia nao veio: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠K♦8♣4♥2♠', heroHand: 'Q♥J♦', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: '9♥8♦2♣5♠K♣', heroHand: 'J♠T♥', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto de sequencia falhou: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♦7♣3♦Q♠6♣', heroHand: 'K♦J♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'RIVER', explanation: 'Nut flush draw que errou: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'T♣9♦2♠4♥K♣', heroHand: '8♦7♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto morto: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'Q♦J♠6♣3♥8♦', heroHand: 'A♥K♦', correctAction: 'FOLD', difficulty: 'HARD', category: 'RIVER', explanation: 'Ace-king high nao paga: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♣Q♦8♥5♠2♣', heroHand: 'K♦J♥', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Ar: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♦J♣7♠4♦2♥', heroHand: 'T♠9♠', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Projeto morto: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'K♣9♠4♦2♥7♠', heroHand: 'Q♦J♣', correctAction: 'FOLD', difficulty: 'EASY', category: 'RIVER', explanation: 'Dama-alta: fold.' },
          { heroPosition: 'BTN', villainPosition: 'CO', villainAction: 'Aposta', potSize: 24, board: 'A♠T♦6♣3♥K♦', heroHand: '8♣7♦', correctAction: 'FOLD', difficulty: 'MEDIUM', category: 'RIVER', explanation: 'Ar: fold.' },
        ],
      },
      {
        title: 'River: teste', concept: 'River teste', description: 'Misture valor, catch e fold.',
        minExercises: 6, passRate: 0.75, xpReward: 100,
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
    ],
  },
];

const ACHIEVEMENTS = [
  { code: 'FIRST_HAND', name: 'Primeira Mão', description: 'Completar o primeiro exercício', icon: '🃏' },
  { code: 'HOT_STREAK', name: 'Em Chamas', description: 'Acertar 5 exercícios seguidos', icon: '🚀' },
  { code: 'PERFECT_WEEK', name: 'Semana Perfeita', description: '7 dias seguidos de sessão', icon: '🔥' },
  { code: 'SHARP_SHOOTER', name: 'Sharp Shooter', description: 'Acertar 50 exercícios seguidos sem erro', icon: '🎯' },
  { code: 'EXPLORER', name: 'Explorador', description: 'Chegar a todos os Mundos', icon: '🌎' },
  { code: 'BTN_MASTER', name: 'Mestre do Preflop', description: 'Completar o Mundo Preflop com 90%+ de acerto', icon: '♠' },
  { code: 'THREEBET_MACHINE', name: '3Bet Machine', description: 'Acertar 100 exercícios de 3-bet', icon: '⚡' },
  { code: 'FULL_GAME', name: 'Full Game', description: 'Completar todos os Mundos', icon: '👑' },
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
