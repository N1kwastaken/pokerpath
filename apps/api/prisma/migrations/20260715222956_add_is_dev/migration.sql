-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "isDev" BOOLEAN NOT NULL DEFAULT true,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "experienceLevel" TEXT,
    "playFrequency" TEXT,
    "goal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "experienceLevel", "goal", "id", "name", "onboardingCompleted", "passwordHash", "plan", "playFrequency", "totalXp", "updatedAt") SELECT "createdAt", "email", "experienceLevel", "goal", "id", "name", "onboardingCompleted", "passwordHash", "plan", "playFrequency", "totalXp", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
