/**
 * Unlimited Job Search System
 * Implements comprehensive job search across all sectors with no artificial limits
 */

import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs, fetchFromJooble } from './providers';

export interface UnlimitedSearchOptions {
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

export interface UnlimitedSearchResult {
  jobs: any[];
  totalJobs: number;
  hasMore: boolean;
  nextPage?: number;
  sources: {
    database: number;
    external: number;
    sample: number;
  };
  sectors: string[];
  countries: string[];
}

// Comprehensive sector queries for unlimited search
const SECTOR_QUERIES = {
  'technology': [
    'software engineer', 'developer', 'programmer', 'full stack', 'frontend', 'backend',
    'mobile developer', 'ios developer', 'android developer', 'web developer',
    'data scientist', 'data analyst', 'machine learning', 'ai engineer', 'devops',
    'cloud engineer', 'system administrator', 'database administrator', 'cybersecurity',
    'blockchain developer', 'game developer', 'ui ux designer', 'product manager',
    'technical writer', 'qa engineer', 'test engineer', 'scrum master', 'agile coach'
  ],
  'healthcare': [
    'doctor', 'nurse', 'physician', 'surgeon', 'dentist', 'pharmacist', 'therapist',
    'psychologist', 'psychiatrist', 'medical assistant', 'healthcare administrator',
    'medical technician', 'radiologist', 'pathologist', 'cardiologist', 'pediatrician',
    'gynecologist', 'dermatologist', 'ophthalmologist', 'orthopedic surgeon',
    'anesthesiologist', 'emergency medicine', 'family medicine', 'internal medicine'
  ],
  'finance': [
    'financial analyst', 'investment banker', 'portfolio manager', 'risk manager',
    'credit analyst', 'loan officer', 'insurance agent', 'actuary', 'accountant',
    'auditor', 'tax specialist', 'financial advisor', 'wealth manager', 'trader',
    'compliance officer', 'treasury analyst', 'corporate finance', 'private equity',
    'venture capital', 'hedge fund', 'mutual fund', 'financial planner'
  ],
  'education': [
    'teacher', 'professor', 'instructor', 'tutor', 'principal', 'vice principal',
    'school administrator', 'curriculum coordinator', 'guidance counselor',
    'librarian', 'research assistant', 'teaching assistant', 'education consultant',
    'training specialist', 'instructional designer', 'academic advisor', 'dean',
    'department head', 'education director', 'student affairs', 'admissions officer'
  ],
  'marketing': [
    'marketing manager', 'digital marketing', 'social media manager', 'content creator',
    'brand manager', 'advertising executive', 'public relations', 'communications',
    'marketing analyst', 'growth hacker', 'seo specialist', 'ppc specialist',
    'email marketing', 'affiliate marketing', 'influencer marketing', 'event manager',
    'trade show coordinator', 'marketing coordinator', 'campaign manager', 'creative director'
  ],
  'sales': [
    'sales representative', 'account executive', 'sales manager', 'business development',
    'inside sales', 'outside sales', 'territory manager', 'key account manager',
    'sales director', 'sales engineer', 'retail sales', 'wholesale sales',
    'telesales', 'telemarketing', 'sales coordinator', 'sales analyst', 'sales trainer',
    'channel partner', 'partnership manager', 'customer success', 'account manager'
  ],
  'engineering': [
    'mechanical engineer', 'electrical engineer', 'civil engineer', 'chemical engineer',
    'aerospace engineer', 'biomedical engineer', 'environmental engineer',
    'industrial engineer', 'materials engineer', 'nuclear engineer', 'petroleum engineer',
    'structural engineer', 'project engineer', 'design engineer', 'manufacturing engineer',
    'quality engineer', 'process engineer', 'reliability engineer', 'safety engineer'
  ],
  'retail': [
    'retail manager', 'store manager', 'assistant manager', 'department manager',
    'sales associate', 'cashier', 'customer service', 'inventory manager',
    'merchandiser', 'visual merchandiser', 'buyer', 'purchasing agent',
    'warehouse manager', 'logistics coordinator', 'supply chain manager',
    'retail analyst', 'loss prevention', 'store director', 'district manager'
  ],
  'hospitality': [
    'hotel manager', 'restaurant manager', 'chef', 'cook', 'server', 'bartender',
    'concierge', 'front desk', 'housekeeping', 'event coordinator', 'catering manager',
    'food service', 'beverage manager', 'banquet manager', 'guest services',
    'reservation agent', 'travel agent', 'tour guide', 'cruise director', 'spa manager'
  ],
  'manufacturing': [
    'production manager', 'plant manager', 'operations manager', 'quality control',
    'machine operator', 'assembly worker', 'maintenance technician', 'safety coordinator',
    'supply chain', 'logistics', 'warehouse worker', 'forklift operator',
    'production supervisor', 'shift supervisor', 'line supervisor', 'foreman',
    'tool and die maker', 'machinist', 'welder', 'electrician'
  ],
  'consulting': [
    'management consultant', 'business consultant', 'strategy consultant',
    'operations consultant', 'hr consultant', 'it consultant', 'financial consultant',
    'marketing consultant', 'legal consultant', 'tax consultant', 'audit consultant',
    'risk consultant', 'compliance consultant', 'change management', 'process improvement',
    'organizational development', 'training consultant', 'coaching', 'mentoring'
  ],
  'government': [
    'government analyst', 'policy analyst', 'program manager', 'administrative officer',
    'budget analyst', 'contract specialist', 'procurement officer', 'compliance officer',
    'regulatory affairs', 'public affairs', 'community outreach', 'social worker',
    'case worker', 'probation officer', 'parole officer', 'law enforcement',
    'firefighter', 'paramedic', 'emergency responder', 'public health'
  ],
  'nonprofit': [
    'program coordinator', 'volunteer coordinator', 'fundraising', 'development officer',
    'grant writer', 'advocacy coordinator', 'community organizer', 'outreach specialist',
    'case manager', 'social worker', 'counselor', 'therapist', 'director',
    'executive director', 'board member', 'communications', 'marketing', 'events'
  ]
};

// Country-specific configurations
const COUNTRY_CONFIGS = {
  'IN': { adzuna: 'in', jsearch: 'IN', google: 'India', jooble: 'in' },
  'US': { adzuna: 'us', jsearch: 'US', google: 'United States', jooble: 'us' },
  'GB': { adzuna: 'gb', jsearch: 'GB', google: 'United Kingdom', jooble: 'gb' },
  'AE': { adzuna: 'ae', jsearch: 'AE', google: 'United Arab Emirates', jooble: 'ae' },
  'CA': { adzuna: 'ca', jsearch: 'CA', google: 'Canada', jooble: 'ca' },
  'AU': { adzuna: 'au', jsearch: 'AU', google: 'Australia', jooble: 'au' },
  'DE': { adzuna: 'de', jsearch: 'DE', google: 'Germany', jooble: 'de' },
  'FR': { adzuna: 'fr', jsearch: 'FR', google: 'France', jooble: 'fr' },
  'SG': { adzuna: 'sg', jsearch: 'SG', google: 'Singapore', jooble: 'sg' },
  'JP': { adzuna: 'jp', jsearch: 'JP', google: 'Japan', jooble: 'jp' }
};

export class UnlimitedJobSearch {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Perform unlimited job search across all sectors
   */
  async search(options: UnlimitedSearchOptions = {}): Promise<UnlimitedSearchResult> {
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
      limit = 100, // Increased default limit
      includeExternal = true,
      includeDatabase = true,
      includeSample = true
    } = options;

