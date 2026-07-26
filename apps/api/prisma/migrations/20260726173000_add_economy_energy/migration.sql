-- Economia de progressão: uma alteração simples em users + tabelas novas.
-- Evita RedefineTables para preservar friendCode e todos os dados existentes.
ALTER TABLE "users" ADD COLUMN "coins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "energyUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "energyUsageDate" DATETIME;
ALTER TABLE "users" ADD COLUMN "devSimulation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user_progress" ADD COLUMN "attemptStartedAt" DATETIME;

CREATE TABLE "user_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemCode" TEXT NOT NULL,
  "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "user_items_userId_itemCode_key" ON "user_items"("userId", "itemCode");
CREATE INDEX "user_items_userId_idx" ON "user_items"("userId");

CREATE TABLE "user_perfect_stage_rewards" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "coins" INTEGER NOT NULL,
  "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_perfect_stage_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_perfect_stage_rewards_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "stages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "user_perfect_stage_rewards_userId_stageId_key" ON "user_perfect_stage_rewards"("userId", "stageId");
CREATE INDEX "user_perfect_stage_rewards_userId_idx" ON "user_perfect_stage_rewards"("userId");
