/**
 * Google Search Service
 * Provides fallback search functionality using Google Jobs when no results are found
 */

export interface GoogleSearchParams {
  query: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  remote?: boolean;
  salary?: string;
  company?: string;
  skills?: string[];
}

export interface GoogleSearchResult {
  success: boolean;
  results: GoogleJobResult[];
  totalResults: number;
  searchUrl: string;
  alternativePlatforms: AlternativePlatform[];
  message?: string;
  error?: string;
}

export interface GoogleJobResult {
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobType?: string;
  postedDate?: string;
  url: string;
  source: 'google' | 'linkedin' | 'indeed' | 'naukri';
}

export interface AlternativePlatform {
  name: string;
  url: string;
  icon: string;
  description: string;
}

export class GoogleSearchService {
  private readonly GOOGLE_JOBS_BASE = 'https://www.google.com/search';
  private readonly GOOGLE_JOBS_PARAMS = '&ibp=htl;jobs';
  
  /**
   * Generate Google Jobs search URL
   */
  private generateGoogleJobsUrl(params: GoogleSearchParams): string {
    const searchTerms: string[] = [];
    
    // Add main query
    searchTerms.push(params.query);
    
    // Add job type
    if (params.jobType && params.jobType !== 'all') {
      searchTerms.push(params.jobType);
    }
    
    // Add experience level
    if (params.experienceLevel && params.experienceLevel !== 'all') {
      searchTerms.push(params.experienceLevel);
    }
    
    // Add remote indicator
    if (params.remote) {
      searchTerms.push('remote');
    }
    
    // Add salary expectation
    if (params.salary) {
      searchTerms.push(params.salary);
    }
    
    // Add company preference
    if (params.company) {
      searchTerms.push(params.company);
    }
    
    // Add skills
    if (params.skills && params.skills.length > 0) {
      searchTerms.push(params.skills.join(' '));
    }
    
    // Build location string
    let locationString = 'India';
    if (params.location && params.location !== 'All Locations') {
      locationString = params.location;
    }
    
    // Combine search terms
    const searchQuery = searchTerms.join(' ');
    const fullQuery = `${searchQuery} jobs in ${locationString}`;
    
    return `${this.GOOGLE_JOBS_BASE}?q=${encodeURIComponent(fullQuery)}${this.GOOGLE_JOBS_PARAMS}`;
  }

  /**
   * Generate alternative platform URLs
   */
  private generateAlternativePlatforms(params: GoogleSearchParams): AlternativePlatform[] {
    const searchQuery = params.query;
    const location = params.location && params.location !== 'All Locations' ? params.location : 'India';
    
    return [
      {
        name: 'LinkedIn',
        url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`,
        icon: 'linkedin',
        description: 'Professional networking and job search'
      },
      {
        name: 'Indeed',
        url: `https://indeed.co.in/jobs?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(location)}`,
        icon: 'indeed',
        description: 'World\'s largest job site'
      },
      {
        name: 'Naukri',
        url: `https://www.naukri.com/jobs-in-${encodeURIComponent(location)}?k=${encodeURIComponent(searchQuery)}`,
        icon: 'naukri',
        description: 'India\'s leading job portal'
      },
      {
        name: 'Monster',
        url: `https://www.monsterindia.com/search/${encodeURIComponent(searchQuery)}-jobs-in-${encodeURIComponent(location)}`,
        icon: 'monster',
        description: 'Find your dream job'
      },
      {
        name: 'Glassdoor',
        url: `https://www.glassdoor.co.in/Job/${encodeURIComponent(location)}-${encodeURIComponent(searchQuery)}-jobs-SRCH_IL.0,6_IC1147401_KO7,${searchQuery.length + 6}.htm`,
        icon: 'glassdoor',
        description: 'Jobs, salaries, and company reviews'
      }
    ];
  }

