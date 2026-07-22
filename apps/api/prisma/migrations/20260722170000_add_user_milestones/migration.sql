-- Marcos resgatados. CREATE TABLE novo: não toca em nenhuma tabela existente.
CREATE TABLE "user_milestones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_milestones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "user_milestones_userId_code_key" ON "user_milestones"("userId", "code");
CREATE INDEX "user_milestones_userId_idx" ON "user_milestones"("userId");
