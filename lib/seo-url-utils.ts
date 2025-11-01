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
 * Validate job ID format
 */
export function isValidJobId(id: any): boolean {
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

  // Validate job ID first
  if (!isValidJobId(id)) {
    console.error('❌ Invalid job ID for SEO URL generation:', id);
    return `/jobs/invalid`;
  }

  // Validate required fields - if missing, use simple ID URL
  if (!id || !title || !company || !location) {
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
  const finalUrl = `/jobs/${seoPath}-${id}`;

  // Ensure URL doesn't exceed reasonable length (SEO best practice)
  if ((finalUrl || '').length > 200) {
    // Fallback to shorter version
    const shortPath = [titleSlug, companySlug, locationSlug].filter(Boolean).join('-');
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
  cleanUrl = cleanUrl.replace(/\/external$/, ''); // Remove /external suffix
  
  console.log('🧹 Cleaned URL:', cleanUrl);
  
  // Handle direct numeric IDs (no SEO formatting)
  if (/^\d+$/.test(cleanUrl)) {
    console.log('✅ Found direct numeric ID:', cleanUrl);
    return cleanUrl;
  }
  
  // Handle direct external job IDs (e.g., adzuna-12345, jsearch-67890, ext-timestamp-id)
  if (/^(adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external|sample)-/.test(cleanUrl)) {
    console.log('✅ Found external job ID:', cleanUrl);
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
  
  console.log('🧹 After removing invalid segments:', cleanUrl);
  
  // Extract job ID from SEO URL patterns (in order of specificity)
  // Pattern priority: most specific to least specific
  const patterns = [
    // External job IDs with provider prefix (e.g., adzuna-1730-0-123456)
    /-((?:adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external)-\d+-\d+-\d+)$/,
    // External job IDs (e.g., ext-1730000000-123456)
    /-((?:adzuna|jsearch|jooble|indeed|ziprecruiter|ext|external)-\d+-\d+)$/,
    // Sample job IDs (e.g., sample-1759851700270-18)
    /-(sample-\d+-\d+)$/,
    // Long alphanumeric IDs (timestamp-id format)
    /-([a-zA-Z0-9]{20,})$/,
    // Timestamp-number patterns (e.g., 1730000000-123456)
    /-(\d{13,})-(\d+)$/,
    // Long numbers (6+ digits - likely generated IDs)
    /-([0-9]{6,})$/,
    // Integer numbers (most common - matches "9" at the end)
    /-([0-9]+)$/,
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
export function cleanJobDataForSEO(jobData: any): SEOJobData {
  // Helper to check if value is valid and not placeholder text
  const isValidValue = (val: any): boolean => {
    if (!val) return false;
    const str = String(val).toLowerCase().trim();
    return str.length > 0 && 
           str !== 'undefined' && 
           str !== 'null' && 
           str !== 'n/a' &&
           str !== 'not specified' &&
           str !== 'salary not specified';
  };

  return {
    id: jobData.id || jobData.sourceId || '',
    title: isValidValue(jobData.title) ? jobData.title.trim() : 'job',
    company: isValidValue(jobData.company) ? jobData.company.trim() : 
             isValidValue(jobData.companyRelation?.name) ? jobData.companyRelation.name.trim() : 'company',
    location: isValidValue(jobData.location) ? jobData.location.trim() : 'location',
    experienceLevel: isValidValue(jobData.experienceLevel) ? jobData.experienceLevel : 
                     isValidValue(jobData.experience) ? jobData.experience : undefined,
    salary: isValidValue(jobData.salary) ? jobData.salary : 
            isValidValue(jobData.salary_formatted) ? jobData.salary_formatted : undefined,
    jobType: isValidValue(jobData.jobType) ? jobData.jobType : 
             isValidValue(jobData.job_type) ? jobData.job_type : undefined,
    sector: isValidValue(jobData.sector) ? jobData.sector : 
            isValidValue(jobData.industry) ? jobData.industry : undefined
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
