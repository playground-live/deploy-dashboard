-- AlterTable: Add repositoryId column (nullable first for backfill)
ALTER TABLE "Service" ADD COLUMN "repositoryId" TEXT;

-- Backfill: existing rows get repositoryId = name (best-effort fallback)
UPDATE "Service" SET "repositoryId" = "name" WHERE "repositoryId" IS NULL;

-- Make repositoryId NOT NULL and UNIQUE
ALTER TABLE "Service" ALTER COLUMN "repositoryId" SET NOT NULL;

-- Drop old unique constraint on name
DROP INDEX IF EXISTS "Service_name_key";

-- Create unique index on repositoryId
CREATE UNIQUE INDEX "Service_repositoryId_key" ON "Service"("repositoryId");

-- Rename repository to repositoryName
ALTER TABLE "Service" RENAME COLUMN "repository" TO "repositoryName";
