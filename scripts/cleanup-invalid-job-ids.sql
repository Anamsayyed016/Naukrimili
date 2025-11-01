-- Cleanup Script for Invalid Job IDs
-- Removes jobs with decimal IDs from Math.random()

-- ============================================================
-- STEP 1: IDENTIFY INVALID JOBS
-- ============================================================

-- Find jobs with decimal sourceIds (from Math.random())
SELECT 
  id,
  source,
  "sourceId",
  title,
  company,
  location,
  "createdAt"
FROM "Job"
WHERE "sourceId" ~ '\d+\.\d+'  -- Regex: contains decimal pattern
ORDER BY "createdAt" DESC
LIMIT 100;

-- Count invalid jobs
SELECT COUNT(*) as invalid_job_count
FROM "Job"
WHERE "sourceId" ~ '\d+\.\d+';

-- ============================================================
-- STEP 2: BACKUP INVALID JOBS (OPTIONAL)
-- ============================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS "Job_Backup_Invalid_IDs" AS
SELECT * FROM "Job"
WHERE "sourceId" ~ '\d+\.\d+';

-- Verify backup
SELECT COUNT(*) as backed_up_count 
FROM "Job_Backup_Invalid_IDs";

-- ============================================================
-- STEP 3: DELETE INVALID JOBS (CAREFUL!)
-- ============================================================

-- OPTION A: Delete only if no applications
DELETE FROM "Job"
WHERE "sourceId" ~ '\d+\.\d+'
AND "applicationsCount" = 0
AND id NOT IN (
  SELECT "jobId" FROM "Application"
);

-- OPTION B: Delete all invalid jobs (use with caution!)
-- DELETE FROM "Job"
-- WHERE "sourceId" ~ '\d+\.\d+';

-- ============================================================
-- STEP 4: VERIFY CLEANUP
-- ============================================================

-- Check remaining invalid jobs
SELECT COUNT(*) as remaining_invalid_jobs
FROM "Job"
WHERE "sourceId" ~ '\d+\.\d+';

-- Verify total job count
SELECT 
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN "sourceId" ~ '\d+\.\d+' THEN 1 END) as invalid_jobs,
  COUNT(CASE WHEN "sourceId" !~ '\d+\.\d+' THEN 1 END) as valid_jobs
FROM "Job";

-- ============================================================
-- STEP 5: RE-INDEX FOR PERFORMANCE (OPTIONAL)
-- ============================================================

-- Rebuild indexes
REINDEX TABLE "Job";

-- Analyze table for query optimization
ANALYZE "Job";

-- ============================================================
-- STEP 6: VERIFICATION QUERIES
-- ============================================================

-- Verify all jobs have valid sourceIds
SELECT 
  source,
  COUNT(*) as job_count,
  MIN("createdAt") as oldest_job,
  MAX("createdAt") as newest_job
FROM "Job"
WHERE "sourceId" IS NOT NULL
AND "sourceId" !~ '\d+\.\d+'  -- Only valid IDs
GROUP BY source
ORDER BY job_count DESC;

-- Sample valid jobs by source
SELECT 
  id,
  source,
  "sourceId",
  title,
  company,
  location,
  "createdAt"
FROM "Job"
WHERE "sourceId" !~ '\d+\.\d+'
ORDER BY "createdAt" DESC
LIMIT 50;

-- ============================================================
-- NOTES
-- ============================================================

/*
IMPORTANT:
1. Run STEP 1 first to see how many jobs will be affected
2. Consider STEP 2 (backup) before deleting
3. Choose OPTION A in STEP 3 to preserve jobs with applications
4. Run STEP 4 to verify cleanup was successful
5. After cleanup, re-import jobs from external APIs

ROLLBACK:
If you need to restore deleted jobs:
  INSERT INTO "Job" SELECT * FROM "Job_Backup_Invalid_IDs";

SAFE APPROACH:
Instead of deleting, mark as inactive:
  UPDATE "Job" 
  SET "isActive" = false 
  WHERE "sourceId" ~ '\d+\.\d+';
*/

