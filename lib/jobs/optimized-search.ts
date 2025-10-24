/**
 * Optimized Job Search System
 * High-performance job search with intelligent caching and reduced API calls
 */

import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromIndeed, fetchFromZipRecruiter } from './providers';

export interface OptimizedSearchOptions {
  query?: string;
  location?: string;
  country?: string;
  jobType?: string;
  experienceLevel?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  sector?: string;
  page?: number;
  limit?: number;
  includeExternal?: boolean;
  includeDatabase?: boolean;
  includeSample?: boolean;
}

export interface OptimizedSearchResult {
  jobs: any[];
  totalJobs: number;
  hasMore: boolean;
  sources: {
    database: number;
    external: number;
    sample: number;
  };
  metadata: {
    sectors: string[];
    countries: string[];
    searchTime: string;
    cached: boolean;
  };
}

// Simple in-memory cache with TTL
class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 2 * 60 * 1000; // 2 minutes

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const searchCache = new SearchCache();

// Country configurations - simplified
const COUNTRY_CONFIGS = {
  'IN': { adzuna: 'in', jsearch: 'IN', google: 'India', jooble: 'in', name: 'India' },
  'US': { adzuna: 'us', jsearch: 'US', google: 'United States', jooble: 'us', name: 'United States' },
  'AE': { adzuna: 'ae', jsearch: 'AE', google: 'United Arab Emirates', jooble: 'ae', name: 'UAE' },
  'GB': { adzuna: 'gb', jsearch: 'GB', google: 'United Kingdom', jooble: 'gb', name: 'United Kingdom' }
};

