-- Vitrine de badges do perfil (JSON com até 2 ids). ADD COLUMN simples:
-- RedefineTables na tabela users já custou dados neste projeto.
ALTER TABLE "users" ADD COLUMN "showcaseBadges" TEXT;
