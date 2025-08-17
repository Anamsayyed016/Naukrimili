-- Performance Optimization Migration
-- This migration adds critical indexes for job search performance

-- 1. Full-text search optimization for job titles and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_search_vector 
ON "Job" USING gin(to_tsvector('english', title || ' ' || description));

-- 2. Composite index for location-based searches with active jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_location_active 
ON "Job"(location, isActive) WHERE isActive = true;

-- 3. Composite index for job type and experience level searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_type_experience 
ON "Job"(jobType, experienceLevel, isActive) WHERE isActive = true;

-- 4. Salary range optimization for salary-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_salary_range 
ON "Job"(salaryMin, salaryMax, isActive) WHERE isActive = true AND salaryMin IS NOT NULL;

-- 5. Skills array search optimization using GIN index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_skills_gin 
ON "Job" USING gin(skills);

-- 6. Remote job optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_remote_active 
ON "Job"(isRemote, isActive) WHERE isActive = true;

-- 7. Sector-based job optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_sector_active 
ON "Job"(sector, isActive) WHERE isActive = true;

-- 8. Company-based job optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_company_active 
ON "Job"(company, isActive) WHERE isActive = true;

-- 9. Posted date optimization for recent job searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_posted_recent 
ON "Job"(postedAt DESC, isActive) WHERE isActive = true AND postedAt IS NOT NULL;

-- 10. Country and location composite index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_country_location 
ON "Job"(country, location, isActive) WHERE isActive = true;

-- 11. Featured and urgent job optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_featured_urgent 
ON "Job"(isFeatured, isUrgent, isActive) WHERE isActive = true;

-- 12. Application count optimization for popular jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_active 
ON "Job"(applicationsCount DESC, isActive) WHERE isActive = true;

-- 13. View count optimization for trending jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_views_active 
ON "Job"(views DESC, isActive) WHERE isActive = true;

-- 14. Hybrid work arrangement optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_hybrid_active 
ON "Job"(isHybrid, isActive) WHERE isActive = true;

-- 15. Source-based job optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_source_active 
ON "Job"(source, isActive) WHERE isActive = true;

-- Add comments for documentation
COMMENT ON INDEX idx_job_search_vector IS 'Full-text search optimization for job titles and descriptions';
COMMENT ON INDEX idx_job_location_active IS 'Location-based job searches with active job filtering';
COMMENT ON INDEX idx_job_type_experience IS 'Job type and experience level searches with active filtering';
COMMENT ON INDEX idx_job_salary_range IS 'Salary range filtering optimization for active jobs';
COMMENT ON INDEX idx_job_skills_gin IS 'Skills array search optimization using GIN index';
COMMENT ON INDEX idx_job_remote_active IS 'Remote job filtering optimization';
COMMENT ON INDEX idx_job_sector_active IS 'Sector-based job filtering optimization';
COMMENT ON INDEX idx_job_company_active IS 'Company-based job filtering optimization';
COMMENT ON INDEX idx_job_posted_recent IS 'Recent job searches optimization by posted date';
COMMENT ON INDEX idx_job_country_location IS 'Country and location composite search optimization';
COMMENT ON INDEX idx_job_featured_urgent IS 'Featured and urgent job optimization';
COMMENT ON INDEX idx_job_applications_active IS 'Popular jobs by application count optimization';
COMMENT ON INDEX idx_job_views_active IS 'Trending jobs by view count optimization';
COMMENT ON INDEX idx_job_hybrid_active IS 'Hybrid work arrangement optimization';
COMMENT ON INDEX idx_job_source_active IS 'Source-based job filtering optimization';
