-- Add job views tracking table
CREATE TABLE IF NOT EXISTS "JobView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobView_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX "JobView_userId_idx" ON "JobView"("userId");
CREATE INDEX "JobView_jobId_idx" ON "JobView"("jobId");
CREATE INDEX "JobView_viewedAt_idx" ON "JobView"("viewedAt");
CREATE INDEX "JobView_userId_viewedAt_idx" ON "JobView"("userId", "viewedAt");

-- Add foreign key constraints
ALTER TABLE "JobView" ADD CONSTRAINT "JobView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobView" ADD CONSTRAINT "JobView_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: Duplicate prevention within 1 hour is handled in application logic (job-view-tracker.ts)
-- We don't use a unique index with CURRENT_TIMESTAMP as it's not IMMUTABLE in PostgreSQL

