/**
 * Company Career Page Finder
 * Generates smart URLs to find company career pages (bypasses geo-blocking)
 */

/**
 * Generate Google search URL for company careers + specific job
 * This bypasses geo-blocked job boards and finds the REAL company career page
 */
export function generateCompanyCareerSearchUrl(
  companyName: string,
  jobTitle: string,
  location?: string
): string {
  // Clean company name (remove common suffixes)
  const cleanCompany = companyName
    .replace(/\s+(Inc|LLC|Ltd|Limited|Corp|Corporation|Company|Co\.|GmbH|PLC)\.?$/i, '')
    .trim();
  
  // Build search query: "Company Name careers Job Title location"
  const searchTerms = [
    cleanCompany,
    'careers',
    jobTitle,
    location
  ].filter(Boolean).join(' ');
  
  const encodedQuery = encodeURIComponent(searchTerms);
  
  return `https://www.google.com/search?q=${encodedQuery}`;
}

/**
 * Generate direct company website guess (common patterns)
 */
export function guessCompanyWebsite(companyName: string): string {
  // Clean company name for domain
  const cleanName = companyName
    .toLowerCase()
    .replace(/\s+(inc|llc|ltd|limited|corp|corporation|company|co\.|gmbh|plc)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  
  // Try common domain pattern
  return `https://www.${cleanName}.com/careers`;
}

/**
 * Generate LinkedIn company search URL
 */
export function generateLinkedInCompanySearch(
  companyName: string,
  jobTitle: string
): string {
  const searchQuery = encodeURIComponent(`${companyName} ${jobTitle}`);
  return `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;
}

/**
 * Generate Indeed company search URL
 */
export function generateIndeedCompanySearch(
  companyName: string,
  jobTitle: string,
  location?: string
): string {
  const query = encodeURIComponent(jobTitle);
  const where = location ? encodeURIComponent(location) : '';
  const company = encodeURIComponent(companyName);
  
  return `https://www.indeed.com/jobs?q=${query}&l=${where}&fromage=7&vjk=${company}`;
}

/**
 * Get best career page URL for external job
 * Priority: Google Search (most reliable) > LinkedIn > Indeed
 */
export function getBestCareerPageUrl(job: {
  company: string;
  title: string;
  location?: string;
  source_url?: string;
}): {
  primary: string;
  label: string;
  alternatives: Array<{ url: string; label: string }>;
} {
  const googleSearchUrl = generateCompanyCareerSearchUrl(job.company, job.title, job.location);
  const linkedInUrl = generateLinkedInCompanySearch(job.company, job.title);
  const indeedUrl = generateIndeedCompanySearch(job.company, job.title, job.location);
  const companyWebsiteGuess = guessCompanyWebsite(job.company);
  
  return {
    primary: googleSearchUrl,
    label: `Search ${job.company} Careers`,
    alternatives: [
      { url: linkedInUrl, label: 'Find on LinkedIn' },
      { url: indeedUrl, label: 'Find on Indeed' },
      { url: companyWebsiteGuess, label: 'Visit Company Website (Guess)' }
    ]
  };
}

export default {
  generateCompanyCareerSearchUrl,
  guessCompanyWebsite,
  generateLinkedInCompanySearch,
  generateIndeedCompanySearch,
  getBestCareerPageUrl
};

