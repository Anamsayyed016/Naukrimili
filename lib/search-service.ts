import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SERPAPI_BASE_URL = process.env.SERPAPI_BASE_URL || 'https://serpapi.com/search';
const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

export interface JobSearchParams {
  q?: string;
  location?: string;
  company?: string;
  country?: string;
  job_type?: string;
  experience_level?: string;
  sector?: string;
  remote?: boolean;
  hybrid?: boolean;
  featured?: boolean;
  urgent?: boolean;
  salary_min?: number;
  salary_max?: number;
  skills?: string[];
  date_posted?: 'today' | 'week' | 'month' | 'all';
  page?: number;
  limit?: number;
  sort_by?: string; // relevance | date | postedAt | salary_min | salary_max | company | title | featured | urgent
  sort_order?: 'asc' | 'desc';
}

export class SearchService {
  async searchJobs(params: JobSearchParams) {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs`, {
        params: {
          ...params,
          // Normalise booleans to string for URL compatibility
          remote: params.remote?.toString(),
          hybrid: params.hybrid?.toString(),
          featured: params.featured?.toString(),
          urgent: params.urgent?.toString(),
          skills: params.skills?.join(','),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching jobs: ', error);
      throw error;
    }
  }
}

export async function getJobDetails(jobId: string) {
  try {
    const response = await axios.get(`${SERPAPI_BASE_URL}`, {
      params: { engine: 'google_jobs_listing', q: jobId, api_key: SERPAPI_KEY },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching job details from SerpApi: ', error);
    throw error;
  }
}