  /**
   * Perform Google Jobs search fallback
   */
  async searchGoogleJobs(params: GoogleSearchParams): Promise<GoogleSearchResult> {
    try {
      // Generate Google Jobs URL
      const googleJobsUrl = this.generateGoogleJobsUrl(params);
      
      // Generate alternative platform URLs
      const alternativePlatforms = this.generateAlternativePlatforms(params);
      
      // Create a comprehensive search result
      const result: GoogleSearchResult = {
        success: true,
        results: [], // Google doesn't provide direct API access, so we redirect
        totalResults: 0,
        searchUrl: googleJobsUrl,
        alternativePlatforms,
        message: `No jobs found on our platform. We've prepared a Google Jobs search for "${params.query}" in ${params.location || 'India'}.`
      };

      return result;
      
    } catch (error) {
      console.error('Google search service error:', error);
      
      return {
        success: false,
        results: [],
        totalResults: 0,
        searchUrl: '',
        alternativePlatforms: [],
        error: 'Failed to generate Google search fallback'
      };
    }
  }

  /**
   * Check if search should trigger Google fallback
   */
  shouldTriggerFallback(jobCount: number, searchParams: GoogleSearchParams): boolean {
    // Trigger fallback if no jobs found or very few results
    if (jobCount === 0) return true;
    
    // Trigger fallback if less than 3 jobs found for broad searches
    if (jobCount < 3 && searchParams.query.length > 3) return true;
    
    // Trigger fallback if location-specific search returns no results
    if (jobCount === 0 && searchParams.location && searchParams.location !== 'All Locations') return true;
    
    return false;
  }

  /**
   * Get enhanced search suggestions
   */
  getSearchSuggestions(query: string, location: string): string[] {
    const suggestions: string[] = [];
    
    // Common job title variations
    if (query.toLowerCase().includes('developer')) {
      suggestions.push('Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer');
    }
    
    if (query.toLowerCase().includes('manager')) {
      suggestions.push('Project Manager', 'Product Manager', 'Team Lead', 'Senior Manager');
    }
    
    if (query.toLowerCase().includes('analyst')) {
      suggestions.push('Data Analyst', 'Business Analyst', 'Financial Analyst', 'Systems Analyst');
    }
    
    // Location-based suggestions
    if (location && location !== 'All Locations') {
      suggestions.push(`Remote ${query}`, `Hybrid ${query}`, `${query} in nearby cities`);
    }
    
    // Skill-based suggestions
    if (query.toLowerCase().includes('react')) {
      suggestions.push('JavaScript Developer', 'Frontend Developer', 'UI Developer', 'Web Developer');
    }
    
    if (query.toLowerCase().includes('python')) {
      suggestions.push('Data Scientist', 'Backend Developer', 'Machine Learning Engineer', 'DevOps Engineer');
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate smart search queries
   */
  generateSmartQueries(originalQuery: string, location: string): string[] {
    const queries: string[] = [];
    
    // Original query
    queries.push(originalQuery);
    
    // Broader variations
    if (originalQuery.includes(' ')) {
      const words = originalQuery.split(' ');
      if (words.length > 1) {
        queries.push(words[0]); // First word only
        queries.push(words.slice(0, 2).join(' ')); // First two words
      }
    }
    
    // Common synonyms
    const synonyms: { [key: string]: string[] } = {
      'developer': ['programmer', 'coder', 'software engineer'],
      'manager': ['lead', 'supervisor', 'coordinator'],
      'analyst': ['specialist', 'consultant', 'expert'],
      'engineer': ['developer', 'technician', 'specialist']
    };
    
    for (const [word, syns] of Object.entries(synonyms)) {
      if (originalQuery.toLowerCase().includes(word)) {
        syns.forEach(syn => {
          queries.push(originalQuery.toLowerCase().replace(word, syn));
        });
      }
    }
    
    // Location-specific variations
    if (location && location !== 'All Locations') {
      queries.push(`${originalQuery} near me`);
      queries.push(`${originalQuery} ${location} area`);
    }
    
    return [...new Set(queries)].slice(0, 8); // Remove duplicates and limit
  }
}

export default GoogleSearchService;
