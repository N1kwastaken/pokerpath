-- Dificuldade da missão. ADD COLUMN simples de propósito: deixar o Prisma
-- gerar um RedefineTables aqui já custou dados neste projeto.
ALTER TABLE "missions" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'EASY';
