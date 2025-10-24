/**
 * Real Job Search System
 * Focuses on fetching real jobs from database and external APIs
 * Minimizes sample jobs to ensure quality job listings
 */

import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromIndeed, fetchFromZipRecruiter } from './providers';

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
          query, location, country, page, limit: Math.min(limit * 3, 500)
        });
      allJobs.push(...externalJobs);
      sources.external = externalJobs.length;
      console.log(`✅ External APIs: Found ${externalJobs.length} real jobs`);
    } catch (error) {
      console.error('❌ External search failed:', error);
    }

    // 3. NO FAKE JOBS - Only real jobs from APIs
    // Disabled diverse job generation - we only want real jobs from external APIs
    console.log(`⚠️ Skipping fake diverse job generation - only returning real jobs from APIs`);

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

    // Use actual job count for pagination
    const actualTotalJobs = uniqueJobs.length;
    const hasMore = endIndex < actualTotalJobs;

    const result: RealJobSearchResult = {
      jobs: paginatedJobs,
      totalJobs: actualTotalJobs,
      hasMore: hasMore,
      nextPage: hasMore ? page + 1 : undefined,
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
      // Include real jobs (manual, external, but exclude sample)
      source: { not: 'sample' }
    };

    // Build AND conditions for proper filtering
    const andConditions: any[] = [];

    // Text search (query) - multiple field search with OR within this condition
    if (filters.query) {
      andConditions.push({
        OR: [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { description: { contains: filters.query, mode: 'insensitive' } },
          { company: { contains: filters.query, mode: 'insensitive' } }
        ]
      });
    }

    // Location filtering - separate AND condition
    if (filters.location) {
      andConditions.push({
        location: { contains: filters.location, mode: 'insensitive' }
      });
    }

    // Apply AND conditions if any exist
    if (andConditions.length > 0) {
      where.AND = andConditions;
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
      take: Math.min(limit * 10, 5000) // Unlimited database search
    });

    console.log(`🔍 Database query found ${jobs.length} jobs with sources:`, 
      jobs.map(j => ({ id: j.id, title: j.title, source: j.source }))
    );

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

      // Parallel API calls - Only working APIs
      const apiPromises = [
        fetchFromAdzuna(searchQueries[0], countryConfig.adzuna, 1, {
          location: location || undefined,
          distanceKm: 25
        }).catch(err => {
          console.warn(`Adzuna failed for ${searchCountry}:`, err);
          return [];
        }),
        fetchFromIndeed(searchQueries[0], countryConfig.name, 1).catch(err => {
          console.warn(`Indeed failed for ${searchCountry}:`, err);
          return [];
        }),
        fetchFromZipRecruiter(searchQueries[0], countryConfig.name, 1).catch(err => {
          console.warn(`ZipRecruiter failed for ${searchCountry}:`, err);
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
   * Generate diverse jobs for better pagination
   */
  private async generateDiverseJobs(options: any) {
    const { query, location, country, limit } = options;
    const jobs = [];

    const jobTitles = [
      'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
      'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer',
      'Mobile Developer', 'Cloud Engineer', 'Security Engineer', 'QA Engineer',
      'Business Analyst', 'Project Manager', 'Sales Manager', 'Marketing Specialist',
      'HR Manager', 'Financial Analyst', 'Content Writer', 'Customer Success Manager',
      'Operations Manager', 'Business Development Manager', 'Account Manager', 'Technical Writer'
    ];

    const companies = [
      'TechCorp', 'InnovateLabs', 'Digital Solutions', 'CloudTech', 'DataFlow',
      'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio',
      'BusinessFirst', 'GrowthCorp', 'CreativeAgency', 'SmartSolutions', 'FutureTech',
      'ProActive', 'NextGen', 'InnovationHub', 'TechPioneers', 'DigitalMasters'
    ];

    const locations = [
      'Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India',
      'Chennai, India', 'Pune, India', 'Kolkata, India', 'Gurgaon, India',
      'New York, USA', 'San Francisco, USA', 'London, UK', 'Dubai, UAE',
      'Singapore', 'Sydney, Australia', 'Toronto, Canada', 'Berlin, Germany'
    ];

    const sectors = [
      'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing',
      'Sales', 'Human Resources', 'Operations', 'Consulting', 'Media'
    ];

    for (let i = 0; i < Math.min(limit, 100); i++) {
      const title = query ? `${query} ${i + 1}` : jobTitles[i % jobTitles.length];
      const company = companies[i % companies.length];
      const jobLocation = location || locations[i % locations.length];
      const sector = sectors[i % sectors.length];

      jobs.push({
        id: `diverse-${Date.now()}-${i}`,
        title,
        company,
        location: jobLocation,
        country: country,
        description: `Join ${company} as a ${title}. We are looking for talented professionals to join our growing team and contribute to exciting projects.`,
        salary: this.generateSalary(sector),
        jobType: ['Full-time', 'Part-time', 'Contract'][i % 3],
        experienceLevel: ['Entry Level', 'Mid Level', 'Senior Level'][i % 3],
        isRemote: Math.random() > 0.6,
        isFeatured: Math.random() > 0.8,
        sector: sector,
        postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        source: 'diverse',
        sourceId: `diverse-${i}`,
        applyUrl: '#',
        source_url: '#'
      });
    }

    return jobs;
  }

  /**
   * Generate salary based on sector
   */
  private generateSalary(sector: string): string {
    const salaryRanges = {
      'Technology': ['₹6,00,000 - ₹15,00,000', '₹8,00,000 - ₹20,00,000', '₹12,00,000 - ₹30,00,000'],
      'Healthcare': ['₹4,00,000 - ₹10,00,000', '₹6,00,000 - ₹15,00,000', '₹10,00,000 - ₹25,00,000'],
      'Finance': ['₹5,00,000 - ₹12,00,000', '₹8,00,000 - ₹18,00,000', '₹15,00,000 - ₹40,00,000'],
      'Education': ['₹3,00,000 - ₹8,00,000', '₹5,00,000 - ₹12,00,000', '₹8,00,000 - ₹20,00,000'],
      'Marketing': ['₹3,00,000 - ₹8,00,000', '₹5,00,000 - ₹12,00,000', '₹8,00,000 - ₹18,00,000']
    };
    
    const ranges = salaryRanges[sector] || salaryRanges['Technology'];
    return ranges[Math.floor(Math.random() * ranges.length)];
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
      'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio',
      'HealthCare Plus', 'FinanceFirst', 'EduTech Solutions', 'MarketingPro', 'SalesForce',
      'Engineering Corp', 'RetailMax', 'Hospitality Group', 'Manufacturing Inc', 'Consulting Partners'
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
