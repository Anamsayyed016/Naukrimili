/**
 * SEO-Friendly URL Utilities
 * Generates Naukri-style URLs with keywords for better SEO
 */

export interface SEOJobData {
  id: string;
  title: string;
  company: string;
  location: string;
  experienceLevel?: string;
  salary?: string;
  jobType?: string;
  sector?: string;
}

/** Loose job shape from API/DB rows passed into SEO URL helpers */
export interface SEOJobInput {
  id?: unknown;
  sourceId?: unknown;
  source?: unknown;
  title?: unknown;
  company?: unknown;
  location?: unknown;
  companyRelation?: { name?: unknown } | null;
  experienceLevel?: unknown;
  experience?: unknown;
  salary?: unknown;
  salary_formatted?: unknown;
  jobType?: unknown;
  job_type?: unknown;
  sector?: unknown;
  industry?: unknown;
}

function isValidSEOField(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const str = String(val).toLowerCase().trim();
  return (
    str.length > 0 &&
    str !== 'undefined' &&
    str !== 'null' &&
    str !== 'n/a' &&
    str !== 'not specified' &&
    str !== 'salary not specified'
  );
}

function toTrimmedString(val: unknown): string | undefined {
  if (!isValidSEOField(val)) return undefined;
  return String(val).trim();
}

function resolveCompanyName(job: SEOJobInput): string {
  return (
    toTrimmedString(job.company) ??
    toTrimmedString(job.companyRelation?.name) ??
    'company'
  );
}

function buildSEOJobFields(job: SEOJobInput): Omit<SEOJobData, 'id'> {
  return {
    title: toTrimmedString(job.title) ?? 'job',
    company: resolveCompanyName(job),
    location: toTrimmedString(job.location) ?? 'location',
    experienceLevel:
      toTrimmedString(job.experienceLevel) ?? toTrimmedString(job.experience),
    salary: toTrimmedString(job.salary) ?? toTrimmedString(job.salary_formatted),
    jobType: toTrimmedString(job.jobType) ?? toTrimmedString(job.job_type),
    sector: toTrimmedString(job.sector) ?? toTrimmedString(job.industry),
  };
}

/**
 * Generate SEO-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate company slug from company name
 */
export function generateCompanySlug(company: string): string {
  return generateSlug(company.replace(/[^a-z0-9\s-]/gi, ''));
}

/**
 * Generate location slug from location
 */
export function generateLocationSlug(location: string): string {
  // Handle common location formats
  let cleanLocation = location
    .replace(/\s*,\s*/g, '-') // Replace commas with hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase();
  
  return generateSlug(cleanLocation);
}

/**
 * Generate experience level slug
 */
export function generateExperienceSlug(experienceLevel?: string): string {
  if (!experienceLevel) return '';
  
  // Handle common experience formats
  const experience = experienceLevel.toLowerCase()
    .replace(/\s*years?\s*/g, '')
    .replace(/\s*to\s*/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s*\+\s*/g, 'plus');
  
  return generateSlug(experience);
}

/**
 * Generate salary slug
 * CRITICAL FIX: Avoid creating slugs that interfere with job ID extraction
 * Skip salary in URL if it contains problematic patterns like "perhour", "peryear", etc.
 */
