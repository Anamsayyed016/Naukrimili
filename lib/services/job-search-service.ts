/**
 * Advanced Job Search Service
 * 
 * Senior-level implementation with:
 * - Optimized database queries
 * - Intelligent caching
 * - Advanced filtering and ranking
 * - Performance monitoring
 * - Error handling and fallbacks
 */

import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna } from '@/lib/jobs/providers';
import { JobSearchFilters, JobSearchResponse } from '@/types/jobs';

interface SearchMetrics {
  queryTime: number;
  cacheHit: boolean;
  resultsCount: number;
  sources: string[];
}

interface OptimizedSearchOptions {
  enableCache?: boolean;
  cacheTTL?: number; // in seconds
  maxResults?: number;
  includeExternal?: boolean;
  enableRanking?: boolean;
}

export class JobSearchService {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly DEFAULT_CACHE_TTL = 300; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 1000;

  /**
   * Advanced job search with intelligent caching and ranking
   */
  static async searchJobs(
    filters: JobSearchFilters,
    options: OptimizedSearchOptions = {}
  ): Promise<{ data: JobSearchResponse; metrics: SearchMetrics }> {
    const startTime = Date.now();
    const {
      enableCache = true,
      cacheTTL = this.DEFAULT_CACHE_TTL,
      maxResults = 50,
      includeExternal = true,
      enableRanking = true
    } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(filters);
    
    // Check cache first
    if (enableCache) {
      const cached = this.getFromCache(cacheKey, cacheTTL);
      if (cached) {
        return {
          data: cached,
          metrics: {
            queryTime: Date.now() - startTime,
            cacheHit: true,
            resultsCount: cached.jobs.length,
            sources: ['cache']
          }
        };
      }
    }

    try {
      // Build optimized database query
      const dbQuery = this.buildOptimizedQuery(filters);
      
      // Execute database search with parallel external API calls
      const [dbJobs, externalJobs] = await Promise.allSettled([
        this.searchDatabase(dbQuery, maxResults),
        includeExternal ? this.searchExternalAPIs(filters) : Promise.resolve([])
      ]);

      const jobs = [
        ...(dbJobs.status === 'fulfilled' ? dbJobs.value : []),
        ...(externalJobs.status === 'fulfilled' ? externalJobs.value : [])
      ];

      // Apply intelligent ranking
      const rankedJobs = enableRanking ? this.rankJobs(jobs, filters) : jobs;

      // Limit results
      const limitedJobs = rankedJobs.slice(0, maxResults);

      // Prepare response
      const response: JobSearchResponse = {
        success: true,
        jobs: limitedJobs,
        pagination: {
          page: 1, // Default page since it's not in JobSearchFilters
          limit: maxResults,
          total: limitedJobs.length,
          total_pages: Math.ceil(limitedJobs.length / maxResults),
          has_next: false,
          has_prev: false
        },
        filters: {
          applied: filters,
          available: {
            jobTypes: [],
            experienceLevels: [],
            sectors: [],
            locations: [],
            companies: []
          }
        },
        search_time_ms: Date.now() - startTime
      };

      // Cache the results
      if (enableCache) {
        this.setCache(cacheKey, response, cacheTTL);
      }

      return {
        data: response,
        metrics: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          resultsCount: limitedJobs.length,
          sources: [
            ...(dbJobs.status === 'fulfilled' ? ['database'] : []),
            ...(externalJobs.status === 'fulfilled' ? ['external'] : [])
          ]
        }
      };

    } catch (error) {
      console.error('Job search error:', error);
      throw new Error('Job search failed');
    }
  }

  /**
   * Build optimized database query with proper indexing
   */
  private static buildOptimizedQuery(filters: JobSearchFilters) {
    const where: any = { isActive: true };

    // Text search with full-text indexing
    if (filters.query?.trim()) {
      where.OR = [
        { title: { contains: filters.query.trim(), mode: 'insensitive' } },
        { description: { contains: filters.query.trim(), mode: 'insensitive' } },
        { company: { contains: filters.query.trim(), mode: 'insensitive' } },
        { skills: { has: filters.query.trim() } }
      ];
    }

    // Location filtering with smart matching
    if (filters.location?.trim()) {
      const location = filters.location.trim();
      where.OR = [
        { location: { contains: location, mode: 'insensitive' } },
        { location: { contains: location.split(',')[0], mode: 'insensitive' } }
      ];
    }

    // Salary range filtering
    if (filters.salary_min || filters.salary_max) {
      where.AND = where.AND || [];
      if (filters.salary_min) {
        where.AND.push({ salaryMin: { gte: filters.salary_min } });
      }
      if (filters.salary_max) {
        where.AND.push({ salaryMax: { lte: filters.salary_max } });
      }
    }

    // Job type filtering
    if (filters.job_type && filters.job_type !== 'all') {
      where.jobType = filters.job_type;
    }

    // Experience level filtering
    if (filters.experience_level && filters.experience_level !== 'all') {
      where.experienceLevel = filters.experience_level;
    }

    // Remote work filtering
    if (filters.remote_only) {
      where.isRemote = true;
    }

    // Sector filtering
    if (filters.sector?.trim()) {
      where.sector = { contains: filters.sector.trim(), mode: 'insensitive' };
    }

    // Country filtering
    if (filters.country?.trim()) {
      where.country = filters.country.trim().toUpperCase();
    }

    return where;
  }

  /**
   * Search database with optimized queries
   */
  private static async searchDatabase(where: any, limit: number) {
    return await prisma.job.findMany({
      where,
      take: limit,
      orderBy: [
        { isFeatured: 'desc' },
        { isUrgent: 'desc' },
        { postedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        companyRelation: {
          select: {
            id: true,
            name: true,
            logo: true,
            location: true,
            industry: true,
            website: true
          }
        },
        _count: {
          select: {
            applications: true,
            bookmarks: true
          }
        }
      }
    });
  }

  /**
   * Search external APIs with error handling
   */
  private static async searchExternalAPIs(filters: JobSearchFilters) {
    try {
      const country = filters.country || 'IN';
      const query = filters.query || 'software developer';
      
      const externalJobs = await fetchFromAdzuna(
        query,
        country.toLowerCase(),
        1,
        {
          location: filters.location,
          distanceKm: 50
        }
      );

      return externalJobs.map(job => ({
        ...job,
        source: 'external',
        isExternal: true
      }));
    } catch (error) {
      console.warn('External API search failed:', error);
      return [];
    }
  }

  /**
   * Intelligent job ranking algorithm
   */
  private static rankJobs(jobs: any[], filters: JobSearchFilters) {
    return jobs.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Featured jobs get highest priority
      if (a.isFeatured) scoreA += 100;
      if (b.isFeatured) scoreB += 100;

      // Urgent jobs get high priority
      if (a.isUrgent) scoreA += 50;
      if (b.isUrgent) scoreB += 50;

      // Recent jobs get higher priority
      const now = new Date();
      const aAge = now.getTime() - new Date(a.postedAt || a.createdAt).getTime();
      const bAge = now.getTime() - new Date(b.postedAt || b.createdAt).getTime();
      scoreA += Math.max(0, 30 - (aAge / (1000 * 60 * 60 * 24))); // 30 points for fresh jobs
      scoreB += Math.max(0, 30 - (bAge / (1000 * 60 * 60 * 24)));

      // Skills matching
      if (filters.skills?.length) {
        const aSkillsMatch = a.skills?.filter((skill: string) => 
          filters.skills!.some(filterSkill => 
            skill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        ).length || 0;
        const bSkillsMatch = b.skills?.filter((skill: string) => 
          filters.skills!.some(filterSkill => 
            skill.toLowerCase().includes(filterSkill.toLowerCase())
          )
        ).length || 0;
        scoreA += aSkillsMatch * 10;
        scoreB += bSkillsMatch * 10;
      }

      // Location matching
      if (filters.location) {
        const aLocationMatch = a.location?.toLowerCase().includes(filters.location.toLowerCase()) ? 20 : 0;
        const bLocationMatch = b.location?.toLowerCase().includes(filters.location.toLowerCase()) ? 20 : 0;
        scoreA += aLocationMatch;
        scoreB += bLocationMatch;
      }

      // Company reputation (based on job count)
      scoreA += Math.min(a._count?.applications || 0, 20);
      scoreB += Math.min(b._count?.applications || 0, 20);

      return scoreB - scoreA;
    });
  }

  /**
   * Generate cache key from filters
   */
  private static generateCacheKey(filters: JobSearchFilters): string {
    const key = JSON.stringify({
      query: filters.query,
      location: filters.location,
      country: filters.country,
      job_type: filters.job_type,
      experience_level: filters.experience_level,
      salary_min: filters.salary_min,
      salary_max: filters.salary_max,
      remote_only: filters.remote_only,
      sector: filters.sector
    });
    return `job_search_${Buffer.from(key).toString('base64')}`;
  }

  /**
   * Get data from cache
   */
  private static getFromCache(key: string, ttl: number): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > ttl * 1000;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache with size management
   */
  private static setCache(key: string, data: any, ttl: number): void {
    // Manage cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      keys: Array.from(this.cache.keys())
    };
  }
}
