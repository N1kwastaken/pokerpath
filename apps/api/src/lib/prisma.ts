import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

/**
 * Instância única do Prisma Client.
 * Em dev, evita recriar conexões a cada hot-reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
