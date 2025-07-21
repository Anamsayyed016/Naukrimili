interface ReedJob {
  jobId: number;
  employerId: number;
  employerName: string;
  employerProfileId?: number;
  employerProfileName?: string;
  jobTitle: string;
  locationName: string;
  minimumSalary?: number;
  maximumSalary?: number;
  currency: string;
  expirationDate: string;
  date: string;
  jobDescription: string;
  applications: number;
  jobUrl: string;
}

interface ReedSearchParams {
  keywords?: string;
  locationName?: string;
  distanceFromLocation?: number;
  permanent?: boolean;
  contract?: boolean;
  temp?: boolean;
  partTime?: boolean;
  fullTime?: boolean;
  minimumSalary?: number;
  maximumSalary?: number;
  postedByRecruitmentAgency?: boolean;
  postedByDirectEmployer?: boolean;
  graduate?: boolean;
  resultsToTake?: number;
  resultsToSkip?: number;
}

interface ReedSearchResponse {
  results: ReedJob[];
  totalResults: number;
}

export class ReedService {
  private apiKey: string;
  private baseUrl = 'https://www.reed.co.uk/api/1.0';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REED_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Reed API key is required. Set REED_API_KEY in environment variables.');
    }
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const credentials = Buffer.from(`${this.apiKey}:`).toString('base64');
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'User-Agent': 'JobPortal/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reed API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Reed API request failed:', error);
      throw error;
    }
  }

  /**
   * Search for jobs using Reed API
   */
  async searchJobs(params: ReedSearchParams = {}): Promise<ReedSearchResponse> {
    const searchParams = {
      keywords: params.keywords,
      locationName: params.locationName,
      distanceFromLocation: params.distanceFromLocation,
      permanent: params.permanent,
      contract: params.contract,
      temp: params.temp,
      partTime: params.partTime,
      fullTime: params.fullTime,
      minimumSalary: params.minimumSalary,
      maximumSalary: params.maximumSalary,
      postedByRecruitmentAgency: params.postedByRecruitmentAgency,
      postedByDirectEmployer: params.postedByDirectEmployer,
      graduate: params.graduate,
      resultsToTake: params.resultsToTake || 100,
      resultsToSkip: params.resultsToSkip || 0
    };

    return await this.makeRequest('/search', searchParams);
  }

  /**
   * Get details for a specific job by ID
   */
  async getJobById(jobId: number): Promise<ReedJob> {
    return await this.makeRequest(`/jobs/${jobId}`);
  }

  /**
   * Get job details formatted for your application
   */
  async getFormattedJob(jobId: number) {
    const job = await this.getJobById(jobId);
    
    return {
      id: job.jobId.toString(),
      title: job.jobTitle,
      company: job.employerName,
      location: job.locationName,
      salary: this.formatSalary(job.minimumSalary, job.maximumSalary, job.currency),
      description: job.jobDescription,
      url: job.jobUrl,
      datePosted: job.date,
      expirationDate: job.expirationDate,
      applications: job.applications,
      source: 'Reed',
      type: this.determineJobType(job),
      remote: this.isRemoteJob(job.locationName, job.jobDescription)
    };
  }

  /**
   * Search and format jobs for your application
   */
  async searchFormattedJobs(params: ReedSearchParams = {}) {
    const response = await this.searchJobs(params);
    
    return {
      jobs: response.results.map(job => ({
        id: job.jobId.toString(),
        title: job.jobTitle,
        company: job.employerName,
        location: job.locationName,
        salary: this.formatSalary(job.minimumSalary, job.maximumSalary, job.currency),
        description: job.jobDescription,
        url: job.jobUrl,
        datePosted: job.date,
        expirationDate: job.expirationDate,
        applications: job.applications,
        source: 'Reed',
        type: this.determineJobType(job),
        remote: this.isRemoteJob(job.locationName, job.jobDescription)
      })),
      totalResults: response.totalResults,
      source: 'Reed'
    };
  }

  private formatSalary(min?: number, max?: number, currency = 'GBP'): string {
    const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '';
    
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    } else if (min) {
      return `${symbol}${min.toLocaleString()}+`;
    } else if (max) {
      return `Up to ${symbol}${max.toLocaleString()}`;
    }
    return 'Salary not specified';
  }

  private determineJobType(job: ReedJob): string {
    // Reed doesn't always provide explicit job type, so we infer from title/description
    const title = job.jobTitle.toLowerCase();
    const desc = job.jobDescription.toLowerCase();
    
    if (title.includes('contract') || desc.includes('contract')) return 'Contract';
    if (title.includes('temporary') || title.includes('temp') || desc.includes('temporary')) return 'Temporary';
    if (title.includes('part time') || title.includes('part-time') || desc.includes('part time')) return 'Part-time';
    if (title.includes('internship') || desc.includes('internship')) return 'Internship';
    
    return 'Full-time'; // Default assumption
  }

  private isRemoteJob(location: string, description: string): boolean {
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'home based', 'anywhere'];
    const locationLower = location.toLowerCase();
    const descLower = description.toLowerCase();
    
    return remoteKeywords.some(keyword => 
      locationLower.includes(keyword) || descLower.includes(keyword)
    );
  }
}

// Export singleton instance
let reedService: ReedService | null = null;

export const getReedService = (): ReedService => {
  if (!reedService) {
    reedService = new ReedService();
  }
  return reedService;
};

export default ReedService;
