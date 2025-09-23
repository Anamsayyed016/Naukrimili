/**
 * Real Job Search System
 * Focuses on fetching real jobs from database and external APIs
 * Minimizes sample jobs to ensure quality job listings
 */

import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from './providers';

export interface RealJobSearchOptions {
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
}

export interface RealJobSearchResult {
  jobs: any[];
  totalJobs: number;
  hasMore: boolean;
  nextPage?: number;
  sources: {
    database: number;
    external: number;
    sample: number;
  };
  metadata: {
    sectors: string[];
    countries: string[];
    searchTime: string;
    realJobsPercentage: number;
  };
}

// Country configurations for external APIs
const COUNTRY_CONFIGS = {
  'IN': { adzuna: 'in', jsearch: 'IN', google: 'India', jooble: 'in', name: 'India' },
  'US': { adzuna: 'us', jsearch: 'US', google: 'United States', jooble: 'us', name: 'United States' },
  'AE': { adzuna: 'ae', jsearch: 'AE', google: 'United Arab Emirates', jooble: 'ae', name: 'UAE' },
  'GB': { adzuna: 'gb', jsearch: 'GB', google: 'United Kingdom', jooble: 'gb', name: 'United Kingdom' }
};

export class RealJobSearch {
  /**
   * Search for real jobs with minimal sample jobs
   */
  async search(options: RealJobSearchOptions = {}): Promise<RealJobSearchResult> {
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
      limit = 100
    } = options;

    console.log(`🔍 Real job search starting:`, { query, location, country, page, limit });

    const startTime = Date.now();
    const allJobs: any[] = [];
    const sources = { database: 0, external: 0, sample: 0 };
    const sectors: string[] = [];
    const countries: string[] = [];

    // 1. Database jobs (real jobs)
    try {
      const dbJobs = await this.searchDatabaseJobs({
        query, location, country, jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
      }, limit);
      allJobs.push(...dbJobs);
      sources.database = dbJobs.length;
      console.log(`✅ Database: Found ${dbJobs.length} real jobs`);
    } catch (error) {
      console.error('❌ Database search failed:', error);
    }

    // 2. External API jobs (real jobs)
    try {
      const externalJobs = await this.searchExternalJobs({
        query, location, country, page, limit: Math.min(limit - allJobs.length, 150)
      });
      allJobs.push(...externalJobs);
      sources.external = externalJobs.length;
      console.log(`✅ External APIs: Found ${externalJobs.length} real jobs`);
    } catch (error) {
      console.error('❌ External search failed:', error);
    }

    // 3. Sample jobs (only if we have very few real jobs)
    if (allJobs.length < 20) {
      try {
        const sampleJobs = await this.generateMinimalSampleJobs({
          query, location, country, limit: Math.min(20, limit - allJobs.length)
        });
        allJobs.push(...sampleJobs);
        sources.sample = sampleJobs.length;
        console.log(`✅ Sample jobs: Generated ${sampleJobs.length} jobs (only because real jobs < 20)`);
      } catch (error) {
        console.error('❌ Sample job generation failed:', error);
      }
    }

    // 4. Remove duplicates
    const uniqueJobs = this.removeDuplicates(allJobs);

    // 5. Sort by relevance and recency
    const sortedJobs = this.sortJobs(uniqueJobs, { query, location });

    // 6. Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = sortedJobs.slice(startIndex, endIndex);

    // 7. Extract metadata
    const jobSectors = [...new Set(uniqueJobs.map(job => job.sector).filter(Boolean))];
    const jobCountries = [...new Set(uniqueJobs.map(job => job.country).filter(Boolean))];
    const realJobsCount = sources.database + sources.external;
    const realJobsPercentage = uniqueJobs.length > 0 ? (realJobsCount / uniqueJobs.length) * 100 : 0;

    const searchTime = Date.now() - startTime;

    const result: RealJobSearchResult = {
      jobs: paginatedJobs,
      totalJobs: uniqueJobs.length,
      hasMore: endIndex < uniqueJobs.length,
      nextPage: endIndex < uniqueJobs.length ? page + 1 : undefined,
      sources,
      metadata: {
        sectors: jobSectors,
        countries: jobCountries,
        searchTime: new Date().toISOString(),
        realJobsPercentage: Math.round(realJobsPercentage)
      }
    };

