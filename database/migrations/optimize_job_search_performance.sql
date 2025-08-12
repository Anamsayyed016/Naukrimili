-- OPTIMIZED JOB SEARCH DATABASE PERFORMANCE MIGRATION
-- 
-- This migration adds optimized indexes and constraints to improve
-- job search performance, especially for common search patterns.

-- ============================================================================
-- SECTION 1: FULL-TEXT SEARCH OPTIMIZATION
-- ============================================================================

-- Add full-text search support for job titles and descriptions
-- This enables PostgreSQL's powerful full-text search capabilities

-- Create a computed column for full-text search
ALTER TABLE "Job" 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(skills, ' ')), 'D')
) STORED;

-- Create GIN index for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_search_vector 
ON "Job" USING gin(search_vector);

-- ============================================================================
-- SECTION 2: COMPOSITE INDEXES FOR COMMON SEARCH PATTERNS
-- ============================================================================

-- Index for location + job type filtering (very common combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_location_jobtype_active 
ON "Job"(location, "jobType", "isActive") 
WHERE "isActive" = true;

-- Index for salary range queries with active jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_salary_range_active 
ON "Job"("salaryMin", "salaryMax", "isActive") 
WHERE "isActive" = true AND ("salaryMin" IS NOT NULL OR "salaryMax" IS NOT NULL);

-- Index for experience level with posting date (for sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_experience_posted_active 
ON "Job"("experienceLevel", "postedAt" DESC, "createdAt" DESC) 
WHERE "isActive" = true;

-- Index for sector-based filtering with location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_sector_location_active 
ON "Job"(sector, location, "isActive") 
WHERE "isActive" = true AND sector IS NOT NULL;

-- ============================================================================
-- SECTION 3: SPECIALIZED INDEXES FOR ADVANCED FILTERING
-- ============================================================================

-- Index for remote/hybrid job filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_remote_hybrid_active 
ON "Job"("isRemote", "isHybrid", "isFeatured", "isActive") 
WHERE "isActive" = true;

-- Index for skills array searches (GIN index for array operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_skills_gin 
ON "Job" USING gin(skills) 
WHERE "isActive" = true;

-- Index for recent job postings (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_recent_posted 
ON "Job"("postedAt" DESC, "createdAt" DESC, "isActive") 
WHERE "isActive" = true AND "postedAt" > (CURRENT_DATE - INTERVAL '30 days');

-- Index for company-based searches with job count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_company_active 
ON "Job"(company, "isActive", "createdAt" DESC) 
WHERE "isActive" = true AND company IS NOT NULL;

-- ============================================================================
-- SECTION 4: PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index only for featured jobs (smaller, faster)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_featured_posted 
ON "Job"("postedAt" DESC, "createdAt" DESC) 
WHERE "isActive" = true AND "isFeatured" = true;

-- Index only for urgent jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_urgent_posted 
ON "Job"("postedAt" DESC, "createdAt" DESC) 
WHERE "isActive" = true AND "isUrgent" = true;

-- Index for jobs with apply URLs (external jobs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_external_active 
ON "Job"("createdAt" DESC, source) 
WHERE "isActive" = true AND "applyUrl" IS NOT NULL;

-- ============================================================================
-- SECTION 5: COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Covering index for job list queries (includes commonly selected columns)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_list_covering 
ON "Job"("isActive", "postedAt" DESC, "createdAt" DESC) 
INCLUDE (id, title, company, "companyLogo", location, "salaryMin", "salaryMax", 
         "jobType", "experienceLevel", "isRemote", "isHybrid", "isFeatured", "isUrgent");

-- ============================================================================
-- SECTION 6: GEOGRAPHIC INDEXES (if using PostGIS in future)
-- ============================================================================

-- Note: These would be added if geographic search is implemented
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_geography 
-- ON "Job" USING gist(geography_point) 
-- WHERE "isActive" = true;

-- ============================================================================
-- SECTION 7: MAINTENANCE AND OPTIMIZATION
-- ============================================================================

-- Add constraint to ensure data quality
ALTER TABLE "Job" 
ADD CONSTRAINT chk_salary_range 
CHECK ("salaryMax" IS NULL OR "salaryMin" IS NULL OR "salaryMax" >= "salaryMin");

-- Add constraint for valid job types
ALTER TABLE "Job" 
ADD CONSTRAINT chk_job_type 
CHECK ("jobType" IN ('full-time', 'part-time', 'contract', 'internship', 'freelance') OR "jobType" IS NULL);

-- Add constraint for valid experience levels
ALTER TABLE "Job" 
ADD CONSTRAINT chk_experience_level 
CHECK ("experienceLevel" IN ('entry', 'mid', 'senior', 'executive', 'internship') OR "experienceLevel" IS NULL);

-- ============================================================================
-- SECTION 8: STATISTICS AND MAINTENANCE
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE "Job";

-- Create materialized view for common aggregations (optional)
CREATE MATERIALIZED VIEW IF NOT EXISTS job_filter_stats AS
SELECT 
    "jobType",
    "experienceLevel",
    sector,
    country,
    COUNT(*) as job_count,
    AVG("salaryMin") as avg_salary_min,
    AVG("salaryMax") as avg_salary_max,
    COUNT(*) FILTER (WHERE "isRemote" = true) as remote_count,
    COUNT(*) FILTER (WHERE "isHybrid" = true) as hybrid_count
FROM "Job" 
WHERE "isActive" = true 
GROUP BY "jobType", "experienceLevel", sector, country;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_filter_stats_unique 
ON job_filter_stats("jobType", "experienceLevel", sector, country);

-- ============================================================================
-- SECTION 9: PERFORMANCE MONITORING FUNCTIONS
-- ============================================================================

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_job_index_usage()
RETURNS TABLE(
    index_name text,
    table_name text,
    index_scans bigint,
    index_tuples_read bigint,
    index_tuples_fetched bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.indexrelname::text,
        t.relname::text,
        i.idx_scan,
        i.idx_tup_read,
        i.idx_tup_fetch
    FROM pg_stat_user_indexes i
    JOIN pg_class t ON i.relid = t.oid
    WHERE t.relname = 'Job'
    ORDER BY i.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get slow query recommendations
CREATE OR REPLACE FUNCTION analyze_job_query_performance()
RETURNS TABLE(
    recommendation text,
    query_pattern text,
    suggested_index text
) AS $$
BEGIN
    RETURN QUERY
    VALUES 
        ('Add composite index for location + job type searches', 
         'WHERE location = ? AND jobType = ?', 
         'CREATE INDEX ON "Job"(location, "jobType") WHERE "isActive" = true'),
        ('Add index for salary range queries', 
         'WHERE salaryMin >= ? AND salaryMax <= ?', 
         'CREATE INDEX ON "Job"("salaryMin", "salaryMax") WHERE "isActive" = true'),
        ('Add full-text search index for title/description', 
         'WHERE title ILIKE ? OR description ILIKE ?', 
         'CREATE INDEX ON "Job" USING gin(to_tsvector(title || description))');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 10: CLEANUP AND MAINTENANCE SCHEDULE
-- ============================================================================

-- Schedule to refresh materialized view (add to cron or application scheduler)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY job_filter_stats;

-- Schedule to update statistics (weekly)
-- ANALYZE "Job";

-- Schedule to reindex if needed (monthly)
-- REINDEX INDEX CONCURRENTLY idx_job_search_vector;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify indexes are created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'Job' 
ORDER BY indexname;

-- Check index sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE tablename = 'Job'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Sample performance test query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, title, company, location, "salaryMin", "salaryMax", "isRemote"
FROM "Job" 
WHERE "isActive" = true 
  AND search_vector @@ plainto_tsquery('english', 'software engineer')
  AND location ILIKE '%bangalore%'
  AND "jobType" = 'full-time'
ORDER BY "postedAt" DESC NULLS LAST, "createdAt" DESC
LIMIT 20;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
-- To rollback this migration:

DROP INDEX CONCURRENTLY IF EXISTS idx_job_search_vector;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_location_jobtype_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_salary_range_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_experience_posted_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_sector_location_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_remote_hybrid_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_skills_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_recent_posted;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_company_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_featured_posted;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_urgent_posted;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_external_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_list_covering;

ALTER TABLE "Job" DROP COLUMN IF EXISTS search_vector;
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS chk_salary_range;
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS chk_job_type;
ALTER TABLE "Job" DROP CONSTRAINT IF EXISTS chk_experience_level;

DROP MATERIALIZED VIEW IF EXISTS job_filter_stats;
DROP FUNCTION IF EXISTS get_job_index_usage();
DROP FUNCTION IF EXISTS analyze_job_query_performance();
*/
