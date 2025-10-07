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
  
  return generateSlug(cleanSalary);
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
    salary,
    jobType,
    sector
  } = jobData;

  // Generate slugs
  const titleSlug = generateSlug(title);
  const companySlug = generateCompanySlug(company);
  const locationSlug = generateLocationSlug(location);
  const experienceSlug = generateExperienceSlug(experienceLevel);
  const salarySlug = generateSalarySlug(salary);

  // Build URL parts
  const urlParts = [
    titleSlug,
    companySlug,
    locationSlug
  ];

  // Add experience if available
  if (experienceSlug) {
    urlParts.push(experienceSlug);
  }

  // Add salary if available (limit length)
  if (salarySlug && (salarySlug || '').length <= 20) {
    urlParts.push(salarySlug);
  }

  // Join with hyphens and add job ID
  const seoPath = urlParts.join('-');
  const finalUrl = `/jobs/${seoPath}-${id}`;

  // Ensure URL doesn't exceed reasonable length (SEO best practice)
  if ((finalUrl || '').length > 200) {
    // Fallback to shorter version
    const shortPath = [titleSlug, companySlug, locationSlug].join('-');
    return `/jobs/${shortPath}-${id}`;
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
  
  console.log('🧹 Cleaned URL:', cleanUrl);
  
  // Handle direct numeric IDs (no SEO formatting)
  if (/^\d+$/.test(cleanUrl)) {
    console.log('✅ Found direct numeric ID:', cleanUrl);
    return cleanUrl;
  }
  
  // Handle direct string IDs (for external jobs)
  if (/^[a-zA-Z0-9_-]+$/.test(cleanUrl) && !cleanUrl.includes('-')) {
    console.log('✅ Found direct string ID:', cleanUrl);
    return cleanUrl;
  }
  
  // Special handling for sample job IDs that contain hyphens
  const sampleJobMatch = cleanUrl.match(/-sample-([a-zA-Z0-9_-]+)$/);
  if (sampleJobMatch) {
    const jobId = `sample-${sampleJobMatch[1]}`;
    console.log('✅ Found sample job ID:', jobId);
    return jobId;
  }
  
  // Special handling for sample jobs in SEO URLs
  // Look for pattern: -1759851700270-18 (timestamp-number) which indicates sample job
  const sampleTimestampMatch = cleanUrl.match(/-(\d{13})-(\d+)$/);
  if (sampleTimestampMatch) {
    const timestamp = sampleTimestampMatch[1];
    const number = sampleTimestampMatch[2];
    const jobId = `sample-${timestamp}-${number}`;
    console.log('✅ Found sample job ID from timestamp pattern:', jobId);
    return jobId;
  }
  
  // Extract job ID from SEO URL patterns (in order of specificity)
  // For URLs like: cloud-engineer-devstudio-san-francisco-usa-entry-level-800000-2000000-diverse-1759317579085-9
  const patterns = [
    /-([a-zA-Z0-9]{20,})$/,           // Long alphanumeric IDs (timestamp-id format)
    /-([0-9]+\.[0-9]+)$/,             // Decimal numbers
    /-([0-9]+)$/,                     // Integer numbers (most common - matches "9" at the end)
    /-([0-9]+)-([0-9]+)$/,            // Multi-number patterns (take last number)
    /-([a-zA-Z0-9_-]+)$/              // Fallback pattern
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      const jobId = match[(match || []).length - 1]; // Get last capture group
      console.log('✅ Found job ID via pattern:', jobId, 'from pattern:', pattern);
      return jobId;
    }
  }
  
  // Final fallback: try to extract any ID-like string from the end
  const fallbackMatch = cleanUrl.match(/([a-zA-Z0-9_-]+)$/);
  if (fallbackMatch) {
    console.log('✅ Found job ID via fallback:', fallbackMatch[1]);
    return fallbackMatch[1];
  }
  
  console.log('❌ No job ID found in URL:', url);
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
export function cleanJobDataForSEO(jobData: any): SEOJobData {
  return {
    id: jobData.id || '',
    title: (jobData.title || 'job').trim(),
    company: (jobData.company || jobData.companyRelation?.name || 'company').trim(),
    location: (jobData.location || 'location').trim(),
    experienceLevel: jobData.experienceLevel || jobData.experience,
    salary: jobData.salary || jobData.salary_formatted,
    jobType: jobData.jobType || jobData.job_type,
    sector: jobData.sector || jobData.industry
  };
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
