-- AlterTable: add sourceApp field to Capture
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "sourceApp" TEXT;