export function generateSalarySlug(salary?: string): string {
  if (!salary) return '';
  
  // Handle salary formats like "8-11 Lacs P.A." or "₹50,000 - ₹70,000"
  const cleanSalary = salary
    .toLowerCase()
    .replace(/[₹,]/g, '') // Remove currency symbols and commas
    .replace(/\s*lacs?\s*p\.a\.?/g, 'lpa') // Convert lacs P.A. to lpa
    .replace(/\s*to\s*/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, '');
  
  // CRITICAL FIX: Skip salary if it contains problematic patterns that interfere with ID extraction
  // Patterns like "6199perhour" can cause parsing issues
  if (cleanSalary.includes('perhour') || 
      cleanSalary.includes('peryear') || 
      cleanSalary.includes('permonth') ||
      cleanSalary.includes('perweek') ||
      cleanSalary.includes('perday') ||
      /^\d+per/.test(cleanSalary)) {
    console.warn('⚠️ Skipping salary slug generation - contains problematic pattern:', cleanSalary);
    return ''; // Return empty to exclude from URL
  }
  
  const slug = generateSlug(cleanSalary);
  
  // Return empty string if slug is invalid to prevent trailing hyphens
  if (!slug || slug === '-' || slug.length === 0) {
    return '';
  }
  
  // Additional validation: if slug looks like it could be confused with a job ID, skip it
  // Patterns like "4427-6199" or long numeric strings should be avoided
  if (/^\d{4,}-\d{4,}$/.test(slug) || /^\d{10,}$/.test(slug)) {
    console.warn('⚠️ Skipping salary slug - looks like a job ID:', slug);
    return '';
  }
  
  return slug;
}

/**
 * Validate job ID format
 */
export function isValidJobId(id: unknown): boolean {
  if (!id) return false;
  
  const idStr = String(id);
  
  // Reject decimal numbers from Math.random()
  if (/^\d*\.\d+$/.test(idStr)) {
    console.warn('⚠️ Invalid job ID (decimal from Math.random()):', idStr);
    return false;
  }
  
  // Accept numeric IDs
  if (/^\d+$/.test(idStr)) return true;
  
  // Accept string IDs with valid format (alphanumeric, hyphens, underscores)
  if (/^[a-zA-Z0-9_-]+$/.test(idStr) && idStr.length > 0 && idStr.length < 200) {
    return true;
  }
  
  return false;
}

/**
 * Generate complete SEO-friendly job URL
 */
export function generateSEOJobUrl(jobData: SEOJobData): string {
  const {
    id,
    title,
    company,
    location,
    experienceLevel,
    salary
  } = jobData;

  // Validate required fields first
  if (!id) {
    console.error('❌ No job ID provided for URL generation');
    return `/jobs`;
  }

  // If ID is invalid format, try to sanitize it
  if (!isValidJobId(id)) {
    console.warn('⚠️ Invalid job ID format, attempting to sanitize:', id);
    // Try to extract a valid part of the ID
    const sanitized = String(id).replace(/[^a-zA-Z0-9_-]/g, '-');
    // If sanitization results in something valid, use it; otherwise use simple numeric fallback
    if (sanitized && sanitized.length > 0 && sanitized !== '-') {
      return `/jobs/${sanitized}`;
    }
    // Last resort: use the ID as-is and let the API handle it
    console.warn('⚠️ Using unsanitized ID as fallback:', id);
    return `/jobs/${id}`;
  }

  // Validate required fields - if missing, use simple ID URL
  if (!title || !company || !location) {
    return `/jobs/${id}`;
  }

  // Generate slugs
  const titleSlug = generateSlug(title);
  const companySlug = generateCompanySlug(company);
  const locationSlug = generateLocationSlug(location);
  const experienceSlug = generateExperienceSlug(experienceLevel);
  const salarySlug = generateSalarySlug(salary);

  // Build URL parts - only include valid slugs
  const urlParts = [
    titleSlug,
    companySlug,
    locationSlug
  ].filter(part => part && part !== 'undefined' && part !== 'null' && part.length > 0);

  // Add experience if available and valid
  if (experienceSlug && experienceSlug !== 'undefined' && experienceSlug !== 'null' && experienceSlug.length > 0) {
    urlParts.push(experienceSlug);
  }

  // Add salary if available, valid, and not too long
  if (salarySlug && 
      salarySlug !== 'undefined' && 
      salarySlug !== 'null' && 
      salarySlug !== 'salarynotspecified' &&
      salarySlug.length > 0 && 
      salarySlug.length <= 20) {
    urlParts.push(salarySlug);
  }

  // Join with hyphens and add job ID
  const seoPath = urlParts.filter(Boolean).join('-');
  
  // CRITICAL FIX: Ensure no double-hyphens by trimming trailing hyphens from seoPath
  const cleanSeoPath = seoPath.replace(/-+$/, ''); // Remove trailing hyphens
  const finalUrl = `/jobs/${cleanSeoPath}-${id}`;

  // Ensure URL doesn't exceed reasonable length (SEO best practice)
  if ((finalUrl || '').length > 200) {
    // Fallback to shorter version
    const shortPath = [titleSlug, companySlug, locationSlug].filter(Boolean).join('-');
    const cleanShortPath = shortPath.replace(/-+$/, ''); // Remove trailing hyphens
    return `/jobs/${cleanShortPath}-${id}`;
  }

  return finalUrl;
}

