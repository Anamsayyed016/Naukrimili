import * as serpapi from 'serpapi';

export interface SerpJobResult {
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
  via?: string;
  thumbnail?: string;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
    work_from_home?: boolean;
  };
}

export interface SerpJobSearchParams {
  query: string;
  location?: string;
  datePosted?: 'today' | 'yesterday' | 'week' | 'month' | 'all';
  jobType?: 'full_time' | 'part_time' | 'contract' | 'internship';
  chips?: string[];  // Additional filters like "remote", "entry_level", etc.
  start?: number;    // For pagination
  num?: number;      // Number of results (max 100)
}

export class SerpApiJobService {
  private apiKey: string;
  private isInitialized: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SERPAPI_KEY || '';
    
    // Debug environment variables
    console.log('🔧 SerpApi Debug Info:');
    console.log('  - SERPAPI_KEY from env:', process.env.SERPAPI_KEY ? 'SET' : 'NOT SET');
    console.log('  - apiKey parameter:', apiKey ? 'PROVIDED' : 'NOT PROVIDED');
    console.log('  - Final apiKey length:', this.apiKey.length);
    
    if (!this.apiKey) {
      console.warn('⚠️ SerpApi key is not configured. SerpApi will not work.');
      console.warn('   Please set SERPAPI_KEY in your .env.local file');
      this.isInitialized = false;
      return;
    }
    
