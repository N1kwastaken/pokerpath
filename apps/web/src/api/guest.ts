import type { GuestWorld, GuestStagePlay } from '@pokerpath/shared';
import { apiRequest } from '../lib/api.js';

/** API do modo convidado: Mundo 0 sem conta (rotas públicas). */
export const guestApi = {
  world0: () => apiRequest<{ world: GuestWorld }>('/guest/world0', { auth: false }).then((r) => r.world),
  stage: (stageId: string) => apiRequest<GuestStagePlay>(`/guest/stages/${stageId}`, { auth: false }),
  /** Pós-cadastro: transforma o progresso local de convidado em progresso real. */
  graduate: (stageIds: string[]) =>
    apiRequest<{ ok: true; completed: number }>('/guest/graduate', { method: 'POST', body: { stageIds } }),
};
