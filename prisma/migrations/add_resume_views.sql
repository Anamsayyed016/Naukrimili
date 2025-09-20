-- Add resume views tracking table
CREATE TABLE IF NOT EXISTS "ResumeView" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerType" TEXT NOT NULL, -- 'employer', 'admin', 'other'
    "companyId" TEXT, -- For employer views
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeView_pkey" PRIMARY KEY ("id")
);

-- Add indexes for performance
CREATE INDEX "ResumeView_resumeId_idx" ON "ResumeView"("resumeId");
CREATE INDEX "ResumeView_viewerId_idx" ON "ResumeView"("viewerId");
CREATE INDEX "ResumeView_viewedAt_idx" ON "ResumeView"("viewedAt");
CREATE INDEX "ResumeView_companyId_idx" ON "ResumeView"("companyId");

-- Add foreign key constraints
ALTER TABLE "ResumeView" ADD CONSTRAINT "ResumeView_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeView" ADD CONSTRAINT "ResumeView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeView" ADD CONSTRAINT "ResumeView_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraint to prevent duplicate views from same viewer within short time
CREATE UNIQUE INDEX "ResumeView_unique_view" ON "ResumeView"("resumeId", "viewerId", "viewedAt") WHERE "viewedAt" > (CURRENT_TIMESTAMP - INTERVAL '1 hour');
