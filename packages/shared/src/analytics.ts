/**
 * Métricas agregadas da saúde do produto.
 *
 * Não há eventos de navegação nem identificação de pessoas: a API calcula
 * estes números a partir dos dados operacionais que o PokerPath já precisa
 * guardar para funcionar.
 */
export interface AnalyticsFunnelStep {
  count: number;
  /** Percentual em relação ao total de cadastros, de 0 a 100. */
  percentage: number;
}

export interface ProductAnalytics {
  generatedAt: string;
  windowDays: 7;
  excludesDeveloperAccounts: true;
  funnel: {
    registered: AnalyticsFunnelStep;
    onboarded: AnalyticsFunnelStep;
    firstStage: AnalyticsFunnelStep;
    fiveStages: AnalyticsFunnelStep;
    newUsers7d: number;
  };
  activity: {
    active24h: number;
    active7d: number;
    answers7d: number;
    correctAnswers7d: number;
    accuracy7d: number;
  };
  learning: {
    stagesCompleted7d: number;
    perfectStages7d: number;
  };
  social: {
    acceptedFriendships: number;
    pendingRequests: number;
    rejectedRequests: number;
  };
}