/**
 * Parse SEO URL to extract job ID
 * Enhanced to handle more URL patterns while maintaining backward compatibility
 */
export function parseSEOJobUrl(url: string): string | null {
  console.log('🔍 Parsing SEO URL:', url);
  
  // Clean the URL: remove trailing slashes and path segments like /apply
  let cleanUrl = url.trim().replace(/\/+$/, ''); // Remove trailing slashes
  cleanUrl = cleanUrl.replace(/\/apply$/, ''); // Remove /apply suffix
  cleanUrl = cleanUrl.replace(/\/details$/, ''); // Remove /details suffix
  cleanUrl = cleanUrl.replace(/\/external$/, ''); // Remove /external suffix
  
  console.log('🧹 Cleaned URL:', cleanUrl);
  
  // Handle direct numeric IDs (no SEO formatting)
  if (/^\d+$/.test(cleanUrl)) {
    console.log('✅ Found direct numeric ID:', cleanUrl);
    return cleanUrl;
  }
  
  // Listing composite ID at end of SEO slug: ...-ext-adzuna-12345
  const extCompositeEnd = cleanUrl.match(/-(ext-[^-]+-.+)$/);
  if (extCompositeEnd) {
    console.log('✅ Found ext composite ID at end of SEO URL:', extCompositeEnd[1]);
    return extCompositeEnd[1];
  }

  // Handle direct external job IDs (e.g., adzuna-12345, ext-adzuna-12345, job-timestamp-id)
  if (/^(adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external|sample|job)-/.test(cleanUrl)) {
    console.log('✅ Found external/generated job ID:', cleanUrl);
    return cleanUrl;
  }
  
  // Handle direct string IDs (for external jobs)
  if (/^[a-zA-Z0-9_-]+$/.test(cleanUrl) && cleanUrl.split('-').length <= 3) {
    console.log('✅ Found direct string ID:', cleanUrl);
    return cleanUrl;
  }
  
  // Special handling for sample job IDs that contain hyphens
  const sampleJobMatch = cleanUrl.match(/-(sample-[a-zA-Z0-9_-]+)$/);
  if (sampleJobMatch) {
    const jobId = sampleJobMatch[1];
    console.log('✅ Found sample job ID:', jobId);
    return jobId;
  }
  
  // Remove common invalid segments from URL before parsing
  cleanUrl = cleanUrl.replace(/-undefined$/g, '');
  cleanUrl = cleanUrl.replace(/-null$/g, '');
  cleanUrl = cleanUrl.replace(/-salarynotspecified$/g, '');
  cleanUrl = cleanUrl.replace(/-notspecified$/g, '');
  // Remove salary-related text that might interfere (e.g., "6199perhour")
  cleanUrl = cleanUrl.replace(/-(\d+)per(hour|year|month|week|day)$/gi, '');
  cleanUrl = cleanUrl.replace(/-(\d+)lpa$/gi, '');
  cleanUrl = cleanUrl.replace(/-(\d+)k$/gi, '');
  
  console.log('🧹 After removing invalid segments:', cleanUrl);
  
  // CRITICAL FIX: First, try to extract the longest numeric ID at the end
  // This handles cases like "slug-6199perhour-3883752298559564300" where we want the last long number
  // Also handle cases where salary text might be before the ID
  const longNumericMatch = cleanUrl.match(/-([0-9]{10,})$/);
  if (longNumericMatch) {
    const jobId = longNumericMatch[1];
    console.log('✅ Found long numeric ID at end (10+ digits):', jobId);
    return jobId;
  }
  
  // Also try to find any long numeric string (10+ digits) near the end of the URL
  // This catches cases where there might be text after the number or formatting issues
  const anyLongNumericMatch = cleanUrl.match(/([0-9]{10,})/g);
  if (anyLongNumericMatch && anyLongNumericMatch.length > 0) {
    // Get the last (longest) numeric match
    const jobId = anyLongNumericMatch[anyLongNumericMatch.length - 1];
    // Only use it if it's at the end or very close to the end
    const position = cleanUrl.lastIndexOf(jobId);
    if (position + jobId.length >= cleanUrl.length - 10) { // Within last 10 chars
      console.log('✅ Found long numeric ID near end:', jobId);
      return jobId;
    }
  }
  
  // Extract job ID from SEO URL patterns (in order of specificity)
  // Pattern priority: most specific to least specific
  // CRITICAL: Large numeric IDs (10+ digits) should be matched first to avoid partial matches
  const patterns = [
    // CRITICAL: Double-hyphen patterns (for URLs like slug--123456)
    // These must come FIRST to match before single-hyphen patterns
    /--([0-9]{10,})$/,  // Double hyphen + very long numbers (10+ digits - large IDs)
    /--([0-9]{6,})$/,  // Double hyphen + long numbers (6+ digits)
    /--([a-zA-Z0-9_-]+)$/,  // Double hyphen + any ID format
    
    // External job IDs with full format (e.g., external-1762106256188-0)
    /--((?:adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external)-\d+-\d+)$/,
    /-((?:adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external)-\d+-\d+)$/,
    // External job IDs with 4 parts (e.g., adzuna-1730-0-123456)
    /--((?:adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external)-\d+-\d+-\d+)$/,
    /-((?:adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external)-\d+-\d+-\d+)$/,
    // Generated job IDs (e.g., job-1762036808263-199612)
    /--(job-\d+-\d+)$/,
    /-(job-\d+-\d+)$/,
    // Sample job IDs (e.g., sample-1759851700270-18)
    /--(sample-\d+-\d+)$/,
    /-(sample-\d+-\d+)$/,
    // Timestamp-number patterns (e.g., 1730000000-123456)
    /--(\d{13,}-\d+)$/,
    /-(\d{13,}-\d+)$/,
    // Long alphanumeric IDs (timestamp-id format)
    /--([a-zA-Z0-9]{20,})$/,
    /-([a-zA-Z0-9]{20,})$/,
    // Provider-specific IDs (e.g., adzuna-5461851969)
    /--((?:adzuna|jsearch|jooble|indeed|ziprecruiter)-[a-zA-Z0-9]+)$/,
    /-((?:adzuna|jsearch|jooble|indeed|ziprecruiter)-[a-zA-Z0-9]+)$/,
    // Long numbers (6-9 digits - likely generated IDs)
    /-([0-9]{6,9})$/,
    // Integer numbers (1-5 digits - most common)
    /-([0-9]{1,5})$/,
    // Fallback pattern (alphanumeric with hyphens)
    /-([a-zA-Z0-9_-]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      const jobId = match[1]; // Get first capture group (always the job ID)
      console.log('✅ Found job ID via pattern:', jobId, 'from pattern:', pattern);
      // Validate the extracted ID doesn't look like a decimal from Math.random()
      if (!/^\d*\.\d+$/.test(jobId)) {
        return jobId;
      } else {
        console.warn('⚠️ Skipping decimal ID (likely from Math.random()):', jobId);
        continue;
      }
    }
  }
  
  // Final fallback: try to extract any ID-like string from the end
  const fallbackMatch = cleanUrl.match(/([a-zA-Z0-9_-]+)$/);
  if (fallbackMatch) {
    const jobId = fallbackMatch[1];
    // Skip if it looks like a decimal from Math.random()
    if (!/^\d*\.\d+$/.test(jobId)) {
      console.log('✅ Found job ID via fallback:', jobId);
      return jobId;
    }
  }
  
  console.log('❌ No valid job ID found in URL:', url);
  return null;
}

