-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ranges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameType" TEXT NOT NULL,
    "tableSize" TEXT NOT NULL,
    "stackBb" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "scenario" TEXT NOT NULL DEFAULT 'RFI',
    "label" TEXT NOT NULL,
    "cells" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ranges" ("cells", "createdAt", "gameType", "id", "label", "position", "stackBb", "tableSize") SELECT "cells", "createdAt", "gameType", "id", "label", "position", "stackBb", "tableSize" FROM "ranges";
DROP TABLE "ranges";
ALTER TABLE "new_ranges" RENAME TO "ranges";
CREATE UNIQUE INDEX "ranges_gameType_tableSize_stackBb_position_scenario_key" ON "ranges"("gameType", "tableSize", "stackBb", "position", "scenario");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
