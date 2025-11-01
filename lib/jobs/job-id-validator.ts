/**
 * Job ID Validation Utilities
 * Filters out jobs with invalid IDs (decimals from Math.random())
 */

/**
 * Check if a job has a valid ID
 */
export function hasValidJobId(job: any): boolean {
  if (!job) return false;
  
  const jobId = job.id?.toString() || '';
  const sourceId = job.sourceId?.toString() || '';
  
  // Reject decimal IDs from Math.random()
  const hasInvalidId = /^\d*\.\d+$/.test(jobId) || /\d+\.\d+/.test(sourceId);
  
  if (hasInvalidId) {
    return false;
  }
  
  // Must have at least one valid ID
  return jobId.length > 0 || sourceId.length > 0;
}

/**
 * Filter array of jobs to remove those with invalid IDs
 */
export function filterValidJobs(jobs: any[]): any[] {
  const validJobs = jobs.filter(job => {
    const isValid = hasValidJobId(job);
    
    if (!isValid) {
      console.warn('⚠️ Filtered out job with invalid ID:', {
        id: job.id,
        sourceId: job.sourceId,
        title: job.title,
        company: job.company
      });
    }
    
    return isValid;
  });
  
  const filtered = jobs.length - validJobs.length;
  if (filtered > 0) {
    console.log(`🔄 Filtered out ${filtered} jobs with invalid IDs (${validJobs.length} valid jobs remaining)`);
  }
  
  return validJobs;
}

/**
 * Sanitize job ID by removing invalid characters
 */
export function sanitizeJobId(id: any): string | null {
  if (!id) return null;
  
  const idStr = String(id);
  
  // If it's a decimal from Math.random(), return null
  if (/^\d*\.\d+$/.test(idStr)) {
    return null;
  }
  
  // Remove invalid characters
  const sanitized = idStr.replace(/[^a-zA-Z0-9_-]/g, '-');
  
  // Ensure it's not empty or just dashes
  if (!sanitized || /^-+$/.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Get valid job ID from job object
 */
export function getValidJobId(job: any): string | null {
  // Try primary ID first
  const primaryId = sanitizeJobId(job.id);
  if (primaryId) return primaryId;
  
  // Try sourceId as fallback
  const secondaryId = sanitizeJobId(job.sourceId);
  if (secondaryId) return secondaryId;
  
  // No valid ID found
  return null;
}