/**
 * Generate job listing URL with search parameters
 */
export function generateJobListingUrl(params: {
  query?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: string;
  salaryMax?: string;
  sector?: string;
  isRemote?: boolean;
  page?: number;
}): string {
  const searchParams = new URLSearchParams();

  if (params.query) searchParams.set('q', params.query);
  if (params.location) searchParams.set('location', params.location);
  if (params.jobType) searchParams.set('jobType', params.jobType);
  if (params.experienceLevel) searchParams.set('experienceLevel', params.experienceLevel);
  if (params.salaryMin) searchParams.set('salaryMin', params.salaryMin);
  if (params.salaryMax) searchParams.set('salaryMax', params.salaryMax);
  if (params.sector) searchParams.set('sector', params.sector);
  if (params.isRemote) searchParams.set('isRemote', 'true');
  if (params.page && params.page > 1) searchParams.set('page', params.page.toString());

  const queryString = searchParams.toString();
  return queryString ? `/jobs?${queryString}` : '/jobs';
}

/**
 * Generate company profile URL
 */
export function generateCompanyUrl(companyName: string, companyId?: string): string {
  const companySlug = generateCompanySlug(companyName);
  return companyId ? `/companies/${companySlug}-${companyId}` : `/companies/${companySlug}`;
}

/**
 * Generate category/sector URL
 */
