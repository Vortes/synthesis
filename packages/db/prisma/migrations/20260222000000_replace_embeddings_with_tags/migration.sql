-- AlterTable: remove descriptionUrl and embedding, add description and tags
ALTER TABLE "Capture" DROP COLUMN IF EXISTS "descriptionUrl";
ALTER TABLE "Capture" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- GIN index for fast array queries
CREATE INDEX "Capture_tags_idx" ON "Capture" USING GIN ("tags");