    try {
      // Set the API key for serpapi module
      serpapi.config.api_key = this.apiKey;
      this.isInitialized = true;
      console.log('✅ SerpApi service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SerpApi service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Search for jobs using Google Jobs via SerpApi
   */
  async searchJobs(params: SerpJobSearchParams): Promise<{
    jobs: SerpJobResult[];
    total?: number;
    pagination?: any;
    error?: string;
  }> {
    if (!this.isInitialized) {
      return {
        jobs: [],
        error: 'SerpApi is not configured. Please set SERPAPI_KEY environment variable.'
      };
    }

    try {
      const searchParams = {
        engine: "google_jobs",
        q: params.query,
        location: params.location || "India",
        api_key: this.apiKey,
        ...(params.datePosted && { date_posted: params.datePosted }),
        ...(params.jobType && { job_type: params.jobType }),
        ...(params.chips && params.chips.length > 0 && { chips: params.chips.join(',') }),
        ...(params.start && { start: params.start }),
        ...(params.num && { num: Math.min(params.num, 100) }), // SerpApi limit
        google_domain: "google.co.uk", // Use Google UK for UK jobs
        hl: "en",
        gl: "uk"
      };

      console.log('🔍 SerpApi search params:', { ...searchParams, api_key: '***' });

      const result = await serpapi.getJson(searchParams);
      
      if (result.error) {
        console.error('❌ SerpApi error:', result.error);
        return {
          jobs: [],
          error: result.error
        };
      }

      const jobs: SerpJobResult[] = (result.jobs || []).map((job: any, index: number) => ({
        id: job.job_id || `serp-${Date.now()}-${index}`,
        title: job.title || 'Job Title Not Available',
        company: job.company_name || 'Company Not Listed',
        location: job.location || params.location || 'Location Not Specified',
        description: this.cleanDescription(job.description || job.snippet || 'No description available'),
        redirect_url: job.share_link || job.related_links?.[0]?.link || '#',
        salaryFormatted: this.formatSalary(job.detected_extensions?.salary),
        timeAgo: this.formatTimeAgo(job.detected_extensions?.posted_at),
        isRemote: job.detected_extensions?.work_from_home || 
                  this.isRemoteJob(job.title, job.description),
        isUrgent: this.isUrgentJob(job.title, job.description),
        jobType: this.detectJobType(job.detected_extensions?.schedule_type, job.title),
        via: job.via || 'Direct',
        thumbnail: job.thumbnail,
        detected_extensions: job.detected_extensions
      }));

      console.log(`✅ SerpApi found ${jobs.length} jobs`);

      return {
        jobs,
        total: result.search_information?.total_results,
        pagination: result.pagination
      };

    } catch (error) {
      console.error('❌ Error searching jobs with SerpApi:', error);
      return {
        jobs: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Search jobs specifically for Indian market with optimized parameters
   */
  async searchIndianJobs(query: string, location: string = "India", options: Partial<SerpJobSearchParams> = {}) {
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 
      'Kolkata', 'Ahmedabad', 'Gurgaon', 'Noida', 'Kochi', 'Indore'
    ];

    // Enhance location for better Indian results
    let enhancedLocation = location;
    if (indianCities.some(city => location.toLowerCase().includes(city.toLowerCase()))) {
      enhancedLocation = `${location}, India`;
    }

    return this.searchJobs({
      query,
      location: enhancedLocation,
      ...options
    });
  }

  /**
   * Get trending job searches for India
   */
  async getTrendingJobs(location: string = "India") {
    const trendingQueries = [
      'software engineer',
      'data scientist', 
      'product manager',
      'digital marketing',
      'business analyst',
      'full stack developer'
    ];

    const allJobs: SerpJobResult[] = [];

    for (const query of trendingQueries.slice(0, 3)) { // Limit to avoid rate limits
      try {
        const result = await this.searchJobs({
          query,
          location,
          num: 10
        });
        allJobs.push(...result.jobs.slice(0, 5)); // Take top 5 from each query
      } catch (error) {
        console.warn(`Failed to fetch trending jobs for "${query}":`, error);
      }
    }

    return allJobs;
  }

  /**
   * Clean and format job description
   */
  private cleanDescription(description: string, maxLength: number = 300): string {
    // Remove HTML tags and extra whitespace
    const cleaned = description
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...'
      : cleaned;
  }

  /**
   * Format salary from detected extensions
   */
  private formatSalary(salary?: string): string | undefined {
    if (!salary) return undefined;
    
    // Clean up and standardize salary format
    return salary
      .replace(/\s+/g, ' ')
      .replace(/\$(\d+),(\d+)/g, '₹$1,$2') // Convert $ to ₹ for Indian context
      .trim();
  }

  /**
   * Format time ago from posted date
   */
  private formatTimeAgo(postedAt?: string): string | undefined {
    if (!postedAt) return undefined;
    
    // Handle various date formats from SerpApi
    const timePatterns = [
      /(\d+)\s+days?\s+ago/i,
      /(\d+)\s+hours?\s+ago/i,
      /(\d+)\s+minutes?\s+ago/i,
      /yesterday/i,
      /today/i
    ];

    for (const pattern of timePatterns) {
      if (pattern.test(postedAt)) {
        return postedAt.toLowerCase();
      }
    }

    return postedAt;
  }

  /**
   * Detect if job is remote based on title/description
   */
  private isRemoteJob(title?: string, description?: string): boolean {
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'telecommute', 'virtual'];
    const text = `${title} ${description}`.toLowerCase();
    
    return remoteKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detect if job is urgent hiring
   */
  private isUrgentJob(title?: string, description?: string): boolean {
    const urgentKeywords = ['urgent', 'immediate', 'asap', 'hiring now', 'join immediately'];
    const text = `${title} ${description}`.toLowerCase();
    
    return urgentKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detect job type from schedule type or title
   */
  private detectJobType(scheduleType?: string, title?: string): string {
    if (scheduleType) {
      const type = scheduleType.toLowerCase();
      if (type.includes('full')) return 'Full-time';
      if (type.includes('part')) return 'Part-time';
      if (type.includes('contract')) return 'Contract';
      if (type.includes('intern')) return 'Internship';
    }

    // Fallback to analyzing title
    if (title) {
      const titleLower = title.toLowerCase();
      if (titleLower.includes('intern')) return 'Internship';
      if (titleLower.includes('contract')) return 'Contract';
      if (titleLower.includes('part-time') || titleLower.includes('part time')) return 'Part-time';
    }

    return 'Full-time'; // Default
  }

  /**
   * Get supported locations for job search
   */
  getSupportedLocations(): string[] {
    return [
      'Mumbai, India',
      'Delhi, India', 
      'Bangalore, India',
      'Hyderabad, India',
      'Chennai, India',
      'Pune, India',
      'Kolkata, India',
      'Ahmedabad, India',
      'Gurgaon, India',
      'Noida, India',
      'Kochi, India',
      'Indore, India',
      'India' // Generic India-wide search
    ];
  }

  /**
   * Validate API key and connection
   */
  async validateConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const result = await serpapi.getJson({
        engine: "google_jobs",
        q: "test",
        location: "India",
        num: 1,
        api_key: this.apiKey
      });

      return !result.error;
    } catch (error) {
      console.error('❌ SerpApi connection validation failed:', error);
      return false;
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return this.isInitialized && this.apiKey !== '';
  }
}

// Factory function to create SerpApi service instance
export function createSerpApiService(apiKey?: string): SerpApiJobService {
  return new SerpApiJobService(apiKey);
}

// Helper function to get Indian job service
export function getSerpApiService(): SerpApiJobService {
  try {
    return createSerpApiService();
  } catch (error) {
    console.error('❌ Failed to create SerpApi service:', error);
    // Return a service instance that will handle the error gracefully
    return new SerpApiJobService();
  }
}

export default SerpApiJobService;
