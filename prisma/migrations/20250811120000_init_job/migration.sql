-- Initial Job table migration
CREATE TABLE "Job" (
    "id" SERIAL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "country" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "applyUrl" TEXT,
    "postedAt" TIMESTAMP(3),
    "salary" TEXT,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "Job_sourceId_key" ON "Job"("sourceId");

-- updatedAt trigger to mimic Prisma @updatedAt behavior
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON "Job"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
