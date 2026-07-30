import type { RangeMethodology } from '@pokerpath/shared';

interface RangeContext {
  gameType: string;
  tableSize: string;
  stackBb: number;
  scenario: string;
}

/**
 * Metadado explícito dos charts atuais.
 *
 * Eles são coerentes com os exercícios por construção, mas não vieram de um
 * export de solver auditável. Quando um arquivo real for importado, ele deverá
 * ganhar outra versão e a classificação SOLVER_VERIFIED.
 */
export function methodologyForRange(context: RangeContext): RangeMethodology {
  const defense = context.scenario !== 'RFI';
  return {
    version: 'reference-2026.07-v1',
    classification: 'REFERENCE',
    solverVerified: false,
    title: 'Chart pedagógico de referência',
    assumptions: [
      context.gameType === 'CASH' ? 'Cash game' : context.gameType,
      context.tableSize === 'SIX_MAX' ? 'Mesa 6-max' : context.tableSize,
      `${context.stackBb} BB efetivos`,
      defense ? 'Resposta contra open de 2,5 BB' : 'Abertura raise ou fold',
    ],
    note: defense
      ? 'Defesa pré-flop simplificada e construída manualmente para estudo. Não é uma solução certificada por solver.'
      : 'Range de abertura simplificado para estudo. Não é uma solução certificada por solver.',
  };
}
