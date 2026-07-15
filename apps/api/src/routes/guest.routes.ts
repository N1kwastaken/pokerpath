import type { FastifyInstance } from 'fastify';
import { getGuestWorld0, getGuestStage, getRange } from '../services/game.service.js';

/**
 * Rotas PÚBLICAS do modo convidado: o Mundo 0 (fundamentos) é jogável sem
 * conta. Só leitura; o gabarito vai junto porque a validação é local no
 * cliente (sem XP/energia/progressão de servidor).
 */
export async function guestRoutes(app: FastifyInstance) {
  app.get('/guest/world0', async () => {
    return { world: await getGuestWorld0() };
  });

  app.get<{ Params: { stageId: string } }>('/guest/stages/:stageId', async (request) => {
    return getGuestStage(request.params.stageId);
  });

  // Ranges/charts são conteúdo estático — públicos para a aula do gráfico
  // (e o cheat-sheet) funcionarem também sem login.
  app.get<{ Querystring: { gameType?: string; tableSize?: string; stack?: string; position?: string; scenario?: string } }>(
    '/ranges',
    async (request) => {
      const q = request.query;
      const range = await getRange({
        gameType: q.gameType ?? 'CASH',
        tableSize: q.tableSize ?? 'SIX_MAX',
        stackBb: Number(q.stack ?? 100),
        position: q.position ?? 'BTN',
        scenario: q.scenario ?? 'RFI',
      });
      return { range };
    },
  );
}
