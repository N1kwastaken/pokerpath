-- Lembrete diário de streak por e-mail.
--
-- NOTA: o Prisma gerou originalmente um "RedefineTables" para users (padrão do
-- SQLite ao alterar a tabela) cujo INSERT OMITIA a coluna friendCode — ou seja,
-- apagava o código de amigo de todo mundo. Um ADD COLUMN simples resolve e
-- preserva os dados. (Em produção o deploy usa `db push` no Postgres, que já
-- faria um ALTER simples — o problema era só do caminho SQLite.)
ALTER TABLE "streaks" ADD COLUMN "remindedAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "emailReminders" BOOLEAN NOT NULL DEFAULT true;
