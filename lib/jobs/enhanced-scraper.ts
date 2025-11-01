/**
 * Enhanced Job Scraping System
 * Fetches real jobs from multiple sources with intelligent deduplication
 */

import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { upsertNormalizedJob } from './upsertJob';

export interface JobSource {
  name: string;
  enabled: boolean;
  rateLimit: number; // requests per minute
  lastRequest?: number;
}

export interface ScrapingConfig {
  sources: JobSource[];
  batchSize: number;
  maxJobsPerSource: number;
  enableDeduplication: boolean;
  enableCaching: boolean;
  cacheTTL: number; // minutes
}

export interface ScrapingResult {
  source: string;
  jobsFound: number;
  jobsAdded: number;
  duplicatesSkipped: number;
  errors: string[];
  duration: number;
}

export class EnhancedJobScraper {
  private config: ScrapingConfig;
  private cache = new Map<string, { data: any; timestamp: number }>();

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = {
      sources: [
        { name: 'adzuna', enabled: true, rateLimit: 60 },
        { name: 'jsearch', enabled: true, rateLimit: 100 },
        { name: 'reed', enabled: true, rateLimit: 30 },
        { name: 'indeed', enabled: false, rateLimit: 50 }, // Disabled by default
        { name: 'linkedin', enabled: false, rateLimit: 20 }, // Disabled by default
      ],
      batchSize: 50,
      maxJobsPerSource: 200,
      enableDeduplication: true,
      enableCaching: true,
      cacheTTL: 30,
      ...config
    };
  }

  /**
   * Main scraping method - fetches jobs from all enabled sources
   */
  async scrapeAllSources(query: string = '', countries: string[] = ['IN', 'US', 'GB', 'AE']): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];
    
    console.log(`🚀 Starting enhanced job scraping for query: "${query}"`);
    console.log(`🌍 Countries: ${countries.join(', ')}`);
    console.log(`📊 Max jobs per source: ${this.config.maxJobsPerSource}`);

    for (const source of this.config.sources) {
      if (!source.enabled) {
        console.log(`⏭️ Skipping disabled source: ${source.name}`);
        continue;
      }

      try {
        const result = await this.scrapeSource(source.name, query, countries);
        results.push(result);
        
        // Rate limiting
        await this.enforceRateLimit(source);
        
      } catch (error) {
        console.error(`❌ Error scraping ${source.name}:`, error);
        results.push({
          source: source.name,
          jobsFound: 0,
          jobsAdded: 0,
          duplicatesSkipped: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          duration: 0
        });
      }
    }

    const totalJobs = results.reduce((sum, r) => sum + r.jobsAdded, 0);
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicatesSkipped, 0);
    
    console.log(`✅ Scraping completed! Added ${totalJobs} jobs, skipped ${totalDuplicates} duplicates`);
    
    return results;
  }

  /**
   * Scrape jobs from a specific source
   */
  private async scrapeSource(source: string, query: string, countries: string[]): Promise<ScrapingResult> {
    const startTime = Date.now();
    let jobsFound = 0;
    let jobsAdded = 0;
    let duplicatesSkipped = 0;
    const errors: string[] = [];

    console.log(`🔍 Scraping ${source}...`);

    try {
      for (const country of countries) {
        const countryJobs = await this.fetchFromSource(source, query, country);
        jobsFound += countryJobs.length;

        // Process jobs in batches
        for (let i = 0; i < countryJobs.length; i += this.config.batchSize) {
          const batch = countryJobs.slice(i, i + this.config.batchSize);
          
          for (const job of batch) {
            try {
              if (this.config.enableDeduplication) {
                const isDuplicate = await this.isDuplicate(job);
                if (isDuplicate) {
                  duplicatesSkipped++;
                  continue;
                }
              }

              await upsertNormalizedJob(job);
              jobsAdded++;
              
            } catch (error) {
              errors.push(`Job ${job.sourceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        // Limit total jobs per source
        if (jobsAdded >= this.config.maxJobsPerSource) {
          console.log(`📊 Reached max jobs limit for ${source} (${this.config.maxJobsPerSource})`);
          break;
        }
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    const duration = Date.now() - startTime;
    
    console.log(`✅ ${source}: Found ${jobsFound}, Added ${jobsAdded}, Duplicates ${duplicatesSkipped}, Errors ${errors.length}`);

    return {
      source,
      jobsFound,
      jobsAdded,
      duplicatesSkipped,
      errors,
      duration
    };
  }

  /**
   * Fetch jobs from specific source and country
   */
  private async fetchFromSource(source: string, query: string, country: string): Promise<any[]> {
    const cacheKey = `${source}_${query}_${country}`;
    
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.config.cacheTTL * 60 * 1000) {
        console.log(`📋 Using cached data for ${source} ${country}`);
        return cached.data;
      }
    }

    let jobs: any[] = [];

    try {
      switch (source) {
        case 'adzuna':
          jobs = await this.fetchFromAdzuna(query, country);
          break;
        case 'indeed':
          jobs = await this.fetchFromIndeed(query, country);
          break;
        case 'ziprecruiter':
          jobs = await this.fetchFromZipRecruiter(query, country);
          break;
        default:
          console.warn(`⚠️ Unknown source: ${source}`);
      }

      // Cache the results
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: jobs,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      console.error(`❌ Error fetching from ${source}:`, error);
    }

    return jobs;
  }

  /**
   * Fetch from Adzuna API
   */
  private async fetchFromAdzuna(query: string, country: string): Promise<any[]> {
    const app_id = process.env.ADZUNA_APP_ID;
    const app_key = process.env.ADZUNA_APP_KEY;
    
    if (!app_id || !app_key) {
      throw new Error('Adzuna API keys not configured');
    }

    const countryCode = this.getCountryCode(country);
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1`;
    
    const { data } = await axios.get(url, {
      params: {
        app_id,
        app_key,
        what: query || 'software developer',
        results_per_page: 50,
        content_type: 'application/json'
      },
      timeout: 15000
    });

    return (data.results || []).map((job: any) => ({
      source: 'adzuna',
      sourceId: `adzuna_${job.id}`,
      title: job.title || 'Job Title',
      company: job.company?.display_name || 'Company',
      location: job.location?.display_name || 'Location',
      country: country,
      description: job.description || 'No description available',
      requirements: this.extractRequirements(job.description || ''),
      apply_url: null,
      source_url: job.redirect_url || job.url,
      postedAt: job.created ? new Date(job.created).toISOString() : new Date().toISOString(),
      salary: job.salary_min || job.salary_max ? `${job.salary_min || ''}-${job.salary_max || ''}` : undefined,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryCurrency: this.getCurrency(country),
      jobType: 'full-time',
      experienceLevel: 'mid',
      skills: this.extractSkills(job.description || '', job.title || ''),
      isRemote: false,
      isHybrid: false,
      isUrgent: false,
      isFeatured: false,
      isActive: true,
      sector: this.determineSector(job.title || '', job.description || ''),
      raw: job
    }));
  }

  /**
   * Fetch from JSearch API (RapidAPI)
   */
  private async fetchFromJSearch(query: string, country: string): Promise<any[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      throw new Error('RapidAPI key not configured');
    }

    const url = 'https://jsearch.p.rapidapi.com/search';
    
    const { data } = await axios.get(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      params: {
        query: query || 'software developer',
        page: '1',
        num_pages: '1',
        country: country.toLowerCase(),
        job_type: 'fulltime'
      },
      timeout: 15000
    });

    return (data.data || []).map((job: any) => ({
      source: 'jsearch',
      sourceId: `jsearch_${job.job_id}`,
      title: job.job_title || 'Job Title',
      company: job.employer_name || 'Company',
      location: job.job_city || job.job_country || 'Location',
      country: country,
      description: job.job_description || 'No description available',
      requirements: this.extractRequirements(job.job_description || ''),
      apply_url: null,
      source_url: job.job_apply_link,
      postedAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
      salary: job.job_salary ? job.job_salary : undefined,
      salaryMin: job.job_min_salary,
      salaryMax: job.job_max_salary,
      salaryCurrency: this.getCurrency(country),
      jobType: job.job_employment_type || 'full-time',
      experienceLevel: this.determineExperienceLevel(job.job_title || '', job.job_description || ''),
      skills: this.extractSkills(job.job_description || '', job.job_title || ''),
      isRemote: job.job_is_remote || false,
      isHybrid: false,
      isUrgent: false,
      isFeatured: false,
      isActive: true,
      sector: this.determineSector(job.job_title || '', job.job_description || ''),
      raw: job
    }));
  }

  /**
   * Fetch from Reed API
   */
  private async fetchFromReed(query: string, country: string): Promise<any[]> {
    const apiKey = process.env.REED_API_KEY;
    
    if (!apiKey) {
      throw new Error('Reed API key not configured');
    }

    // Reed API is UK-focused
    if (country !== 'GB') {
      return [];
    }

    const url = 'https://www.reed.co.uk/api/1.0/search';
    
    const { data } = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`
      },
      params: {
        keywords: query || 'software developer',
        resultsToTake: 50,
        resultsToSkip: 0
      },
      timeout: 15000
    });

    return (data.results || []).map((job: any) => ({
      source: 'reed',
      sourceId: `reed_${job.jobId}`,
      title: job.jobTitle || 'Job Title',
      company: job.employerName || 'Company',
      location: job.locationName || 'Location',
      country: country,
      description: job.jobDescription || 'No description available',
      requirements: this.extractRequirements(job.jobDescription || ''),
      apply_url: null,
      source_url: job.jobUrl,
      postedAt: job.date || new Date().toISOString(),
      salary: job.minimumSalary || job.maximumSalary ? `${job.minimumSalary || ''}-${job.maximumSalary || ''}` : undefined,
      salaryMin: job.minimumSalary,
      salaryMax: job.maximumSalary,
      salaryCurrency: 'GBP',
      jobType: 'full-time',
      experienceLevel: 'mid',
      skills: this.extractSkills(job.jobDescription || '', job.jobTitle || ''),
      isRemote: job.jobTitle?.toLowerCase().includes('remote') || false,
      isHybrid: job.jobTitle?.toLowerCase().includes('hybrid') || false,
      isUrgent: false,
      isFeatured: false,
      isActive: true,
      sector: this.determineSector(job.jobTitle || '', job.jobDescription || ''),
      raw: job
    }));
  }

  /**
   * Fetch from Indeed API
   */
  private async fetchFromIndeed(query: string, country: string): Promise<any[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      throw new Error('RapidAPI key not configured');
    }

    const { data } = await axios.get('https://indeed11.p.rapidapi.com/', {
      params: {
        query: query,
        location: country,
        page: 1,
        limit: 20
      },
      headers: {
        'x-rapidapi-host': 'indeed11.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
      timeout: 15000,
    });

    return (data?.data || []).map((job: any) => ({
      source: 'indeed',
      sourceId: job.jobId || `indeed-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      title: job.jobTitle || job.title || '',
      company: job.companyName || job.company || '',
      companyLogo: null,
      location: job.jobLocation || job.location || country,
      country: 'IN',
      description: job.jobDescription || job.description || '',
      requirements: null,
      applyUrl: job.jobUrl || job.applyUrl || '',
      apply_url: null,
      source_url: job.jobUrl || job.applyUrl || '',
      postedAt: job.postedAt ? new Date(job.postedAt) : null,
      expiryDate: null,
      salary: job.salary || null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'INR',
      jobType: 'Full-time',
      experienceLevel: 'Mid-Level',
      skills: this.extractSkills(job.jobDescription || job.description || '', job.jobTitle || job.title || ''),
      isRemote: (job.jobTitle || job.title || '').toLowerCase().includes('remote'),
      isHybrid: (job.jobTitle || job.title || '').toLowerCase().includes('hybrid'),
      isUrgent: false,
      isFeatured: false,
      isActive: true,
      sector: this.determineSector(job.jobTitle || job.title || '', job.jobDescription || job.description || ''),
      raw: job
    }));
  }

  /**
   * Fetch from ZipRecruiter API
   */
  private async fetchFromZipRecruiter(query: string, country: string): Promise<any[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    
    if (!apiKey) {
      throw new Error('RapidAPI key not configured');
    }

    const { data } = await axios.get('https://ziprecruiter1.p.rapidapi.com/', {
      params: {
        search_terms: query,
        location: country,
        page: 1,
        jobs_per_page: 20
      },
      headers: {
        'x-rapidapi-host': 'ziprecruiter1.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
      timeout: 15000,
    });

    return (data?.jobs || []).map((job: any) => ({
      source: 'ziprecruiter',
      sourceId: job.id || `ziprecruiter-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      title: job.name || job.title || '',
      company: job.hiring_company?.name || job.company || '',
      companyLogo: null,
      location: job.location || country,
      country: 'IN',
      description: job.snippet || job.description || '',
      requirements: null,
      applyUrl: job.url || job.applyUrl || '',
      apply_url: null,
      source_url: job.url || job.applyUrl || '',
      postedAt: job.posted_time ? new Date(job.posted_time) : null,
      expiryDate: null,
      salary: job.salary_min || job.salary_max ? `${job.salary_min || ''}-${job.salary_max || ''}` : null,
      salaryMin: job.salary_min || null,
      salaryMax: job.salary_max || null,
      salaryCurrency: 'INR',
      jobType: 'Full-time',
      experienceLevel: 'Mid-Level',
      skills: this.extractSkills(job.snippet || job.description || '', job.name || job.title || ''),
      isRemote: (job.name || job.title || '').toLowerCase().includes('remote'),
      isHybrid: (job.name || job.title || '').toLowerCase().includes('hybrid'),
      isUrgent: false,
      isFeatured: false,
      isActive: true,
      sector: this.determineSector(job.name || job.title || '', job.snippet || job.description || ''),
      raw: job
    }));
  }

  /**
   * Check if job is duplicate
   */
  private async isDuplicate(job: any): Promise<boolean> {
    try {
      const existing = await prisma.job.findFirst({
        where: {
          OR: [
            { source: job.source, sourceId: job.sourceId },
            { 
              title: { contains: job.title, mode: 'insensitive' },
              company: { contains: job.company, mode: 'insensitive' },
              location: { contains: job.location, mode: 'insensitive' }
            }
          ]
        }
      });
      
      return !!existing;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(source: JobSource): Promise<void> {
    if (source.lastRequest) {
      const timeSinceLastRequest = Date.now() - source.lastRequest;
      const minInterval = 60000 / source.rateLimit; // Convert to milliseconds
      
      if (timeSinceLastRequest < minInterval) {
        const waitTime = minInterval - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms for ${source.name}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    source.lastRequest = Date.now();
  }

  /**
   * Utility methods
   */
  private getCountryCode(country: string): string {
    const codes: Record<string, string> = {
      'IN': 'in',
      'US': 'us',
      'GB': 'gb',
      'AE': 'ae',
      'CA': 'ca',
      'AU': 'au'
    };
    return codes[country] || 'gb';
  }

  private getCurrency(country: string): string {
    const currencies: Record<string, string> = {
      'IN': 'INR',
      'US': 'USD',
      'GB': 'GBP',
      'AE': 'AED',
      'CA': 'CAD',
      'AU': 'AUD'
    };
    return currencies[country] || 'USD';
  }

  private extractRequirements(description: string): string {
    // Simple requirement extraction
    const lines = description.split('\n');
    const requirementLines = lines.filter(line => 
      line.toLowerCase().includes('requirement') ||
      line.toLowerCase().includes('qualification') ||
      line.toLowerCase().includes('experience') ||
      line.toLowerCase().includes('skill')
    );
    return requirementLines.slice(0, 5).join('\n');
  }

  private extractSkills(description: string, title: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git',
      'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Angular', 'Vue.js',
      'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API', 'Microservices'
    ];
    
    const text = `${title} ${description}`.toLowerCase();
    return commonSkills.filter(skill => text.includes(skill.toLowerCase()));
  }

  private determineSector(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('fintech') || text.includes('banking') || text.includes('finance')) return 'Finance';
    if (text.includes('health') || text.includes('medical') || text.includes('healthcare')) return 'Healthcare';
    if (text.includes('education') || text.includes('edtech')) return 'Education';
    if (text.includes('ecommerce') || text.includes('retail')) return 'E-commerce';
    if (text.includes('gaming') || text.includes('entertainment')) return 'Entertainment';
    if (text.includes('automotive') || text.includes('manufacturing')) return 'Manufacturing';
    
    return 'Technology';
  }

  private determineExperienceLevel(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('senior') || text.includes('lead') || text.includes('principal')) return 'senior';
    if (text.includes('junior') || text.includes('entry') || text.includes('graduate')) return 'junior';
    if (text.includes('intern') || text.includes('internship')) return 'intern';
    
    return 'mid';
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats(): Promise<any> {
    const stats = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      }
    });

    return {
      totalJobs: await prisma.job.count(),
      jobsBySource: stats,
      lastScraping: new Date().toISOString()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Job scraping cache cleared');
  }
}

export const jobScraper = new EnhancedJobScraper();
