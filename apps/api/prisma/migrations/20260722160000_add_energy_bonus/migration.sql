-- Bônus de energia por fase perfeita. Dois ADD COLUMN simples de propósito:
-- deixar o Prisma gerar um RedefineTables sobre a tabela `users` já custou
-- dados neste projeto (os friendCode foram zerados uma vez).
ALTER TABLE "users" ADD COLUMN "energyBonus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "energyBonusDate" DATETIME;
