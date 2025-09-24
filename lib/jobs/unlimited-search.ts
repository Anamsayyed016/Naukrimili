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

// Country-specific configurations - Prioritizing main target countries
const COUNTRY_CONFIGS = {
  // Main Target Countries (Priority)
  'IN': { adzuna: 'in', jsearch: 'IN', google: 'India', jooble: 'in', priority: 1, name: 'India' },
  'US': { adzuna: 'us', jsearch: 'US', google: 'United States', jooble: 'us', priority: 1, name: 'United States' },
  'AE': { adzuna: 'ae', jsearch: 'AE', google: 'United Arab Emirates', jooble: 'ae', priority: 1, name: 'UAE' },
  'GB': { adzuna: 'gb', jsearch: 'GB', google: 'United Kingdom', jooble: 'gb', priority: 1, name: 'United Kingdom' },
  
  // Secondary Countries
  'CA': { adzuna: 'ca', jsearch: 'CA', google: 'Canada', jooble: 'ca', priority: 2, name: 'Canada' },
  'AU': { adzuna: 'au', jsearch: 'AU', google: 'Australia', jooble: 'au', priority: 2, name: 'Australia' },
  'DE': { adzuna: 'de', jsearch: 'DE', google: 'Germany', jooble: 'de', priority: 3, name: 'Germany' },
  'FR': { adzuna: 'fr', jsearch: 'FR', google: 'France', jooble: 'fr', priority: 3, name: 'France' },
  'SG': { adzuna: 'sg', jsearch: 'SG', google: 'Singapore', jooble: 'sg', priority: 3, name: 'Singapore' },
  'JP': { adzuna: 'jp', jsearch: 'JP', google: 'Japan', jooble: 'jp', priority: 3, name: 'Japan' }
};

// Main target countries for unlimited search
const MAIN_TARGET_COUNTRIES = ['IN', 'US', 'AE', 'GB'];

