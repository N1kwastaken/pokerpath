-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minExercises" INTEGER NOT NULL DEFAULT 5,
    "maxExercises" INTEGER NOT NULL DEFAULT 20,
    "passRate" REAL NOT NULL DEFAULT 0.7,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stages_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_stages" ("concept", "createdAt", "description", "id", "maxExercises", "minExercises", "order", "passRate", "title", "worldId", "xpReward") SELECT "concept", "createdAt", "description", "id", "maxExercises", "minExercises", "order", "passRate", "title", "worldId", "xpReward" FROM "stages";
DROP TABLE "stages";
ALTER TABLE "new_stages" RENAME TO "stages";
CREATE UNIQUE INDEX "stages_worldId_order_key" ON "stages"("worldId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
