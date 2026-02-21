-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "Capture" DROP COLUMN "tags",
ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "embedding" vector(1536);

-- Create HNSW index for fast cosine similarity search
CREATE INDEX "capture_embedding_idx" ON "Capture" USING hnsw (embedding vector_cosine_ops);
