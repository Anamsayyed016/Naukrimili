import axios from 'axios';
import type { APIJobResponse, APIJobSearchResponse, APIErrorResponse } from '@/types/api-response';

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
  private readonly API_BASE_URL = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:8000';
  
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
      console.error('Error searching jobs:', error);
      throw handleAPIError(error);
    }
  }

  async getJobById(jobId: string): Promise<UnifiedJob | null> {
    try {
      const response = await axios.get<APIJobResponse>(`${this.API_BASE_URL}/api/jobs/${jobId}`);
      return this.mapToUnifiedJob(response.data);
    } catch (error) {
      console.error('Error getting job details:', error);
      throw handleAPIError(error);
    }
  }

  private mapToUnifiedJob(job: APIJobResponse): UnifiedJob {
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      salaryFormatted: job.salary_formatted,
      timeAgo: job.time_ago,
      redirect_url: `/jobs/${job.id}`,
      isUrgent: job.is_urgent,
      isRemote: job.is_remote,
      jobType: job.job_type,
      source: 'live',
      apply_url: job.apply_url,
      company_logo: job.company_logo,
      posted_date: job.posted_date,
      requirements: job.requirements,
      benefits: job.benefits
    };
  }
}

// Export singleton instance
export const unifiedJobService = new UnifiedJobService();
export default unifiedJobService;
