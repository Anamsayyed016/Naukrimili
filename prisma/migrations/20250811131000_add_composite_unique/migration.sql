-- Add composite unique index on (source, sourceId); drop prior single-column unique if exists
DROP INDEX IF EXISTS "Job_sourceId_key";
CREATE UNIQUE INDEX "Job_source_sourceId_key" ON "Job"("source", "sourceId");
