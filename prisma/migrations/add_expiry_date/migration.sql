-- Add expiryDate field to Job table
ALTER TABLE "Job" ADD COLUMN "expiryDate" TIMESTAMP(3);

-- Create index for efficient expired job queries
CREATE INDEX "Job_expiryDate_idx" ON "Job"("expiryDate");

-- Create index for active jobs with expiry date
CREATE INDEX "Job_isActive_expiryDate_idx" ON "Job"("isActive", "expiryDate");