export class OptimizedJobSearch {
  /**
   * Perform optimized job search with intelligent caching
   */
  async search(options: OptimizedSearchOptions = {}): Promise<OptimizedSearchResult> {
    const {
      query = '',
      location = '',
      country = 'IN',
      jobType = '',
      experienceLevel = '',
      isRemote = false,
      salaryMin,
      salaryMax,
      sector = '',
      page = 1,
      limit = 100, // Increased default limit for unlimited job search
      includeExternal = true,
      includeDatabase = true,
      includeSample = true
    } = options;

    console.log(`🚀 Optimized search starting:`, { query, location, country, page, limit });

    // Create cache key
    const cacheKey = `search:${query}:${location}:${country}:${page}:${limit}:${includeExternal}:${includeDatabase}`;
    
    // Check cache first
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult) {
      console.log('⚡ Cache hit - returning cached results');
      return {
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata,
          cached: true
        }
      };
    }

    const startTime = Date.now();
    const allJobs: any[] = [];
    const sources = { database: 0, external: 0, sample: 0 };
    const sectors: string[] = [];
    const countries: string[] = [];

    // 1. Database jobs (optimized query)
    if (includeDatabase) {
      try {
        const dbJobs = await this.searchDatabaseJobs({
          query, location, country, jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
        }, limit);
        allJobs.push(...dbJobs);
        sources.database = dbJobs.length;
        console.log(`✅ Database: Found ${dbJobs.length} jobs`);
      } catch (error) {
        console.error('❌ Database search failed:', error);
      }
    }

    // 2. External APIs (optimized - only if we need more jobs)
    if (includeExternal && allJobs.length < limit) {
      try {
        const externalJobs = await this.searchExternalJobsOptimized({
          query, location, country, page, limit: Math.min(limit - allJobs.length, 100)
        });
        allJobs.push(...externalJobs);
        sources.external = externalJobs.length;
        console.log(`✅ External APIs: Found ${externalJobs.length} jobs`);
      } catch (error) {
        console.error('❌ External search failed:', error);
      }
    }

    // 3. Sample jobs (only if still needed)
    if (includeSample && allJobs.length < limit) {
      try {
        const sampleJobs = await this.generateSampleJobs({
          query, location, country, limit: limit - allJobs.length
        });
        allJobs.push(...sampleJobs);
        sources.sample = sampleJobs.length;
        console.log(`✅ Sample jobs: Generated ${sampleJobs.length} jobs`);
      } catch (error) {
        console.error('❌ Sample job generation failed:', error);
      }
    }

    const searchTime = Date.now() - startTime;
    console.log(`⚡ Search completed in ${searchTime}ms`);

    const result: OptimizedSearchResult = {
      jobs: allJobs.slice(0, limit), // Ensure we don't exceed limit
      totalJobs: allJobs.length,
      hasMore: allJobs.length >= limit,
      sources,
      metadata: {
        sectors,
        countries: [country],
        searchTime: new Date().toISOString(),
        cached: false
      }
    };

    // Cache the result
    searchCache.set(cacheKey, result);

    return result;
  }

  /**
   * Optimized database search with proper indexing
   */
  private async searchDatabaseJobs(filters: any, limit: number) {
    const where: any = {
      isActive: true
    };

    // Build optimized where clause
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { company: { contains: filters.query, mode: 'insensitive' } }
      ];
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.jobType) {
      where.jobType = filters.jobType;
    }

    if (filters.experienceLevel) {
      where.experienceLevel = filters.experienceLevel;
    }

    if (filters.isRemote) {
      where.isRemote = true;
    }

    // Optimized query with select only needed fields
    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        description: true,
        salary: true,
        jobType: true,
        experienceLevel: true,
        isRemote: true,
        isFeatured: true,
        sector: true,
        postedAt: true,
        createdAt: true,
        source: true,
        sourceId: true,
        applyUrl: true,
        source_url: true
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: Math.min(limit, 500) // Increased database limit for more jobs
    });

    return jobs;
  }

  /**
   * Optimized external API search - reduced calls
   */
  private async searchExternalJobsOptimized(options: any) {
    const { query, location, country, limit } = options;
    const allJobs: any[] = [];
    
    // Only search primary country and one additional country
    const countriesToSearch = [country];
    if (country !== 'IN') {
      countriesToSearch.push('IN'); // Always include India for more results
    }

    // Only use 2 queries maximum
    const searchQueries = this.generateOptimizedQueries(query);

    // Only search 1 page per API to reduce calls
    for (const searchCountry of countriesToSearch.slice(0, 2)) {
      const countryConfig = COUNTRY_CONFIGS[searchCountry as keyof typeof COUNTRY_CONFIGS] || COUNTRY_CONFIGS.IN;
      
      console.log(`🌍 Searching in ${countryConfig.name} (${searchCountry})`);

      // Use Promise.all for parallel API calls
      const apiPromises = [];

      // Adzuna - Working API
      apiPromises.push(
        fetchFromAdzuna(searchQueries[0], countryConfig.adzuna, 1, {
          location: location || undefined,
          distanceKm: 25
        }).catch(err => {
          console.warn(`Adzuna failed for ${searchCountry}:`, err);
          return [];
        })
      );

      // Indeed - Working API
      apiPromises.push(
        fetchFromIndeed(searchQueries[0], countryConfig.name, 1).catch(err => {
          console.warn(`Indeed failed for ${searchCountry}:`, err);
          return [];
        })
      );

      // ZipRecruiter - Working API
      apiPromises.push(
        fetchFromZipRecruiter(searchQueries[0], countryConfig.name, 1).catch(err => {
          console.warn(`ZipRecruiter failed for ${searchCountry}:`, err);
          return [];
        })
      );

      try {
        const results = await Promise.all(apiPromises);
        
        results.forEach(jobs => {
          if (Array.isArray(jobs)) {
            allJobs.push(...jobs.map(job => ({ 
              ...job, 
              country: searchCountry, 
              countryName: countryConfig.name 
            })));
          }
        });

        // Small delay between countries
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.warn(`Error fetching from ${searchCountry}:`, error);
      }
    }

    return allJobs.slice(0, limit);
  }

  /**
   * Generate optimized search queries (max 2)
   */
  private generateOptimizedQueries(baseQuery: string): string[] {
    if (!baseQuery) {
      return ['software engineer', 'developer'];
    }

    return [
      baseQuery,
      `${baseQuery} jobs`
    ];
  }

  /**
   * Generate sample jobs quickly
   */
  private async generateSampleJobs(options: any) {
    const { query, location, country, limit } = options;
    const sampleJobs = [];

    const jobTitles = [
      'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
      'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer',
      'Mobile Developer', 'Cloud Engineer', 'Security Engineer', 'QA Engineer'
    ];

    const companies = [
      'TechCorp', 'InnovateLabs', 'Digital Solutions', 'CloudTech', 'DataFlow',
      'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio',
      'HealthCare Plus', 'FinanceFirst', 'EduTech Solutions', 'MarketingPro', 'SalesForce',
      'Engineering Corp', 'RetailMax', 'Hospitality Group', 'Manufacturing Inc', 'Consulting Partners'
    ];

    const locations = [
      'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India',
      'New York, USA', 'San Francisco, USA', 'London, UK', 'Dubai, UAE'
    ];

    for (let i = 0; i < Math.min(limit, 50); i++) {
      sampleJobs.push({
        id: `sample-${Date.now()}-${i}`,
        title: query ? `${query} ${i + 1}` : jobTitles[i % jobTitles.length],
        company: companies[i % companies.length],
        location: location || locations[i % locations.length],
        country: country,
        description: `This is a sample job description for ${query || 'Software Engineer'} position.`,
        salary: '$50,000 - $80,000',
        jobType: 'Full-time',
        experienceLevel: 'Mid Level',
        isRemote: Math.random() > 0.5,
        isFeatured: Math.random() > 0.8,
        sector: 'Technology',
        postedAt: new Date(),
        createdAt: new Date(),
        source: 'sample',
        sourceId: `sample-${i}`,
        applyUrl: '#',
        source_url: '#'
      });
    }

    return sampleJobs;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    searchCache.clear();
  }
}

// Export singleton instance
export const optimizedJobSearch = new OptimizedJobSearch();
