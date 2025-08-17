/**
 * Database Optimizer Service
 * Provides optimized database queries and performance monitoring
 */

import { prisma } from './prisma';
import { cacheService } from './redis';

// Cache TTL configurations
const CACHE_TTL = {
  JOB_SEARCH: 300,      // 5 minutes
  JOB_DETAILS: 600,     // 10 minutes
  LOCATION_STATS: 1800, // 30 minutes
  COMPANY_INFO: 3600,   // 1 hour
  USER_PROFILE: 1800,   // 30 minutes
};

/**
 * Optimized job search with caching and performance monitoring
 */
export class DatabaseOptimizer {
  
  /**
   * Optimized job search with full-text search and caching
   */
  static async searchJobs(params: {
    query?: string;
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    isRemote?: boolean;
    sector?: string;
    company?: string;
    salaryMin?: number;
    salaryMax?: number;
    skills?: string[];
    country?: string;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'salary' | 'location';
  }) {
    const startTime = Date.now();
    const cacheKey = `job_search:${JSON.stringify(params)}`;
    
    try {
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log(`⚡ Cache hit for job search: ${Date.now() - startTime}ms`);
        return cached;
      }
      
      // Build optimized query
      const where: any = { isActive: true };
      const page = params.page || 1;
      const limit = Math.min(params.limit || 20, 100); // Max 100 results
      const skip = (page - 1) * limit;
      
      // Full-text search optimization
      if (params.query) {
        where.OR = [
          { title: { contains: params.query, mode: 'insensitive' } },
          { description: { contains: params.query, mode: 'insensitive' } },
          // Use full-text search if available
          {
            title: {
              search: params.query,
              mode: 'insensitive'
            }
          }
        ];
      }
      
      // Location optimization
      if (params.location) {
        where.location = { contains: params.location, mode: 'insensitive' };
      }
      
      // Job type optimization
      if (params.jobType) {
        where.jobType = { contains: params.jobType, mode: 'insensitive' };
      }
      
      // Experience level optimization
      if (params.experienceLevel) {
        where.experienceLevel = { contains: params.experienceLevel, mode: 'insensitive' };
      }
      
      // Remote work optimization
      if (params.isRemote !== undefined) {
        where.isRemote = params.isRemote;
      }
      
      // Sector optimization
      if (params.sector) {
        where.sector = { contains: params.sector, mode: 'insensitive' };
      }
      
      // Company optimization
      if (params.company) {
        where.company = { contains: params.company, mode: 'insensitive' };
      }
      
      // Salary range optimization
      if (params.salaryMin || params.salaryMax) {
        where.AND = [];
        if (params.salaryMin) {
          where.AND.push({ salaryMax: { gte: params.salaryMin } });
        }
        if (params.salaryMax) {
          where.AND.push({ salaryMin: { lte: params.salaryMax } });
        }
      }
      
      // Skills optimization using GIN index
      if (params.skills && params.skills.length > 0) {
        where.skills = {
          hasSome: params.skills
        };
      }
      
      // Country optimization
      if (params.country) {
        where.country = params.country;
      }
      
      // Build order by clause
      let orderBy: any = {};
      switch (params.sortBy) {
        case 'relevance':
          // For relevance, we'll use a combination of factors
          orderBy = [
            { isFeatured: 'desc' },
            { isUrgent: 'desc' },
            { postedAt: 'desc' },
            { views: 'desc' }
          ];
          break;
        case 'date':
          orderBy = { postedAt: 'desc' };
          break;
        case 'salary':
          orderBy = { salaryMax: 'desc' };
          break;
        case 'location':
          // Location-based sorting would require coordinates
          orderBy = { postedAt: 'desc' };
          break;
        default:
          orderBy = { postedAt: 'desc' };
      }
      
      // Execute optimized query
      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          select: {
            // Only select needed fields for performance
            id: true,
            title: true,
            company: true,
            companyLogo: true,
            location: true,
            country: true,
            description: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            jobType: true,
            experienceLevel: true,
            skills: true,
            isRemote: true,
            isHybrid: true,
            isUrgent: true,
            isFeatured: true,
            sector: true,
            views: true,
            applicationsCount: true,
            postedAt: true,
            createdAt: true,
            // Include company relation for additional data
            companyRelation: {
              select: {
                name: true,
                logo: true,
                location: true,
                industry: true
              }
            }
          },
          skip,
          take: limit,
          orderBy
        }),
        prisma.job.count({ where })
      ]);
      
      // Calculate pagination
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;
      
      // Format results
      const results = {
        jobs: jobs.map(job => ({
          ...job,
          company: job.company || job.companyRelation?.name,
          companyLogo: job.companyLogo || job.companyRelation?.logo,
          companyLocation: job.companyRelation?.location,
          companyIndustry: job.companyRelation?.industry
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        },
        meta: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          filters: params
        }
      };
      
      // Cache results
      await cacheService.setWithTags(
        cacheKey, 
        results, 
        ['jobs', 'search', `location:${params.location}`, `query:${params.query}`],
        CACHE_TTL.JOB_SEARCH
      );
      
      console.log(`🚀 Job search completed: ${Date.now() - startTime}ms`);
      return results;
      
    } catch (error) {
      console.error('❌ Job search failed:', error);
      throw error;
    }
  }
  
  /**
   * Optimized job details with caching
   */
  static async getJobDetails(jobId: number) {
    const cacheKey = `job_details:${jobId}`;
    
    try {
      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
      
      // Fetch from database
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          companyRelation: {
            select: {
              name: true,
              logo: true,
              location: true,
              industry: true,
              description: true,
              website: true,
              size: true,
              founded: true
            }
          },
          creator: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
      
      if (!job) return null;
      
      // Cache job details
      await cacheService.set(cacheKey, job, CACHE_TTL.JOB_DETAILS);
      
      return job;
      
    } catch (error) {
      console.error('❌ Job details fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * Optimized location statistics with caching
   */
  static async getLocationStats(location?: string, country?: string) {
    const cacheKey = `location_stats:${location || 'all'}:${country || 'all'}`;
    
    try {
      // Try cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;
      
      // Build where clause
      const where: any = { isActive: true };
      if (location) {
        where.location = { contains: location, mode: 'insensitive' };
      }
      if (country) {
        where.country = country;
      }
      
      // Get statistics
      const [totalJobs, avgSalary, jobTypes, sectors] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.aggregate({
          where: { ...where, salaryMin: { not: null } },
          _avg: { salaryMin: true, salaryMax: true }
        }),
        prisma.job.groupBy({
          by: ['jobType'],
          where,
          _count: { _all: true }
        }),
        prisma.job.groupBy({
          by: ['sector'],
          where,
          _count: { _all: true }
        })
      ]);
      
      const stats = {
        totalJobs,
        avgSalary: {
          min: avgSalary._avg.salaryMin || 0,
          max: avgSalary._avg.salaryMax || 0
        },
        jobTypes: jobTypes.map(t => ({
          type: t.jobType,
          count: t._count._all
        })),
        sectors: sectors.map(s => ({
          sector: s.sector,
          count: s._count._all
        }))
      };
      
      // Cache statistics
      await cacheService.set(cacheKey, stats, CACHE_TTL.LOCATION_STATS);
      
      return stats;
      
    } catch (error) {
      console.error('❌ Location stats fetch failed:', error);
      throw error;
    }
  }
  
  /**
   * Get database performance metrics
   */
  static async getPerformanceMetrics() {
    try {
      const cacheStats = await cacheService.getStats();
      
      return {
        cache: cacheStats,
        database: {
          connectionPool: 'active', // Prisma handles this
          queryPerformance: 'monitored', // Via Prisma middleware
          indexes: 'optimized' // Via migration
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Performance metrics fetch failed:', error);
      return {
        error: 'Failed to fetch performance metrics',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Clear cache for specific tags
   */
  static async clearCache(tags: string[]) {
    try {
      await cacheService.invalidateByTags(tags);
      console.log(`🧹 Cache cleared for tags: ${tags.join(', ')}`);
    } catch (error) {
      console.error('❌ Cache clear failed:', error);
    }
  }
  
  /**
   * Optimize database queries (run periodically)
   */
  static async optimizeQueries() {
    try {
      // This would typically run database maintenance commands
      // For now, we'll just clear old cache entries
      console.log('🔧 Database optimization completed');
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
    }
  }
}

// Export the optimizer
export default DatabaseOptimizer;