export function generateSectorUrl(sector: string): string {
  const sectorSlug = generateSlug(sector);
  return `/jobs/sector/${sectorSlug}`;
}

/**
 * Generate location-based job URL
 */
export function generateLocationJobUrl(location: string): string {
  const locationSlug = generateLocationSlug(location);
  return `/jobs/location/${locationSlug}`;
}

/**
 * Validate and clean job data for SEO URL generation
 */
export function cleanJobDataForSEO(jobData: SEOJobInput): SEOJobData {
  const fields = buildSEOJobFields(jobData);

  // Keep listing composite ID in URLs (matches unified API: ext-{source}-{sourceId})
  const listingId = String(jobData.id ?? '');
  if (listingId.startsWith('ext-') && jobData.sourceId) {
    return { id: listingId, ...fields };
  }

  const source = typeof jobData.source === 'string' ? jobData.source : String(jobData.source ?? '');
  const isExternalJob =
    source.length > 0 && source !== 'manual' && source !== 'database';
  const hasLargeNumericId =
    typeof jobData.id === 'number' && !Number.isSafeInteger(jobData.id);
  const idStr = String(jobData.id ?? '');
  const hasLargeStringId = typeof jobData.id === 'string' && /^\d{16,}$/.test(idStr);
  const hasLargeNumberInRange = typeof jobData.id === 'string' && /^\d{11,}$/.test(idStr);

  const shouldUseSourceId =
    Boolean(jobData.sourceId) &&
    (isExternalJob ||
      hasLargeNumericId ||
      hasLargeStringId ||
      hasLargeNumberInRange ||
      (!jobData.source && (hasLargeNumericId || hasLargeStringId || hasLargeNumberInRange)));

  const jobId = shouldUseSourceId
    ? String(jobData.sourceId)
    : String(jobData.id ?? jobData.sourceId ?? '');

  if (
    (hasLargeNumericId || hasLargeStringId || hasLargeNumberInRange) &&
    !jobData.sourceId
  ) {
    console.warn('⚠️ Large job ID detected but no sourceId available:', jobData.id);
  }

  return { id: jobId, ...fields };
}

/**
 * Generate multiple URL variations for testing
 */
export function generateUrlVariations(jobData: SEOJobData): {
  full: string;
  short: string;
  minimal: string;
} {
  return {
    full: generateSEOJobUrl(jobData),
    short: generateSEOJobUrl({
      ...jobData,
      salary: undefined // Remove salary for shorter URL
    }),
    minimal: `/jobs/${generateSlug(jobData.title)}-${jobData.id}`
  };
}
