import type { FastifyInstance } from 'fastify';
import { onboardingSchema } from '@pokerpath/shared';
import { prisma } from '../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { toPublicUser } from '../services/user.serializer.js';

/**
 * Rotas do usuário autenticado.
 *   POST /onboarding — salva as 3 respostas e marca o onboarding concluído (PRD 4.1)
 */
export async function userRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.post('/onboarding', async (request, reply) => {
    const parsed = onboardingSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new BadRequestError(
        parsed.error.errors[0]?.message ?? 'Dados inválidos',
        'VALIDATION_ERROR',
      );
    }

    const user = await prisma.user.update({
      where: { id: request.user.sub },
      data: {
        experienceLevel: parsed.data.experienceLevel,
        playFrequency: parsed.data.playFrequency,
        goal: parsed.data.goal,
        onboardingCompleted: true,
      },
      include: { streak: true },
    });
    if (!user) throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');

    return reply.send({ user: toPublicUser(user, user.streak) });
  });
}
