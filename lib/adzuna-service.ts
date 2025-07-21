import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AdzunaApiConfig,
  AdzunaSearchResponse,
  AdzunaSearchParams,
  AdzunaCategoriesResponse,
  AdzunaHistogramResponse,
  AdzunaTopCompaniesResponse,
  AdzunaGeoLocationResponse,
  AdzunaError,
  AdzunaCountry
} from '../types/adzuna';

export class AdzunaService {
  private client: AxiosInstance;
  private config: AdzunaApiConfig;

  constructor(config: AdzunaApiConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.adzuna.com'
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JobPortal/1.0'
      }
    });

    // Add request interceptor to include API credentials
    this.client.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        app_id: this.config.appId,
        app_key: this.config.apiKey
      };
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.data) {
          const adzunaError: AdzunaError = error.response.data;
          throw new Error(`Adzuna API Error: ${adzunaError.exception}`);
        }
        throw error;
      }
    );
  }

  /**
   * Search for jobs using various parameters
   */
  async searchJobs(params: AdzunaSearchParams = {}): Promise<AdzunaSearchResponse> {
    try {
      const response: AxiosResponse<AdzunaSearchResponse> = await this.client.get(
        `/v1/api/jobs/${this.config.country}/search/1`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }

  /**
   * Get job details by ID
   */
  async getJobDetails(jobId: string, adref: string): Promise<any> {
    try {
      const response = await this.client.get(
        `/v1/api/jobs/${this.config.country}/details/${jobId}`,
        { 
          params: { 
            adref 
          } 
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting job details:', error);
      throw error;
    }
  }

  /**
   * Get available job categories
   */
  async getCategories(): Promise<AdzunaCategoriesResponse> {
    try {
      const response: AxiosResponse<AdzunaCategoriesResponse> = await this.client.get(
        `/v1/api/jobs/${this.config.country}/categories`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get salary histogram for specific search parameters
   */
  async getSalaryHistogram(params: Omit<AdzunaSearchParams, 'salary_min' | 'salary_max'>): Promise<AdzunaHistogramResponse> {
    try {
      const response: AxiosResponse<AdzunaHistogramResponse> = await this.client.get(
        `/v1/api/jobs/${this.config.country}/histogram`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting salary histogram:', error);
      throw error;
    }
  }

  /**
   * Get top companies hiring for specific search parameters
   */
  async getTopCompanies(params: AdzunaSearchParams = {}): Promise<AdzunaTopCompaniesResponse> {
    try {
      const response: AxiosResponse<AdzunaTopCompaniesResponse> = await this.client.get(
        `/v1/api/jobs/${this.config.country}/top_companies`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting top companies:', error);
      throw error;
    }
  }

  /**
   * Get geographical locations for job searches
   */
  async getGeoLocations(term: string): Promise<AdzunaGeoLocationResponse> {
    try {
      const response: AxiosResponse<AdzunaGeoLocationResponse> = await this.client.get(
        `/v1/api/jobs/${this.config.country}/geodata`,
        { 
          params: { 
            term 
          } 
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting geo locations:', error);
      throw error;
    }
  }

  /**
   * Helper method to format salary display
   */
  static formatSalary(salaryMin?: number, salaryMax?: number, currency: string = '$'): string {
    if (!salaryMin && !salaryMax) return 'Salary not specified';
    
    const formatAmount = (amount: number) => {
      if (amount >= 1000000) {
        return `${currency}${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `${currency}${(amount / 1000).toFixed(0)}K`;
      }
      return `${currency}${amount.toLocaleString()}`;
    };

    if (salaryMin && salaryMax) {
      return `${formatAmount(salaryMin)} - ${formatAmount(salaryMax)}`;
    } else if (salaryMin) {
      return `From ${formatAmount(salaryMin)}`;
    } else if (salaryMax) {
      return `Up to ${formatAmount(salaryMax)}`;
    }
    
    return 'Salary not specified';
  }

  /**
   * Helper method to get relative time from job creation date
   */
  static getRelativeTime(createdDate: string): string {
    const created = new Date(createdDate);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
      }
    }
    
    return 'Just now';
  }

  /**
   * Helper method to extract clean job description (remove HTML tags)
   */
  static cleanJobDescription(description: string, maxLength: number = 300): string {
    // Remove HTML tags
    const cleanText = description.replace(/<[^>]*>/g, '');
    
    // Remove extra whitespace
    const normalizedText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Truncate if too long
    if (normalizedText.length <= maxLength) {
      return normalizedText;
    }
    
    return normalizedText.substring(0, maxLength).trim() + '...';
  }
}

// Factory function to create Adzuna service instance
export function createAdzunaService(country: AdzunaCountry = 'us'): AdzunaService {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('Adzuna API credentials are not configured. Please set ADZUNA_APP_ID and ADZUNA_API_KEY environment variables.');
  }

  return new AdzunaService({
    appId,
    apiKey,
    country
  });
}

// Create service instance only when needed (not at module level) - Default to India
export function getAdzunaService(country: AdzunaCountry = 'in'): AdzunaService {
  try {
    return createAdzunaService(country);
  } catch (error) {
    console.warn('Adzuna service not available:', error);
    throw error;
  }
}

// Helper function specifically for Indian job searches
export function getIndianJobService(): AdzunaService {
  return getAdzunaService('in');
}
