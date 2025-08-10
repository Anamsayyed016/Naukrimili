-- Add index on createdAt for faster chronological queries
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt" DESC);