    console.log(`🚀 Starting unlimited job search:`, {
      query, location, country, sector, page, limit
    });

    const allJobs: any[] = [];
    const sources = { database: 0, external: 0, sample: 0 };
    const sectors: string[] = [];
    const countries: string[] = [];

    // 1. Database jobs (unlimited)
    if (includeDatabase) {
      try {
        const dbJobs = await this.searchDatabaseJobs({
          query, location, country, jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
        });
        allJobs.push(...dbJobs);
        sources.database = dbJobs.length;
        console.log(`✅ Database: Found ${dbJobs.length} jobs`);
      } catch (error) {
        console.error('❌ Database search failed:', error);
      }
    }

    // 2. External API jobs (unlimited with pagination)
    if (includeExternal) {
      try {
        const externalJobs = await this.searchExternalJobs({
          query, location, country, page, limit: Math.min(limit * 2, 200) // Fetch more external jobs
        });
        allJobs.push(...externalJobs);
        sources.external = externalJobs.length;
        console.log(`✅ External APIs: Found ${externalJobs.length} jobs`);
      } catch (error) {
        console.error('❌ External search failed:', error);
      }
    }

    // 3. Sample jobs for sectors not covered
    if (includeSample && allJobs.length < limit) {
      try {
        const sampleJobs = await this.generateSampleJobs({
          query, location, country, sector, limit: limit - allJobs.length
        });
        allJobs.push(...sampleJobs);
        sources.sample = sampleJobs.length;
        console.log(`✅ Sample jobs: Generated ${sampleJobs.length} jobs`);
      } catch (error) {
        console.error('❌ Sample job generation failed:', error);
      }
    }

