-- @username + data da última troca. Dois ADD COLUMN simples de propósito:
-- deixar o Prisma gerar um RedefineTables sobre `users` já custou dados aqui
-- (os friendCode foram zerados uma vez).
ALTER TABLE "users" ADD COLUMN "username" TEXT;
ALTER TABLE "users" ADD COLUMN "usernameChangedAt" DATETIME;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
