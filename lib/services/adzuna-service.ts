/**
 * Enhanced Adzuna API Service
 * 
 * Senior-level implementation with:
 * - Rate limiting and quota management
 * - Intelligent caching
 * - Error handling and retries
 * - Performance monitoring
 * - Data normalization and validation
 */

import axios, { AxiosResponse } from 'axios';

interface AdzunaConfig {
  appId: string;
  appKey: string;
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}

interface AdzunaJob {
  id: string;
  title: string;
  company: {
    display_name: string;
    logo?: string;
  };
  location: {
    area: string[];
    display_name: string;
  };
  description: string;
  redirect_url: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  category: {
    label: string;
    tag: string;
  };
  contract_type?: string;
  contract_time?: string;
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
  mean: number;
  median: number;
}

interface RateLimitInfo {
  requestsThisMinute: number;
  requestsToday: number;
  resetTime: number;
  dailyResetTime: number;
}

export class AdzunaService {
  private static config: AdzunaConfig;
  private static rateLimitInfo: RateLimitInfo = {
    requestsThisMinute: 0,
    requestsToday: 0,
    resetTime: 0,
    dailyResetTime: 0
  };
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_TTL = 300000; // 5 minutes

  /**
   * Initialize the service with configuration
   */
  static initialize() {
    this.config = {
      appId: process.env.ADZUNA_APP_ID || '',
      appKey: process.env.ADZUNA_APP_KEY || '',
      baseUrl: 'https://api.adzuna.com/v1/api/jobs',
      timeout: 15000,
      retries: 3,
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerDay: 1000
      }
    };

