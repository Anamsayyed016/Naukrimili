import { getSerpApiService } from './serpapi-service';
import { AdzunaService } from './adzuna-service';
import { getReedService } from './reed-service';
import { sampleIndianJobs } from './sample-indian-jobs';
import axios from 'axios';

export interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salaryFormatted?: string;
  timeAgo?: string;
  redirect_url: string;
  isUrgent?: boolean;
  isRemote?: boolean;
  jobType?: string;
  source: 'live' | 'sample';
  apply_url?: string;
  company_logo?: string;
  posted_date?: string;
  requirements?: string[];
  benefits?: string[];
}

export interface JobSearchParams {
  query: string;
  location?: string;
  jobType?: 'full_time' | 'part_time' | 'contract' | 'internship';
  datePosted?: 'today' | 'yesterday' | 'week' | 'month' | 'all';
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  page?: number;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: UnifiedJob[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  googleUrl?: string; // Added for Google search URL
}

class UnifiedJobService {
  private cache = new Map<string, { data: JobSearchResponse; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(params: JobSearchParams): string {
    return JSON.stringify(params);
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  async searchJobs(params: JobSearchParams): Promise<JobSearchResponse> {
    console.log('🔍 Unified job search starting:', params);
    
    const cacheKey = this.getCacheKey(params);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('📱 Returning cached results:', cached.data.total);
      return cached.data;
    }

    try {
      // Priority 1: Fetch from our own backend DB
      const dbResults = await this.fetchFromBackendDB(params);
      if (dbResults.jobs.length > 0) {
        console.log('✅ Backend DB success:', dbResults.total, 'jobs found');
        this.cache.set(cacheKey, { data: dbResults, timestamp: Date.now() });
        return dbResults;
      }
    } catch (dbError) {
      console.warn('❌ Backend DB fetch failed, falling back to external APIs...', dbError);
    }

    try {
      // Priority 2: Fetch from external APIs if DB is empty or fails
      const results = await this.fetchFromMultipleSources(params);
      
      console.log('✅ External APIs success:', results.total, 'jobs found');
      
      this.cache.set(cacheKey, { data: results, timestamp: Date.now() });
      if (results.jobs.length > 0) {
        return results;
      }
    } catch (error) {
      console.error('❌ All external APIs failed:', error);
    }

    // Priority 3: Return sample data as a last resort
    console.log('🔄 Returning sample data as final fallback...');
    const sampleResults = this.getSampleJobs(params);
    if (sampleResults.jobs.length > 0) {
      return sampleResults;
    }

    // Priority 4: If still no jobs, return a Google search URL
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(params.query + ' jobs ' + (params.location || ''))}`;
    return {
      jobs: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
      googleUrl,
    } as any;
  }

  private async fetchFromMultipleSources(params: JobSearchParams): Promise<JobSearchResponse> {
    const jobs: UnifiedJob[] = [];
    
    // Primary: SerpApi (Google Jobs) - Only if API key is available
    if (process.env.SERPAPI_KEY) {
      try {
        console.log('🔍 Trying SerpApi...');
        const serpApiJobs = await this.fetchSerpApiJobs(params);
        jobs.push(...serpApiJobs);
        console.log(`✅ SerpApi: ${serpApiJobs.length} jobs found`);
      } catch (error) {
        console.warn('❌ SerpApi fetch failed:', error);
      }
    } else {
      console.log('⚠️ SerpApi key not configured, skipping...');
    }

    // Secondary: Adzuna (if available)
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY) {
      try {
        console.log('🔍 Trying Adzuna...');
        const adzunaJobs = await this.fetchAdzunaJobs(params);
        jobs.push(...adzunaJobs);
        console.log(`✅ Adzuna: ${adzunaJobs.length} jobs found`);
      } catch (error) {
        console.warn('❌ Adzuna fetch failed:', error);
      }
    } else {
      console.log('⚠️ Adzuna keys not configured, skipping...');
    }

    // Additional: Reed API (if available)
    if (process.env.REED_API_KEY) {
      try {
        console.log('🔍 Trying Reed API...');
        const reedService = getReedService();
        const reedJobs = await reedService.searchFormattedJobs({
          keywords: params.query,
          locationName: this.formatLocationForReed(params.location),
          minimumSalary: params.salaryMin,
          maximumSalary: params.salaryMax,
          resultsToTake: 50
        });
        jobs.push(...reedJobs.jobs.map(job => ({
          id: `reed_${job.id}`,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          salaryFormatted: job.salary,
          timeAgo: job.datePosted,
          redirect_url: job.url,
          apply_url: job.url,
          isUrgent: false,
          isRemote: job.remote,
          jobType: job.type || 'Full-time',
          source: 'live' as const,
          posted_date: job.datePosted
        })));
        console.log(`✅ Reed API: ${reedJobs.jobs.length} jobs found`);
      } catch (error) {
        console.warn('❌ Reed API fetch failed:', error);
      }
    } else {
      console.log('⚠️ Reed API key not configured, skipping...');
    }

    // If no live jobs found from external sources, throw an error to trigger sample data
    if (jobs.length === 0) {
      throw new Error('No jobs found from any external API source.');
    }

    // Sort by relevance and remove duplicates
    const uniqueJobs = this.deduplicateJobs(jobs);
    const sortedJobs = this.sortJobs(uniqueJobs, params);

    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      jobs: sortedJobs.slice(startIndex, endIndex),
      total: sortedJobs.length,
      page,
      totalPages: Math.ceil(sortedJobs.length / limit),
      hasMore: endIndex < sortedJobs.length
    };
  }

  private async fetchSerpApiJobs(params: JobSearchParams): Promise<UnifiedJob[]> {
    const serpApiService = getSerpApiService();
    
    // Enhance location for better Indian results
    const enhancedLocation = this.enhanceLocationForSearch(params.location);
    
    const searchParams = {
      query: params.query,
      location: enhancedLocation,
      ...(params.jobType && { jobType: params.jobType }),
      ...(params.datePosted && { datePosted: params.datePosted }),
      num: 50 // Get more results for better variety
    };

    const result = await serpApiService.searchJobs(searchParams);
    
    if (result.error) {
      throw new Error(result.error);
    }

    return (result.jobs || []).map(job => ({
      id: `serp_${job.id}`,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salaryFormatted: job.salaryFormatted,
      timeAgo: job.timeAgo || 'Recently posted',
      redirect_url: job.redirect_url,
      apply_url: job.redirect_url,
      isUrgent: job.isUrgent || false,
      isRemote: job.isRemote || params.remote || false,
      jobType: job.jobType || 'Full-time',
      source: 'live' as const,
      posted_date: job.timeAgo
    }));
  }

  private async fetchAdzunaJobs(params: JobSearchParams): Promise<UnifiedJob[]> {
    try {
      const adzunaService = new AdzunaService({
        appId: process.env.ADZUNA_APP_ID!,
        apiKey: process.env.ADZUNA_API_KEY!,
        country: 'in' // Focus on India
      });

      const searchParams = {
        what: params.query,
        where: this.enhanceLocationForSearch(params.location),
        results_per_page: 30,
        ...(params.salaryMin && { salary_min: params.salaryMin }),
        ...(params.salaryMax && { salary_max: params.salaryMax })
      };

      const result = await adzunaService.searchJobs(searchParams);

      return (result.results || []).map(job => ({
        id: `adzuna_${job.id}`,
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        description: AdzunaService.cleanJobDescription(job.description),
        salaryFormatted: job.salary_min || job.salary_max 
          ? `₹${((job.salary_min || 0) / 100000).toFixed(1)}L - ₹${((job.salary_max || 0) / 100000).toFixed(1)}L` 
          : undefined,
        timeAgo: AdzunaService.getRelativeTime(job.created),
        redirect_url: job.redirect_url,
        apply_url: job.redirect_url,
        isUrgent: false,
        isRemote: job.contract_type?.toLowerCase().includes('remote') || false,
        jobType: job.contract_type || 'Full-time',
        source: 'live' as const,
        posted_date: job.created
      }));
    } catch (error) {
      console.warn('Adzuna API error:', error);
      return [];
    }
  }

  private async fetchFromBackendDB(params: JobSearchParams): Promise<JobSearchResponse> {
    // Use the upgraded search endpoint
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/api/jobs/search';
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('q', params.query);
    if (params.location) queryParams.append('location', params.location);
    if (params.jobType) queryParams.append('type', params.jobType); // 'type' matches backend controller
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = `${backendUrl}?${queryParams.toString()}`;
    console.log(`📡 Fetching from backend DB: ${url}`);

    const response = await axios.get(url);

    if (!response.data || !response.data.success) {
      throw new Error('Backend API returned an error or unsuccessful status');
    }

    const jobs = (response.data.jobs || []).map((job: any) => ({
      id: `db_${job._id || job.id}`,
      title: job.title,
      company: typeof job.company === 'object' && job.company !== null ? job.company.name : 'N/A',
      location: job.location && job.location.city ? job.location.city : 'N/A',
      description: job.description,
      salaryFormatted: job.salary && job.salary.min && job.salary.max ? `₹${job.salary.min} - ₹${job.salary.max}` : '',
      timeAgo: job.postedDate || job.createdAt,
      redirect_url: `/jobs/${job._id || job.id}`, // Link to internal job page
      isUrgent: job.isUrgent || false,
      isRemote: job.location && job.location.isRemote,
      jobType: job.jobType,
      source: 'live',
      apply_url: `/jobs/${job._id || job.id}`, // Link to internal job page
      company_logo: typeof job.company === 'object' && job.company !== null && job.company.logo ? job.company.logo : '/placeholder-logo.png',
      posted_date: job.createdAt,
      requirements: job.requirements,
      benefits: job.benefits
    }));
    const { page, total, totalPages, hasMore } = response.data.pagination || {
      page: params.page || 1,
      total: jobs.length,
      totalPages: 1,
      hasMore: false,
    };

    return {
      jobs,
      total,
      page,
      totalPages,
      hasMore,
    };
  }

  private enhanceLocationForSearch(location?: string): string {
    if (!location) return 'India';
    
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 
      'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida', 'Kochi', 'Indore',
      'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Visakhapatnam', 'Patna',
      'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad'
    ];

    // Check if it's an Indian city and enhance the search
    const isIndianCity = indianCities.some(city => 
      location.toLowerCase().includes(city.toLowerCase())
    );

    if (isIndianCity) {
      return `${location}, India`;
    }

    // If it's just "India", add some popular cities for better results
    if (location.toLowerCase() === 'india') {
      return 'Mumbai, Delhi, Bangalore, India';
    }

    return location;
  }

  private formatLocationForReed(location?: string): string | undefined {
    if (!location) return undefined;
    
    // Reed API works best with UK locations, but we can try Indian cities
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 
      'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida', 'Kochi', 'Indore'
    ];

    // If it's an Indian city, try to find similar UK cities or return undefined
    const isIndianCity = indianCities.some(city => 
      location.toLowerCase().includes(city.toLowerCase())
    );

    if (isIndianCity) {
      // For Indian cities, we might not get good results from Reed, so return undefined
      // This will search UK-wide which might have some relevant remote jobs
      return undefined;
    }

    return location;
  }

  private getSampleJobs(params: JobSearchParams): JobSearchResponse {
    let filteredJobs = sampleIndianJobs;

    // Apply filters to sample data
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.display_name.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }

    if (params.location) {
      const location = params.location.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.location.display_name.toLowerCase().includes(location)
      );
    }

    if (params.jobType) {
      filteredJobs = filteredJobs.filter(job => 
        job.contract_type?.toLowerCase() === params.jobType?.replace('_', '-')
      );
    }

    // Convert to unified format
    const unifiedJobs: UnifiedJob[] = filteredJobs.map(job => ({
      id: `sample_${job.id}`,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      salaryFormatted: `₹${(job.salary_min / 100000).toFixed(1)}L - ₹${(job.salary_max / 100000).toFixed(1)}L`,
      timeAgo: AdzunaService.getRelativeTime(job.created),
      redirect_url: `/jobs/sample/${job.id}`,
      apply_url: `/jobs/sample/${job.id}`,
      isUrgent: job.isUrgent || false,
      isRemote: job.isRemote || false,
      jobType: job.contract_type || 'Full-time',
      source: 'sample' as const,
      posted_date: job.created
    }));

    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      jobs: unifiedJobs.slice(startIndex, endIndex),
      total: unifiedJobs.length,
      page,
      totalPages: Math.ceil(unifiedJobs.length / limit),
      hasMore: endIndex < unifiedJobs.length
    };
  }

  private deduplicateJobs(jobs: UnifiedJob[]): UnifiedJob[] {
    const seen = new Set<string>();
    const unique: UnifiedJob[] = [];

    for (const job of jobs) {
      // Create a signature based on title and company
      const signature = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
      
      if (!seen.has(signature)) {
        seen.add(signature);
        unique.push(job);
      }
    }

    return unique;
  }

  private sortJobs(jobs: UnifiedJob[], params: JobSearchParams): UnifiedJob[] {
    return jobs.sort((a, b) => {
      // Prioritize live jobs over sample jobs
      if (a.source === 'live' && b.source === 'sample') return -1;
      if (a.source === 'sample' && b.source === 'live') return 1;

      // Then sort by urgency
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;

      // Then by relevance (job title match)
      if (params.query) {
        const queryLower = params.query.toLowerCase();
        const aRelevance = a.title.toLowerCase().includes(queryLower) ? 1 : 0;
        const bRelevance = b.title.toLowerCase().includes(queryLower) ? 1 : 0;
        if (aRelevance !== bRelevance) return bRelevance - aRelevance;
      }

      // Finally by recency (assuming more recent first)
      return 0; // Keep original order if no other criteria apply
    });
  }

  // Clear cache method for testing/debugging
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Get API status for debugging
  getApiStatus(): {
    serpApi: boolean;
    adzuna: boolean;
    reed: boolean;
  } {
    return {
      serpApi: !!process.env.SERPAPI_KEY,
      adzuna: !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY),
      reed: !!process.env.REED_API_KEY
    };
  }
}

// Export singleton instance
export const unifiedJobService = new UnifiedJobService();
export default unifiedJobService;