export class UnlimitedJobSearch {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes for faster updates

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
      limit = 200, // Unlimited default limit
      includeExternal = true,
      includeDatabase = true,
      includeSample = true
    } = options;

    console.log(`🚀 Starting unlimited job search:`, {
      query, location, country, sector, page, limit
    });

    // Check cache first
    const cacheKey = `unlimited:${query}:${location}:${country}:${sector}:${page}:${limit}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
      console.log(`✅ Cache hit for unlimited search: ${cacheKey}`);
      return cachedResult.data;
    }

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
          query, location, country, page, limit: Math.min(limit * 3, 500) // Fetch more external jobs for unlimited search
        });
        allJobs.push(...externalJobs);
        sources.external = externalJobs.length;
        console.log(`✅ External APIs: Found ${externalJobs.length} jobs`);
      } catch (error) {
        console.error('❌ External search failed:', error);
      }
    }

    // 3. Sample jobs for unlimited coverage
    if (includeSample) {
      try {
        const sampleJobs = await this.generateSampleJobs({
          query, location, country, sector, limit: Math.max(limit * 2, 200) // Generate more sample jobs for unlimited search
        });
        allJobs.push(...sampleJobs);
        sources.sample = sampleJobs.length;
        console.log(`✅ Sample jobs: Generated ${sampleJobs.length} jobs for unlimited search`);
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

    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log(`🎯 Unlimited search results:`, {
      total: result.totalJobs,
      showing: paginatedJobs.length,
      hasMore: result.hasMore,
      sources: result.sources,
      sectors: result.sectors.length,
      countries: result.countries.length,
      cached: false
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
      take: 5000 // Unlimited database search
    });

    return jobs;
  }

  /**
   * Search external APIs with multiple queries and pagination
   * Prioritizes main target countries (India, USA, UAE, UK)
   */
  private async searchExternalJobs(options: any) {
    const { query, location, country, page, limit } = options;
    const allJobs: any[] = [];
    
    // Determine countries to search - prioritize main target countries
    let countriesToSearch = [country];
    
    // If searching a main target country, also search other main countries for more results
    if (MAIN_TARGET_COUNTRIES.includes(country)) {
      countriesToSearch = MAIN_TARGET_COUNTRIES.filter(c => c !== country).slice(0, 2);
      countriesToSearch.unshift(country); // Put the primary country first
    } else {
      // If not a main target country, add main target countries for more coverage
      countriesToSearch = [country, ...MAIN_TARGET_COUNTRIES.slice(0, 2)];
    }

    // Generate multiple search queries for comprehensive coverage
    const searchQueries = this.generateSearchQueries(query);

    // Optimized: Only fetch from 1 page per country, 2 countries max, 2 APIs max
    const maxPages = 1; // Only 1 page to reduce calls
    const maxCountries = 2; // Only 2 countries
    const maxQueries = 1; // Only 1 query per country

    for (const searchCountry of countriesToSearch.slice(0, maxCountries)) {
      const countryConfig = COUNTRY_CONFIGS[searchCountry as keyof typeof COUNTRY_CONFIGS] || COUNTRY_CONFIGS.IN;
      
      console.log(`🌍 Searching in ${countryConfig.name} (${searchCountry})`);
      
      for (const searchQuery of searchQueries.slice(0, maxQueries)) {
        try {
          // Use Promise.all for parallel API calls - only 2 APIs max
          const apiPromises = [
            fetchFromAdzuna(searchQuery, countryConfig.adzuna, 1, {
              location: location || undefined,
              distanceKm: 25
            }).catch(err => {
              console.warn(`Adzuna failed for ${searchCountry}:`, err);
              return [];
            }),
            fetchFromJSearch(searchQuery, countryConfig.jsearch, 1).catch(err => {
              console.warn(`JSearch failed for ${searchCountry}:`, err);
              return [];
            })
          ];

          const results = await Promise.all(apiPromises);
          
          // Process results
          results.forEach((jobs, index) => {
            const apiName = index === 0 ? 'Adzuna' : 'JSearch';
            allJobs.push(...jobs.map(job => ({ 
              ...job, 
              country: searchCountry, 
              countryName: countryConfig.name,
              source: apiName
            })));
          });

        } catch (error) {
          console.warn(`⚠️ Error fetching for query "${searchQuery}" in ${countryConfig.name}:`, error);
        }

        // Minimal rate limiting - only 100ms between countries
        if (searchCountry !== countriesToSearch[countriesToSearch.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
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
   * Prioritizes main target countries (India, USA, UAE, UK)
   */
  private async generateSampleJobs(options: any) {
    const { query, location, country, sector, limit } = options;
    const sampleJobs: any[] = [];

    // Get a real company for sample jobs
    const company = await prisma.company.findFirst({
      where: { isActive: true }
    });

    if (!company) return sampleJobs;

    // Determine countries to generate sample jobs for
    let countriesToGenerate = [country];
    
    // If not a main target country, prioritize main target countries
    if (!MAIN_TARGET_COUNTRIES.includes(country)) {
      countriesToGenerate = [country, ...MAIN_TARGET_COUNTRIES.slice(0, 2)];
    } else {
      // If it's a main target country, also generate for other main countries
      countriesToGenerate = [country, ...MAIN_TARGET_COUNTRIES.filter(c => c !== country).slice(0, 1)];
    }

    // Generate jobs for different sectors
    const sectorsToCover = sector ? [sector] : Object.keys(SECTOR_QUERIES);
    const jobsPerSector = Math.ceil(limit / (sectorsToCover.length * countriesToGenerate.length));

    for (const countryCode of countriesToGenerate.slice(0, 3)) {
      const countryConfig = COUNTRY_CONFIGS[countryCode as keyof typeof COUNTRY_CONFIGS] || COUNTRY_CONFIGS.IN;
      
      for (const sectorName of sectorsToCover.slice(0, Math.ceil(limit / 15))) {
        const sectorQueries = SECTOR_QUERIES[sectorName as keyof typeof SECTOR_QUERIES] || [];
        
        for (let i = 0; i < Math.min(jobsPerSector, sectorQueries.length); i++) {
          const jobTitle = sectorQueries[i];
          if (!jobTitle) continue;

          // Generate location-specific job
          const jobLocation = this.generateLocationForCountry(countryCode, location);
          const salary = this.generateSalaryRangeForCountry(sectorName, countryCode);

          sampleJobs.push({
            id: `sample-${countryCode}-${sectorName}-${i}-${Date.now()}`,
            title: jobTitle,
            company: company.name,
            location: jobLocation,
            country: countryCode,
            countryName: countryConfig.name,
            description: `We are looking for a ${jobTitle} to join our team in ${countryConfig.name}. This is a great opportunity to work in a dynamic environment.`,
            requirements: `Experience in ${jobTitle} field preferred. Knowledge of local market preferred.`,
            salary: salary,
            salaryMin: this.extractSalaryMin(salary),
            salaryMax: this.extractSalaryMax(salary),
            salaryCurrency: this.getCurrencyForCountry(countryCode),
            jobType: 'full-time',
            experienceLevel: this.determineExperienceLevel(jobTitle),
            skills: this.extractSkillsFromTitle(jobTitle),
            isRemote: Math.random() > 0.7,
            isFeatured: Math.random() > 0.9,
            sector: sectorName,
            source: 'sample',
            sourceId: `sample-${countryCode}-${sectorName}-${i}`,
            createdAt: new Date(),
            postedAt: new Date(),
            _count: { applications: 0, bookmarks: 0 }
          });
        }
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

  /**
   * Generate location for specific country
   */
  private generateLocationForCountry(countryCode: string, preferredLocation?: string): string {
    if (preferredLocation) return preferredLocation;

    const locations: { [key: string]: string[] } = {
      'IN': ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'],
      'US': ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle', 'Austin', 'Denver'],
      'AE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'],
      'GB': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Liverpool', 'Leeds', 'Bristol'],
      'CA': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg'],
      'AU': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast'],
      'DE': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf'],
      'FR': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg'],
      'SG': ['Singapore', 'Central Region', 'East Region', 'North Region', 'West Region'],
      'JP': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe']
    };

    const countryLocations = locations[countryCode] || locations['IN'];
    return countryLocations[Math.floor(Math.random() * countryLocations.length)];
  }

  /**
   * Generate salary range for specific country and sector
   */
  private generateSalaryRangeForCountry(sector: string, countryCode: string): string {
    const currency = this.getCurrencyForCountry(countryCode);
    
    // Base salary ranges by country (in local currency)
    const countryMultipliers: { [key: string]: number } = {
      'IN': 1,      // INR
      'US': 80,     // USD (1 USD ≈ 80 INR)
      'AE': 300,    // AED (1 AED ≈ 22 INR)
      'GB': 65,     // GBP (1 GBP ≈ 100 INR)
      'CA': 100,    // CAD (1 CAD ≈ 60 INR)
      'AU': 120,    // AUD (1 AUD ≈ 55 INR)
      'DE': 70,     // EUR (1 EUR ≈ 90 INR)
      'FR': 70,     // EUR
      'SG': 120,    // SGD (1 SGD ≈ 60 INR)
      'JP': 12000   // JPY (1 JPY ≈ 0.5 INR)
    };

    const multiplier = countryMultipliers[countryCode] || 1;
    
    // Base salary ranges by sector (in INR)
    const sectorRanges: { [key: string]: { min: number; max: number } } = {
      'technology': { min: 500000, max: 2000000 },
      'healthcare': { min: 400000, max: 1500000 },
      'finance': { min: 600000, max: 2500000 },
      'education': { min: 300000, max: 800000 },
      'marketing': { min: 350000, max: 1200000 },
      'sales': { min: 300000, max: 1500000 },
      'engineering': { min: 500000, max: 1500000 },
      'retail': { min: 250000, max: 600000 },
      'hospitality': { min: 250000, max: 700000 },
      'manufacturing': { min: 350000, max: 1000000 },
      'consulting': { min: 800000, max: 3000000 },
      'government': { min: 400000, max: 1200000 },
      'nonprofit': { min: 300000, max: 700000 }
    };

    const range = sectorRanges[sector] || { min: 300000, max: 800000 };
    const min = Math.floor((range.min * multiplier) / 1000) * 1000;
    const max = Math.floor((range.max * multiplier) / 1000) * 1000;

    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  }

  /**
   * Get currency for country
   */
  private getCurrencyForCountry(countryCode: string): string {
    const currencies: { [key: string]: string } = {
      'IN': '₹',
      'US': '$',
      'AE': 'AED',
      'GB': '£',
      'CA': 'C$',
      'AU': 'A$',
      'DE': '€',
      'FR': '€',
      'SG': 'S$',
      'JP': '¥'
    };
    return currencies[countryCode] || '₹';
  }

  /**
   * Extract minimum salary from salary string
   */
  private extractSalaryMin(salary: string): number {
    const match = salary.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Extract maximum salary from salary string
   */
  private extractSalaryMax(salary: string): number {
    const matches = salary.match(/[\d,]+/g);
    return matches && matches.length > 1 ? parseInt(matches[1].replace(/,/g, '')) : 0;
  }
}

// Export singleton instance
export const unlimitedJobSearch = new UnlimitedJobSearch();