    if (!this.config.appId || !this.config.appKey) {
      console.warn('⚠️ Adzuna API credentials not configured');
    }
  }

  /**
   * Search jobs with enhanced error handling and rate limiting
   */
  static async searchJobs(
    query: string,
    country: string = 'gb',
    page: number = 1,
    options: {
      location?: string;
      distanceKm?: number;
      category?: string;
      salaryMin?: number;
      salaryMax?: number;
      sortBy?: 'relevance' | 'date' | 'salary';
    } = {}
  ): Promise<{ success: boolean; data?: any[]; error?: string; rateLimitInfo?: RateLimitInfo }> {
    this.initialize();

    if (!this.config.appId || !this.config.appKey) {
      return {
        success: false,
        error: 'Adzuna API credentials not configured'
      };
    }

    // Check rate limits
    if (!this.checkRateLimit()) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimitInfo: this.rateLimitInfo
      };
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(query, country, page, options);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        rateLimitInfo: this.rateLimitInfo
      };
    }

    try {
      // Build request URL
      const url = `${this.config.baseUrl}/${country.toLowerCase()}/search/${page}`;
      
      // Build request parameters
      const params = {
        app_id: this.config.appId,
        app_key: this.config.appKey,
        what: query,
        results_per_page: 20,
        ...(options.location && { where: options.location }),
        ...(options.distanceKm && { distance: options.distanceKm }),
        ...(options.category && { category: options.category }),
        ...(options.salaryMin && { salary_min: options.salaryMin }),
        ...(options.salaryMax && { salary_max: options.salaryMax }),
        ...(options.sortBy && { sort_by: options.sortBy })
      };

      // Make API request with retries
      const response = await this.makeRequestWithRetry(url, params);
      
      // Process and normalize data
      const normalizedJobs = this.normalizeJobs(response.data.results || [], country);
      
      // Update rate limit info
      this.updateRateLimit();
      
      // Cache the results
      this.setCache(cacheKey, normalizedJobs);
      
      return {
        success: true,
        data: normalizedJobs,
        rateLimitInfo: this.rateLimitInfo
      };

    } catch (error: any) {
      console.error('Adzuna API error:', error);
      
      return {
        success: false,
        error: this.getErrorMessage(error),
        rateLimitInfo: this.rateLimitInfo
      };
    }
  }

  /**
   * Make API request with retry logic
   */
  private static async makeRequestWithRetry(
    url: string, 
    params: any, 
    attempt: number = 1
  ): Promise<AxiosResponse<AdzunaResponse>> {
    try {
      const response = await axios.get<AdzunaResponse>(url, {
        params,
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'JobPortal/1.0',
          'Accept': 'application/json'
        }
      });

      return response;
    } catch (error: any) {
      if (attempt < this.config.retries && this.isRetryableError(error)) {
        console.warn(`Adzuna API retry ${attempt}/${this.config.retries}:`, error.message);
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.makeRequestWithRetry(url, params, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: any): boolean {
    if (!error.response) return true; // Network error
    
    const status = error.response.status;
    return status >= 500 || status === 429; // Server error or rate limit
  }

  /**
   * Normalize Adzuna jobs to our format
   */
  private static normalizeJobs(jobs: AdzunaJob[], country: string) {
    return jobs.map(job => ({
      id: `adzuna_${job.id}`,
      source: 'adzuna',
      sourceId: job.id,
      title: job.title || 'Untitled Position',
      company: job.company?.display_name || 'Unknown Company',
      companyLogo: job.company?.logo,
      location: this.formatLocation(job.location),
      country: country.toUpperCase(),
      description: job.description || '',
      requirements: this.extractRequirements(job.description),
      applyUrl: job.redirect_url,
      source_url: job.redirect_url,
      postedAt: job.created ? new Date(job.created).toISOString() : new Date().toISOString(),
      salary: this.formatSalary(job.salary_min, job.salary_max),
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryCurrency: this.getCurrencyForCountry(country),
      jobType: this.mapContractType(job.contract_type, job.contract_time),
      experienceLevel: this.extractExperienceLevel(job.description),
      skills: this.extractSkills(job.description),
      isRemote: this.isRemoteJob(job.description, job.location),
      isHybrid: this.isHybridJob(job.description),
      isUrgent: this.isUrgentJob(job.description),
      isFeatured: false,
      isActive: true,
      sector: job.category?.label || 'Other',
      views: 0,
      applicationsCount: 0,
      rawJson: job,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * Format location string
   */
  private static formatLocation(location: any): string {
    if (!location) return 'Location not specified';
    
    const parts = [];
    if (location.area && location.area.length > 0) {
      parts.push(location.area[location.area.length - 1]);
    }
    if (location.display_name) {
      parts.push(location.display_name);
    }
    
    return parts.join(', ') || 'Location not specified';
  }

  /**
   * Format salary string
   */
  private static formatSalary(min?: number, max?: number): string | null {
    if (!min && !max) return null;
    if (min && max) return `${min} - ${max}`;
    if (min) return `From ${min}`;
    if (max) return `Up to ${max}`;
    return null;
  }

  /**
   * Map contract type to our job type
   */
  private static mapContractType(contractType?: string, contractTime?: string): string {
    if (contractTime === 'full_time') return 'full-time';
    if (contractTime === 'part_time') return 'part-time';
    if (contractType === 'contract') return 'contract';
    if (contractType === 'internship') return 'internship';
    return 'full-time';
  }

  /**
   * Extract experience level from description
   */
  private static extractExperienceLevel(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('senior') || desc.includes('lead') || desc.includes('principal')) {
      return 'senior';
    }
    if (desc.includes('mid') || desc.includes('intermediate')) {
      return 'mid';
    }
    if (desc.includes('junior') || desc.includes('entry')) {
      return 'entry';
    }
    if (desc.includes('executive') || desc.includes('director')) {
      return 'executive';
    }
    
    return 'mid'; // Default
  }

  /**
   * Extract skills from description
   */
  private static extractSkills(description: string): string[] {
    const skills = [];
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS',
      'Docker', 'Kubernetes', 'Git', 'MongoDB', 'PostgreSQL', 'Redis',
      'TypeScript', 'Angular', 'Vue.js', 'PHP', 'C++', 'C#', 'Go',
      'Machine Learning', 'AI', 'Data Science', 'DevOps', 'Agile'
    ];
    
    const desc = description.toLowerCase();
    commonSkills.forEach(skill => {
      if (desc.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    return skills.slice(0, 10); // Limit to 10 skills
  }

  /**
   * Check if job is remote
   */
  private static isRemoteJob(description: string, _location: any): boolean {
    const desc = description.toLowerCase();
    return desc.includes('remote') || desc.includes('work from home') || 
           desc.includes('wfh') || desc.includes('telecommute');
  }

  /**
   * Check if job is hybrid
   */
  private static isHybridJob(description: string): boolean {
    const desc = description.toLowerCase();
    return desc.includes('hybrid') || desc.includes('flexible') || 
           desc.includes('part remote');
  }

  /**
   * Check if job is urgent
   */
  private static isUrgentJob(description: string): boolean {
    const desc = description.toLowerCase();
    return desc.includes('urgent') || desc.includes('immediate') || 
           desc.includes('asap') || desc.includes('start immediately');
  }

  /**
   * Extract requirements from description
   */
  private static extractRequirements(description: string): string {
    // Simple extraction - in a real implementation, you'd use NLP
    const lines = description.split('\n');
    const requirements = lines.filter(line => 
      line.toLowerCase().includes('requirement') ||
      line.toLowerCase().includes('qualification') ||
      line.toLowerCase().includes('must have') ||
      line.toLowerCase().includes('should have')
    );
    
    return requirements.join('\n') || description.substring(0, 500);
  }

  /**
   * Get currency for country
   */
  private static getCurrencyForCountry(country: string): string {
    const currencyMap: { [key: string]: string } = {
      'gb': 'GBP',
      'us': 'USD',
      'in': 'INR',
      'ae': 'AED',
      'ca': 'CAD',
      'au': 'AUD'
    };
    
    return currencyMap[country.toLowerCase()] || 'USD';
  }

  /**
   * Check rate limits
   */
  private static checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset minute counter if needed
    if (now > this.rateLimitInfo.resetTime) {
      this.rateLimitInfo.requestsThisMinute = 0;
      this.rateLimitInfo.resetTime = now + 60000; // Next minute
    }
    
    // Reset daily counter if needed
    if (now > this.rateLimitInfo.dailyResetTime) {
      this.rateLimitInfo.requestsToday = 0;
      this.rateLimitInfo.dailyResetTime = now + 86400000; // Next day
    }
    
    return this.rateLimitInfo.requestsThisMinute < this.config.rateLimit.requestsPerMinute &&
           this.rateLimitInfo.requestsToday < this.config.rateLimit.requestsPerDay;
  }

  /**
   * Update rate limit counters
   */
  private static updateRateLimit(): void {
    this.rateLimitInfo.requestsThisMinute++;
    this.rateLimitInfo.requestsToday++;
  }

  /**
   * Generate cache key
   */
  private static generateCacheKey(query: string, country: string, page: number, options: any): string {
    return `adzuna_${Buffer.from(JSON.stringify({ query, country, page, options })).toString('base64')}`;
  }

  /**
   * Get from cache
   */
  private static getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set cache
   */
  private static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get error message
   */
  private static getErrorMessage(error: any): string {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) return 'Invalid API credentials';
      if (status === 403) return 'API access forbidden';
      if (status === 429) return 'Rate limit exceeded';
      if (status >= 500) return 'Adzuna API server error';
      return `API error: ${status}`;
    }
    
    if (error.code === 'ECONNABORTED') return 'Request timeout';
    if (error.code === 'ENOTFOUND') return 'Network error';
    
    return 'Unknown error occurred';
  }

  /**
   * Get rate limit info
   */
  static getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