    console.log(`🎯 Real job search results:`, {
      total: result.totalJobs,
      showing: paginatedJobs.length,
      hasMore: result.hasMore,
      sources: result.sources,
      realJobsPercentage: result.metadata.realJobsPercentage,
      searchTime: `${searchTime}ms`
    });

    return result;
  }

  /**
   * Search database for real jobs
   */
  private async searchDatabaseJobs(filters: any, limit: number) {
    const where: any = {
      isActive: true,
      // Exclude sample jobs
      source: { not: 'sample' }
    };

    // Build where clause
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
      take: Math.min(limit, 300) // Increased limit for more real jobs
    });

    return jobs;
  }

  /**
   * Search external APIs for real jobs
   */
  private async searchExternalJobs(options: any) {
    const { query, location, country, limit } = options;
    const allJobs: any[] = [];
    
    // Search primary country and one additional country
    const countriesToSearch = [country];
    if (country !== 'IN') {
      countriesToSearch.push('IN'); // Always include India
    }

    // Use 2 search queries
    const searchQueries = this.generateSearchQueries(query);

    for (const searchCountry of countriesToSearch.slice(0, 2)) {
      const countryConfig = COUNTRY_CONFIGS[searchCountry as keyof typeof COUNTRY_CONFIGS] || COUNTRY_CONFIGS.IN;
      
      console.log(`🌍 Searching external APIs in ${countryConfig.name} (${searchCountry})`);

      // Parallel API calls
      const apiPromises = [
        fetchFromAdzuna(searchQueries[0], countryConfig.adzuna, 1, {
          location: location || undefined,
          distanceKm: 25
        }).catch(err => {
          console.warn(`Adzuna failed for ${searchCountry}:`, err);
          return [];
        }),
        fetchFromJSearch(searchQueries[0], countryConfig.jsearch, 1).catch(err => {
          console.warn(`JSearch failed for ${searchCountry}:`, err);
          return [];
        }),
        fetchFromGoogleJobs(searchQueries[1] || searchQueries[0], countryConfig.google, 1).catch(err => {
          console.warn(`Google Jobs failed for ${searchCountry}:`, err);
          return [];
        })
      ];

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
   * Generate search queries
   */
  private generateSearchQueries(baseQuery: string): string[] {
    if (!baseQuery) {
      return ['software engineer', 'developer'];
    }

    return [
      baseQuery,
      `${baseQuery} jobs`
    ];
  }

  /**
   * Generate minimal sample jobs (only when needed)
   */
  private async generateMinimalSampleJobs(options: any) {
    const { query, location, country, limit } = options;
    const sampleJobs = [];

    const jobTitles = [
      'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
      'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer',
      'Mobile Developer', 'Cloud Engineer', 'Security Engineer', 'QA Engineer'
    ];

    const companies = [
      'TechCorp', 'InnovateLabs', 'Digital Solutions', 'CloudTech', 'DataFlow',
      'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio'
    ];

    const locations = [
      'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India',
      'New York, USA', 'San Francisco, USA', 'London, UK', 'Dubai, UAE'
    ];

    for (let i = 0; i < Math.min(limit, 20); i++) {
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
   * Remove duplicate jobs
   */
  private removeDuplicates(jobs: any[]): any[] {
    const seen = new Set();
    return jobs.filter(job => {
      const key = `${job.title}-${job.company}-${job.location}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort jobs by relevance and recency
   */
  private sortJobs(jobs: any[], options: { query: string; location: string }) {
    return jobs.sort((a, b) => {
      // Featured jobs first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // Real jobs before sample jobs
      if (a.source !== 'sample' && b.source === 'sample') return -1;
      if (a.source === 'sample' && b.source !== 'sample') return 1;

      // Recent jobs first
      const aDate = new Date(a.createdAt || a.postedAt || 0);
      const bDate = new Date(b.createdAt || b.postedAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  }
}

// Export singleton instance
export const realJobSearch = new RealJobSearch();
