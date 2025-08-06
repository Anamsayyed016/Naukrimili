import axios from 'axios';
import type { APIJobResponse, APIJobSearchResponse } from '@/types/api-response';
import { safeLogger } from '@/lib/safe-logger';

// ===== UNIFIED JOB INTERFACES =====
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
  source: 'live' | 'sample' | 'adzuna' | 'reed' | 'indeed';
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
  googleUrl?: string;
}

// ===== ADZUNA API SERVICE =====
export class AdzunaJobService {
  private readonly APP_ID = process.env.ADZUNA_APP_ID;
  private readonly API_KEY = process.env.ADZUNA_API_KEY;
  private readonly BASE_URL = 'https://api.adzuna.com/v1/api/jobs';

  async searchJobs(query: string, location: string = 'india', page: number = 1) {
    try {
      const response = await axios.get(`${this.BASE_URL}/in/search/${page}`, {
        params: {
          app_id: this.APP_ID,
          app_key: this.API_KEY,
          what: query,
          where: location,
          results_per_page: 20,
          sort_by: 'relevance'
        }
      });

      return {
        jobs: response.data.results.map((job: Record<string, unknown>) => ({
          id: job.id,
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          description: job.description,
          salaryFormatted: job.salary_min ? `₹${Math.round(job.salary_min/100000)}L - ₹${Math.round(job.salary_max/100000)}L` : 'Not specified',
          redirect_url: job.redirect_url,
          posted_date: job.created,
          source: 'adzuna' as const
        })),
        total: response.data.count
      };
    } catch (error) {
      safeLogger.error('Adzuna API error', {
        code: 'ADZUNA_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        query,
        location
      });
      throw error;
    }
  }
}

// ===== REED API SERVICE =====
export class ReedJobService {
  private readonly API_KEY = process.env.REED_API_KEY;
  private readonly BASE_URL = 'https://www.reed.co.uk/api/1.0/search';

  async searchJobs(query: string, location: string) {
    try {
      const response = await axios.get(this.BASE_URL, {
        headers: {
          'Authorization': `Basic ${Buffer.from(this.API_KEY + ':').toString('base64')}`
        },
        params: {
          keywords: query,
          location: location,
          resultsToTake: 20
        }
      });

      return {
        jobs: response.data.results.map((job: Record<string, unknown>) => ({
          id: job.jobId,
          title: job.jobTitle,
          company: job.employerName,
          location: job.locationName,
          description: job.jobDescription,
          salaryFormatted: job.minimumSalary ? `£${job.minimumSalary} - £${job.maximumSalary}` : 'Not specified',
          redirect_url: job.jobUrl,
          source: 'reed' as const
        })),
        total: response.data.totalResults
      };
    } catch (error) {
      safeLogger.error('Reed API error', {
        code: 'REED_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        query,
        location
      });
      throw error;
    }
  }
}

// ===== INDEED API SERVICE =====
export class IndeedJobService {
  private readonly API_KEY = process.env.INDEED_API_KEY;
  
  async searchJobs(_query: string, _location: string) {
    // Indeed API implementation
    // Note: Indeed has restricted API access
    return { jobs: [], total: 0 };
  }
}

// ===== UNIFIED JOB SERVICE =====
class UnifiedJobService {
  private readonly API_BASE_URL = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:8000';
  private adzuna = new AdzunaJobService();
  private reed = new ReedJobService();
  private indeed = new IndeedJobService();
  
  getApiStatus() {
    return { status: 'active', endpoint: this.API_BASE_URL };
  }
  
  getCacheStats() {
    return { cached: 0, total: 0, hitRate: 0 };
  }
  
  clearCache() {
    return Promise.resolve({ cleared: true });
  }
  
  async searchJobs(params: JobSearchParams): Promise<{ jobs: UnifiedJob[]; total: number }> {
    try {
      const response = await axios.get<APIJobSearchResponse>(`${this.API_BASE_URL}/api/jobs/search`, {
        params: {
          q: params.query,
          location: params.location,
          type: params.jobType,
          posted: params.datePosted,
          salary_min: params.salaryMin,
          salary_max: params.salaryMax,
          page: params.page || 1,
          limit: params.limit || 10
        }
      });

      return {
        jobs: response.data.jobs.map(this.mapToUnifiedJob.bind(this)),
        total: response.data.total
      };
    } catch (error) {
      safeLogger.error('Error searching jobs', {
        code: 'UNIFIED_JOB_SEARCH_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        params: {
          query: params.query,
          location: params.location
        }
      });
      throw this.handleAPIError(error);
    }
  }

  async getJobById(jobId: string): Promise<UnifiedJob | null> {
    try {
      const response = await axios.get<APIJobResponse>(`${this.API_BASE_URL}/api/jobs/${jobId}`);
      return this.mapToUnifiedJob(response.data);
    } catch (error) {
      safeLogger.error('Error getting job details', {
        code: 'JOB_DETAILS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        jobId
      });
      throw this.handleAPIError(error);
    }
  }

  // Multi-source job search
  async searchJobsMultiSource(query: string, location: string, page: number = 1): Promise<{ jobs: UnifiedJob[]; total: number; sources: string[] }> {
    const results: UnifiedJob[] = [];
    const sources: string[] = [];
    
    try {
      // Try Adzuna first (India focused)
      const adzunaResults = await this.adzuna.searchJobs(query, location, page);
      results.push(...adzunaResults.jobs);
      sources.push('adzuna');
    } catch (error) {
      safeLogger.warn('Adzuna API failed', {
        code: 'ADZUNA_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        query,
        location
      });
    }

    try {
      // Try Reed for additional results
      const reedResults = await this.reed.searchJobs(query, location);
      results.push(...reedResults.jobs.slice(0, 10)); // Limit Reed results
      sources.push('reed');
    } catch (error) {
      safeLogger.warn('Reed API failed', {
        code: 'REED_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        query,
        location
      });
    }

    return {
      jobs: results,
      total: results.length,
      sources
    };
  }

  private mapToUnifiedJob(job: APIJobResponse): UnifiedJob {
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salaryFormatted: job.salary?.formatted,
      timeAgo: undefined, // Not available in API response
      redirect_url: `/jobs/${job.id}`,
      isUrgent: job.is_urgent,
      isRemote: job.is_remote,
      jobType: job.type,
      source: 'live',
      apply_url: job.apply_url,
      company_logo: job.company_logo,
      posted_date: job.posted_date,
      requirements: job.requirements,
      benefits: job.benefits
    };
  }

  private handleAPIError(error: Record<string, unknown>): Error {
    if (axios.isAxiosError(error)) {
      return new Error(error.response?.data?.message || error.message);
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }
}

// ===== EXPORTS =====
export const unifiedJobService = new UnifiedJobService();
export default unifiedJobService;

// Export individual services for specific use cases
// export { AdzunaJobService, ReedJobService, IndeedJobService };