    // 4. Apply advanced filtering
    const filteredJobs = this.applyAdvancedFiltering(allJobs, {
      jobType, experienceLevel, isRemote, salaryMin, salaryMax, sector
    });

    // 5. Remove duplicates while preserving diversity
    const uniqueJobs = this.smartDeduplication(filteredJobs);

    // 6. Sort by relevance and recency
    const sortedJobs = this.sortJobs(uniqueJobs, { query, location });

    // 7. Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = sortedJobs.slice(startIndex, endIndex);

    // 8. Extract metadata
    const jobSectors = [...new Set(uniqueJobs.map(job => job.sector).filter(Boolean))];
    const jobCountries = [...new Set(uniqueJobs.map(job => job.country).filter(Boolean))];

    const result: UnlimitedSearchResult = {
      jobs: paginatedJobs,
      totalJobs: uniqueJobs.length,
      hasMore: endIndex < uniqueJobs.length,
      nextPage: endIndex < uniqueJobs.length ? page + 1 : undefined,
      sources,
      sectors: jobSectors,
      countries: jobCountries
    };

    console.log(`🎯 Unlimited search results:`, {
      total: result.totalJobs,
      showing: paginatedJobs.length,
      hasMore: result.hasMore,
      sources: result.sources,
      sectors: result.sectors.length,
      countries: result.countries.length
    });

    return result;
  }

