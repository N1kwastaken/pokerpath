-- Baús cosméticos: uma recompensa por mundo concluído, sem saldo/moeda.
-- Tabela nova de propósito; não recriar `users` evita o risco de RedefineTables.
CREATE TABLE "user_world_rewards" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "worldId" TEXT NOT NULL,
  "rewardCode" TEXT NOT NULL,
  "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "equippedAt" DATETIME,
  CONSTRAINT "user_world_rewards_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_world_rewards_worldId_fkey"
    FOREIGN KEY ("worldId") REFERENCES "worlds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "user_world_rewards_userId_worldId_key"
  ON "user_world_rewards"("userId", "worldId");
CREATE INDEX "user_world_rewards_userId_idx"
  ON "user_world_rewards"("userId");
