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

    // Only return sample/mock data as fallback
    console.log('🔄 Returning sample data as final fallback...');
    const sampleResults = this.getSampleJobs(params);
    if (sampleResults.jobs.length > 0) {
      return sampleResults;
    }

    // If still no jobs, return a Google search URL
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
