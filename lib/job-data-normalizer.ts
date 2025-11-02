/**
 * Job Data Normalizer
 * Ensures consistent job data structure across the application
 * Maintains backward compatibility with existing code
 */

import { JobResult } from '@/types/jobs';

/**
 * Normalize job data to ensure consistent structure
 * Handles various data formats from different sources
 */
export function normalizeJobData(job: any): JobResult {
  if (!job) {
    return getDefaultJobData();
  }

  return {
    id: job.id?.toString() || job.sourceId || '', // CRITICAL FIX: Fallback to sourceId if id is missing
    sourceId: job.sourceId, // CRITICAL FIX: Preserve sourceId for external jobs
    title: job.title || 'Job Title',
    company: job.company || job.companyRelation?.name || 'Company',
    companyLogo: job.companyLogo || job.companyRelation?.logo,
    location: job.location || 'Location',
    description: job.description || 'No description available',
    salary: normalizeSalary(job),
    salary_formatted: normalizeSalary(job),
    // Preserve original salary fields for proper currency formatting
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    country: job.country,
    time_ago: normalizeTimeAgo(job),
    redirect_url: normalizeRedirectUrl(job),
    is_remote: normalizeBoolean(job.is_remote, job.isRemote),
    is_hybrid: normalizeBoolean(job.is_hybrid, job.isHybrid),
    is_urgent: normalizeBoolean(job.is_urgent, job.isUrgent),
    is_featured: normalizeBoolean(job.is_featured, job.isFeatured),
    job_type: job.job_type || job.jobType,
    experience_level: job.experience_level || job.experienceLevel,
    skills: normalizeSkills(job.skills),
    sector: job.sector,
    posted_at: job.posted_at || job.postedAt,
    created_at: job.created_at || job.createdAt,
    source: job.source || 'manual', // CRITICAL: This determines if sourceId is used for URL
    source_url: job.source_url || job.applyUrl,
    jobType: job.jobType || job.job_type,
    experienceLevel: job.experienceLevel || job.experience_level,
    isExternal: job.isExternal || job.source !== 'manual',
    applyUrl: job.applyUrl || job.source_url || job.redirect_url
  };
}

/**
 * Normalize salary field - return raw data for proper currency formatting
 */
function normalizeSalary(job: any): string {
  // Return raw salary string if available (for proper currency formatting later)
  if (job.salary && typeof job.salary === 'string') return job.salary;
  if (job.salary_formatted && typeof job.salary_formatted === 'string') return job.salary_formatted;
  
  // For numeric salaries, return a simple range format without currency symbol
  if (job.salaryMin && job.salaryMax) {
    return `${job.salaryMin}-${job.salaryMax}`;
  }
  
  if (job.salaryMin) {
    return `${job.salaryMin}+`;
  }
  
  return 'Salary not specified';
}

/**
 * Normalize time ago field
 */
function normalizeTimeAgo(job: any): string {
  if (job.time_ago) return job.time_ago;
  
  const date = job.postedAt || job.posted_at || job.createdAt || job.created_at;
  if (date) {
    return formatTimeAgo(new Date(date));
  }
  
  return 'Recently posted';
}

/**
 * Format time ago from date
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  
  return `${Math.floor(diffInDays / 365)} years ago`;
}

/**
 * Normalize redirect URL
 */
function normalizeRedirectUrl(job: any): string {
  return job.redirect_url || job.source_url || job.applyUrl || '#';
}

/**
 * Normalize boolean fields
 */
function normalizeBoolean(value1: any, value2: any): boolean {
  if (typeof value1 === 'boolean') return value1;
  if (typeof value2 === 'boolean') return value2;
  if (value1 === 'true' || value1 === 1) return true;
  if (value2 === 'true' || value2 === 1) return true;
  return false;
}

/**
 * Normalize skills array
 */
function normalizeSkills(skills: any): string[] {
  if (!skills) return [];
  
  if (Array.isArray(skills)) {
    return skills.filter(skill => skill && typeof skill === 'string');
  }
  
  if (typeof skills === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        return parsed.filter(skill => skill && typeof skill === 'string');
      }
    } catch {
      // If JSON parsing fails, split by comma
      return skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
    }
  }
  
  return [];
}

/**
 * Get default job data for fallback
 */
function getDefaultJobData(): JobResult {
  return {
    id: '',
    title: 'Job Title',
    company: 'Company',
    location: 'Location',
    description: 'No description available',
    salary: 'Salary not specified',
    salary_formatted: 'Salary not specified',
    time_ago: 'Recently posted',
    redirect_url: '#',
    is_remote: false,
    is_hybrid: false,
    is_urgent: false,
    is_featured: false,
    skills: [],
    source: 'manual',
    isExternal: false
  };
}

/**
 * Validate job data structure
 */
export function validateJobData(job: any): boolean {
  if (!job) return false;
  
  const requiredFields = ['id', 'title', 'company'];
  return requiredFields.every(field => job[field] && job[field].toString().trim().length > 0);
}

/**
 * Sanitize job data for display
 */
export function sanitizeJobData(job: any): any {
  if (!job) return null;
  
  const sanitized = { ...job };
  
  // Sanitize string fields
  const stringFields = ['title', 'company', 'location', 'description', 'salary'];
  stringFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
    }
  });
  
  // Ensure ID is string
  if (sanitized.id) {
    sanitized.id = sanitized.id.toString();
  }
  
  return sanitized;
}
