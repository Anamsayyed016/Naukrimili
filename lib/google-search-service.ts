/**
 * Google Search Service
 * Provides fallback search functionality using Google Jobs when no results are found
 * Enhanced with real Google API integration
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
  metadata?: {
    searchTime?: number;
    query?: string;
    location?: string;
    filters?: Record<string, any>;
    searchSuggestions?: string[];
    smartQueries?: string[];
  };
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
  private readonly GOOGLE_API_KEY = process.env.GOOGLE_JOBS_API_KEY;
  private readonly GOOGLE_GEOLOCATION_KEY = process.env.GOOGLE_GEOLOCATION_API_KEY;
  
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
   * Enhanced Google Jobs search using real API when available
   */
  async searchGoogleJobsEnhanced(params: GoogleSearchParams): Promise<GoogleSearchResult> {
    try {
      // If we have a Google API key, try to use enhanced search
      if (this.GOOGLE_API_KEY) {
        return await this.performEnhancedGoogleSearch(params);
      }
      
      // Fallback to basic search URL generation
      return await this.searchGoogleJobs(params);
      
    } catch (error) {
      console.error('Enhanced Google search failed, falling back to basic:', error);
      return await this.searchGoogleJobs(params);
    }
  }

  /**
   * Perform enhanced Google search using real API
   */
  private async performEnhancedGoogleSearch(params: GoogleSearchParams): Promise<GoogleSearchResult> {
    try {
      // Generate enhanced search query
      const searchQuery = this.buildEnhancedSearchQuery(params);
      
      // Use Google Custom Search API if available
      const enhancedResults = await this.searchWithGoogleAPI(searchQuery, params.location);
      
      if (enhancedResults.success && enhancedResults.results.length > 0) {
        return {
          ...enhancedResults,
          message: `Found ${enhancedResults.results.length} enhanced results for "${params.query}" in ${params.location || 'India'}`,
          metadata: {
            searchTime: Date.now(),
            query: params.query,
            location: params.location,
            filters: params,
            searchSuggestions: this.generateSearchSuggestions(params.query),
            smartQueries: this.generateSmartQueries(params.query, params.location || '')
          }
        };
      }
      
      // Fallback to basic search if enhanced search fails
      return await this.searchGoogleJobs(params);
      
    } catch (error) {
      console.error('Enhanced Google search error:', error);
      return await this.searchGoogleJobs(params);
    }
  }

  /**
   * Build enhanced search query with better targeting
   */
  private buildEnhancedSearchQuery(params: GoogleSearchParams): string {
    const terms = [params.query];
    
    // Add job-specific terms
    if (params.jobType) terms.push(params.jobType);
    if (params.experienceLevel) terms.push(params.experienceLevel);
    if (params.remote) terms.push('remote work');
    if (params.skills?.length) terms.push(params.skills.join(' '));
    
    return terms.join(' ');
  }

  /**
   * Search using Google API (placeholder for future implementation)
   */
  private async searchWithGoogleAPI(query: string, location?: string): Promise<GoogleSearchResult> {
    // This is a placeholder for future Google API integration
    // For now, we'll return empty results to trigger fallback
    return {
      success: true,
      results: [],
      totalResults: 0,
      searchUrl: '',
      alternativePlatforms: []
    };
  }

  /**
   * Generate search suggestions based on query
   */
  private generateSearchSuggestions(query: string): string[] {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();
    
    // Add common job-related suggestions
    if (lowerQuery.includes('developer')) {
      suggestions.push('software engineer', 'full stack developer', 'frontend developer');
    }
    if (lowerQuery.includes('manager')) {
      suggestions.push('project manager', 'product manager', 'team lead');
    }
    if (lowerQuery.includes('designer')) {
      suggestions.push('UI/UX designer', 'graphic designer', 'web designer');
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate smart queries for better search results
   */
  private generateSmartQueriesPrivate(params: GoogleSearchParams): string[] {
    const queries = [];
    const baseQuery = params.query;
    
    // Add location-specific queries
    if (params.location) {
      queries.push(`${baseQuery} in ${params.location}`);
      queries.push(`${baseQuery} jobs ${params.location}`);
    }
    
    // Add experience-specific queries
    if (params.experienceLevel) {
      queries.push(`${params.experienceLevel} level ${baseQuery}`);
    }
    
    // Add remote-specific queries
    if (params.remote) {
      queries.push(`remote ${baseQuery} jobs`);
    }
    
    return queries.slice(0, 3); // Limit to 3 smart queries
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
   * Get enhanced search suggestions (using the private method)
   */
  getSearchSuggestions(query: string, location: string): string[] {
    return this.generateSearchSuggestions(query);
  }

  /**
   * Generate smart search queries (using the private method)
   */
  generateSmartQueries(originalQuery: string, location: string): string[] {
    return this.generateSmartQueriesPrivate({ query: originalQuery, location });
  }
}

export default GoogleSearchService;