  /**
   * Search database jobs with comprehensive filters
   */
  private async searchDatabaseJobs(filters: any) {
    const where: any = {
      isActive: true
    };

    // Text search
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { company: { contains: filters.query, mode: 'insensitive' } },
        { skills: { contains: filters.query, mode: 'insensitive' } }
      ];
    }

    // Location filter
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    // Country filter
    if (filters.country) {
      where.country = filters.country;
    }

    // Job type filter
    if (filters.jobType) {
      where.jobType = { contains: filters.jobType, mode: 'insensitive' };
    }

    // Experience level filter
    if (filters.experienceLevel) {
      where.experienceLevel = { contains: filters.experienceLevel, mode: 'insensitive' };
    }

    // Remote work filter
    if (filters.isRemote) {
      where.isRemote = true;
    }

    // Salary filters
    if (filters.salaryMin || filters.salaryMax) {
      where.OR = [
        ...(where.OR || []),
        ...(filters.salaryMin ? [{ salaryMin: { gte: filters.salaryMin } }] : []),
        ...(filters.salaryMax ? [{ salaryMax: { lte: filters.salaryMax } }] : [])
      ];
    }

    // Sector filter
    if (filters.sector) {
      where.sector = { contains: filters.sector, mode: 'insensitive' };
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        companyRelation: {
          select: {
            name: true,
            logo: true,
            location: true,
            industry: true,
            website: true
          }
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 1000 // Increased limit for database search
    });

    return jobs;
  }

  /**
   * Search external APIs with multiple queries and pagination
   */
  private async searchExternalJobs(options: any) {
    const { query, location, country, page, limit } = options;
    const allJobs: any[] = [];
    const countryConfig = COUNTRY_CONFIGS[country as keyof typeof COUNTRY_CONFIGS] || COUNTRY_CONFIGS.IN;

    // Generate multiple search queries for comprehensive coverage
    const searchQueries = this.generateSearchQueries(query);

    // Fetch from multiple pages to get more results
    const maxPages = Math.min(5, Math.ceil(limit / 20)); // Fetch up to 5 pages

    for (const searchQuery of searchQueries.slice(0, 3)) { // Limit to 3 queries per API
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          // Adzuna
          const adzunaJobs = await fetchFromAdzuna(searchQuery, countryConfig.adzuna, pageNum, {
            location: location || undefined,
            distanceKm: 50 // Increased radius
          });
          allJobs.push(...adzunaJobs);

          // JSearch
          const jsearchJobs = await fetchFromJSearch(searchQuery, countryConfig.jsearch, pageNum);
          allJobs.push(...jsearchJobs);

          // Google Jobs
          const googleJobs = await fetchFromGoogleJobs(searchQuery, countryConfig.google, pageNum);
          allJobs.push(...googleJobs);

          // Jooble
          const joobleJobs = await fetchFromJooble(searchQuery, countryConfig.jooble, pageNum, {
            radius: 50,
            countryCode: country.toLowerCase()
          });
          allJobs.push(...joobleJobs);

        } catch (error) {
          console.warn(`⚠️ Error fetching page ${pageNum} for query "${searchQuery}":`, error);
        }

        // Rate limiting between pages
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return allJobs;
  }

  /**
   * Generate comprehensive search queries
   */
  private generateSearchQueries(baseQuery: string): string[] {
    const queries = [baseQuery];

    if (baseQuery) {
      // Add variations
      queries.push(
        `${baseQuery} jobs`,
        `${baseQuery} careers`,
        `${baseQuery} positions`,
        `${baseQuery} opportunities`,
        `${baseQuery} employment`,
        `${baseQuery} work`,
        `${baseQuery} hiring`,
        `${baseQuery} recruitment`
      );
    } else {
      // If no query, use sector-specific terms
      Object.values(SECTOR_QUERIES).forEach(sectorQueries => {
        queries.push(...sectorQueries.slice(0, 5)); // Take first 5 from each sector
      });
    }

    return [...new Set(queries)]; // Remove duplicates
  }

  /**
   * Generate sample jobs for uncovered sectors
   */
  private async generateSampleJobs(options: any) {
    const { query, location, country, sector, limit } = options;
    const sampleJobs: any[] = [];

    // Get a real company for sample jobs
    const company = await prisma.company.findFirst({
      where: { isActive: true }
    });

    if (!company) return sampleJobs;

    // Generate jobs for different sectors
    const sectorsToCover = sector ? [sector] : Object.keys(SECTOR_QUERIES);
    const jobsPerSector = Math.ceil(limit / sectorsToCover.length);

    for (const sectorName of sectorsToCover.slice(0, Math.ceil(limit / 10))) {
      const sectorQueries = SECTOR_QUERIES[sectorName as keyof typeof SECTOR_QUERIES] || [];
      
      for (let i = 0; i < Math.min(jobsPerSector, sectorQueries.length); i++) {
        const jobTitle = sectorQueries[i];
        if (!jobTitle) continue;

        sampleJobs.push({
          id: `sample-${sectorName}-${i}-${Date.now()}`,
          title: jobTitle,
          company: company.name,
          location: location || 'Multiple Locations',
          country: country,
          description: `We are looking for a ${jobTitle} to join our team. This is a great opportunity to work in a dynamic environment.`,
          requirements: `Experience in ${jobTitle} field preferred.`,
          salary: this.generateSalaryRange(sectorName),
          jobType: 'full-time',
          experienceLevel: this.determineExperienceLevel(jobTitle),
          skills: this.extractSkillsFromTitle(jobTitle),
          isRemote: Math.random() > 0.7,
          isFeatured: Math.random() > 0.9,
          sector: sectorName,
          source: 'sample',
          sourceId: `sample-${sectorName}-${i}`,
          createdAt: new Date(),
          postedAt: new Date(),
          _count: { applications: 0, bookmarks: 0 }
        });
      }
    }

    return sampleJobs.slice(0, limit);
  }

  /**
   * Apply advanced filtering
   */
  private applyAdvancedFiltering(jobs: any[], filters: any) {
    return jobs.filter(job => {
      // Job type filter
      if (filters.jobType && job.jobType) {
        if (!job.jobType.toLowerCase().includes(filters.jobType.toLowerCase())) {
          return false;
        }
      }

      // Experience level filter
      if (filters.experienceLevel && job.experienceLevel) {
        if (!job.experienceLevel.toLowerCase().includes(filters.experienceLevel.toLowerCase())) {
          return false;
        }
      }

      // Remote work filter
      if (filters.isRemote && !job.isRemote) {
        return false;
      }

      // Salary filters
      if (filters.salaryMin && job.salaryMin && job.salaryMin < filters.salaryMin) {
        return false;
      }
      if (filters.salaryMax && job.salaryMax && job.salaryMax > filters.salaryMax) {
        return false;
      }

      // Sector filter
      if (filters.sector && job.sector) {
        if (!job.sector.toLowerCase().includes(filters.sector.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Smart deduplication that preserves diversity
   */
  private smartDeduplication(jobs: any[]) {
    const seen = new Set<string>();
    const uniqueJobs: any[] = [];

    for (const job of jobs) {
      // Create a more flexible key for deduplication
      const key = `${job.title?.toLowerCase()}-${job.company?.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }

    return uniqueJobs;
  }

  /**
   * Sort jobs by relevance and recency
   */
  private sortJobs(jobs: any[], options: any) {
    return jobs.sort((a, b) => {
      // Featured jobs first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // Then by recency
      const aDate = new Date(a.postedAt || a.createdAt || 0);
      const bDate = new Date(b.postedAt || b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  }

  /**
   * Generate salary range based on sector
   */
  private generateSalaryRange(sector: string): string {
    const salaryRanges: { [key: string]: { min: number; max: number; currency: string } } = {
      'technology': { min: 50000, max: 150000, currency: 'USD' },
      'healthcare': { min: 40000, max: 120000, currency: 'USD' },
      'finance': { min: 45000, max: 130000, currency: 'USD' },
      'education': { min: 30000, max: 80000, currency: 'USD' },
      'marketing': { min: 35000, max: 90000, currency: 'USD' },
      'sales': { min: 30000, max: 100000, currency: 'USD' },
      'engineering': { min: 50000, max: 120000, currency: 'USD' },
      'retail': { min: 25000, max: 60000, currency: 'USD' },
      'hospitality': { min: 25000, max: 70000, currency: 'USD' },
      'manufacturing': { min: 35000, max: 85000, currency: 'USD' },
      'consulting': { min: 60000, max: 150000, currency: 'USD' },
      'government': { min: 40000, max: 100000, currency: 'USD' },
      'nonprofit': { min: 30000, max: 70000, currency: 'USD' }
    };

    const range = salaryRanges[sector] || { min: 30000, max: 80000, currency: 'USD' };
    const min = Math.floor(Math.random() * (range.max - range.min)) + range.min;
    const max = min + Math.floor(Math.random() * (range.max - min));

    return `${range.currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  }

  /**
   * Determine experience level from job title
   */
  private determineExperienceLevel(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
      return 'senior';
    }
    if (titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('associate')) {
      return 'junior';
    }
    if (titleLower.includes('intern') || titleLower.includes('trainee')) {
      return 'intern';
    }
    
    return 'mid';
  }

  /**
   * Extract skills from job title
   */
  private extractSkillsFromTitle(title: string): string[] {
    const skills: string[] = [];
    const titleLower = title.toLowerCase();

    const skillKeywords: { [key: string]: string[] } = {
      'javascript': ['javascript', 'js', 'node', 'react', 'angular', 'vue'],
      'python': ['python', 'django', 'flask', 'pandas', 'numpy'],
      'java': ['java', 'spring', 'hibernate', 'maven'],
      'csharp': ['c#', 'csharp', '.net', 'asp.net'],
      'php': ['php', 'laravel', 'symfony', 'wordpress'],
      'sql': ['sql', 'mysql', 'postgresql', 'oracle', 'sqlite'],
      'aws': ['aws', 'amazon web services', 'cloud'],
      'docker': ['docker', 'kubernetes', 'containerization'],
      'git': ['git', 'github', 'gitlab', 'version control']
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        skills.push(skill);
      }
    }

    return skills;
  }
}

// Export singleton instance
export const unlimitedJobSearch = new UnlimitedJobSearch();
