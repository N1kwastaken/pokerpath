-- Existing rows are real friendships and must remain accepted.
-- SQLite can add these columns in place; do not rebuild the table because a
-- RedefineTables migration has previously erased friendCode data.
ALTER TABLE "friendships" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACCEPTED';
ALTER TABLE "friendships" ADD COLUMN "requestedById" TEXT;
ALTER TABLE "friendships" ADD COLUMN "respondedAt" DATETIME;

CREATE INDEX "friendships_status_idx" ON "friendships"("status");
CREATE INDEX "friendships_requestedById_idx" ON "friendships"("requestedById");
