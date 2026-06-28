-- AlterTable
ALTER TABLE "exercises" ADD COLUMN "frequencies" TEXT;

-- CreateTable
CREATE TABLE "ranges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameType" TEXT NOT NULL,
    "tableSize" TEXT NOT NULL,
    "stackBb" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "cells" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ranges_gameType_tableSize_stackBb_position_key" ON "ranges"("gameType", "tableSize", "stackBb", "position");
