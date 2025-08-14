/**
 * Enhanced Job Service - Real Database Integration
 * Comprehensive job management with advanced filtering, caching, and performance optimization
 */

import { Prisma } from '@prisma/client';
import { 
  prisma, 
  handleDatabaseError, 
  PaginationParams, 
  PaginatedResponse, 
  createPaginationQuery, 
  createPaginatedResponse,
  withRetry 
} from './database-service';

export interface JobFilters {
  q?: string;           // Search query
  location?: string;    // Location filter
  company?: string;     // Company filter
  country?: string;     // Single country filter (for backward compatibility)
  countries?: string[]; // Multiple countries filter (NEW)
  jobType?: string;     // Job type filter
  experienceLevel?: string;
  sector?: string;
  isRemote?: boolean;
  isHybrid?: boolean;
  isFeatured?: boolean;
  isUrgent?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  datePosted?: 'today' | 'week' | 'month' | 'all';
  postedAfter?: Date;
  postedBefore?: Date;
  includeInactive?: boolean; // (admin) optionally include inactive jobs
}

export interface JobSummary {
  id: number;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  sector: string | null;
  skills: string[];
  postedAt: Date | null;
  applyUrl: string | null;
  createdAt: Date;
}

export interface JobDetail extends JobSummary {
  description: string;
  rawJson: any;
  source: string;
  sourceId: string;
  updatedAt: Date;
}

export class EnhancedJobService {
  
  // Search jobs with advanced filtering
  async searchJobs(
    filters: JobFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<JobSummary>> {
    try {
      const whereClause = this.buildWhereClause(filters);

      // Map external sort keys to database fields (allowlist)
      const sortKey = pagination.sortBy;
      let sortBy: string | undefined;
      switch (sortKey) {
        case 'date':
        case 'createdAt':
          sortBy = 'createdAt';
          break;
        case 'postedAt':
          sortBy = 'postedAt';
          break;
        case 'salary_min':
        case 'salaryMin':
          sortBy = 'salaryMin';
          break;
        case 'salary_max':
        case 'salaryMax':
          sortBy = 'salaryMax';
          break;
        case 'company':
          sortBy = 'company';
          break;
        case 'title':
          sortBy = 'title';
          break;
        case 'featured':
          sortBy = 'isFeatured';
          break;
        case 'urgent':
          sortBy = 'isUrgent';
          break;
        default:
          sortBy = undefined;
      }

      // If relevance requested and query present, we'll implement a pseudo relevance ordering
      // by prioritising featured/urgent and recency.
      const relevanceRequested = sortKey === 'relevance' && !!filters.q;

      const paginationQuery = createPaginationQuery({
        ...pagination,
        sortBy: relevanceRequested ? undefined : sortBy, // custom order if relevance
      });
      
      const [jobs, total] = await withRetry(async () => {
        return await Promise.all([
          prisma.job.findMany({
            where: whereClause,
            select: {
              id: true,
              title: true,
              company: true,
              companyLogo: true,
              location: true,
              country: true,
              salary: true,
              salaryMin: true,
              salaryMax: true,
              salaryCurrency: true,
              jobType: true,
              experienceLevel: true,
              isRemote: true,
              isHybrid: true,
              isFeatured: true,
              isUrgent: true,
              sector: true,
              skills: true,
              postedAt: true,
              applyUrl: true,
              createdAt: true,
            },
            ...(relevanceRequested
              ? {
                  orderBy: [
                    { isFeatured: 'desc' },
                    { isUrgent: 'desc' },
                    { createdAt: 'desc' },
                  ],
                  skip: paginationQuery.skip,
                  take: paginationQuery.take,
                }
              : paginationQuery),
          }),
          prisma.job.count({ where: whereClause }),
        ]);
      });

      return createPaginatedResponse(jobs as JobSummary[], total, pagination);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // Get job by ID with full details
  async getJobById(id: number): Promise<JobDetail | null> {
    try {
      const job = await withRetry(async () => {
        return await prisma.job.findUnique({
          where: { id },
        });
      });

      return job as JobDetail | null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // Get similar jobs
  async getSimilarJobs(jobId: number, limit: number = 5): Promise<JobSummary[]> {
    try {
      const job = await this.getJobById(jobId);
      if (!job) return [];

      const whereClause: Prisma.JobWhereInput = {
        id: { not: jobId },
        OR: [
          { sector: job.sector },
          { skills: { hasSome: job.skills.slice(0, 3) } },
          { company: job.company },
        ],
        country: job.country,
      };

      const similarJobs = await withRetry(async () => {
        return await prisma.job.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            company: true,
            companyLogo: true,
            location: true,
            country: true,
            salary: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            jobType: true,
            experienceLevel: true,
            isRemote: true,
            isHybrid: true,
            isFeatured: true,
            isUrgent: true,
            sector: true,
            skills: true,
            postedAt: true,
            applyUrl: true,
            createdAt: true,
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        });
      });

      return similarJobs as JobSummary[];
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // Get job statistics
  async getJobStats(filters?: Partial<JobFilters>): Promise<{
    total: number;
    byJobType: Record<string, number>;
    bySector: Record<string, number>;
    byLocation: Record<string, number>;
    salaryRanges: {
      range: string;
      count: number;
      avgSalary: number;
    }[];
    recentCount: number; // Jobs posted in last 7 days
  }> {
    try {
      const whereClause = this.buildWhereClause(filters || {});
      
      const [
        total,
        jobTypeStats,
        sectorStats,
        locationStats,
        salaryStats,
        recentJobs
      ] = await withRetry(async () => {
        return await Promise.all([
          // Total count
          prisma.job.count({ where: whereClause }),
          
          // Job type distribution
          prisma.job.groupBy({
            by: ['jobType'],
            where: { ...whereClause, jobType: { not: null } },
            _count: { jobType: true },
          }),
          
          // Sector distribution
          prisma.job.groupBy({
            by: ['sector'],
            where: { ...whereClause, sector: { not: null } },
            _count: { sector: true },
          }),
          
          // Location distribution
          prisma.job.groupBy({
            by: ['location'],
            where: { ...whereClause, location: { not: null } },
            _count: { location: true },
          }),
          
          // Salary ranges
          prisma.$queryRaw<{
            range: string;
            count: bigint;
            avg_salary: number;
          }[]>`
            SELECT 
              CASE 
                WHEN salary_min < 30000 THEN '0-30k'
                WHEN salary_min < 60000 THEN '30k-60k'
                WHEN salary_min < 100000 THEN '60k-100k'
                WHEN salary_min < 150000 THEN '100k-150k'
                ELSE '150k+'
              END as range,
              COUNT(*) as count,
              AVG(COALESCE(salary_min, salary_max, 0)) as avg_salary
            FROM "Job"
            WHERE salary_min IS NOT NULL
            GROUP BY range
            ORDER BY range
          `,
          
          // Recent jobs (last 7 days)
          prisma.job.count({
            where: {
              ...whereClause,
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }),
        ]);
      });

      return {
        total,
        byJobType: Object.fromEntries(
          jobTypeStats.map(stat => [stat.jobType!, stat._count.jobType])
        ),
        bySector: Object.fromEntries(
          sectorStats.map(stat => [stat.sector!, stat._count.sector])
        ),
        byLocation: Object.fromEntries(
          locationStats.map(stat => [stat.location!, stat._count.location])
        ),
        salaryRanges: salaryStats.map(stat => ({
          range: stat.range,
          count: Number(stat.count),
          avgSalary: Math.round(stat.avg_salary || 0),
        })),
        recentCount: recentJobs,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // User bookmark operations
  async addBookmark(userId: number, jobId: number): Promise<{ success: boolean }> {
    try {
      await withRetry(async () => {
        await prisma.jobBookmark.create({
          data: { userId, jobId },
        });
      });
      
      return { success: true };
    } catch (error) {
      const dbError = handleDatabaseError(error);
      if (dbError.code === 'DUPLICATE_ENTRY') {
        return { success: true }; // Already bookmarked
      }
      throw dbError;
    }
  }

  async removeBookmark(userId: number, jobId: number): Promise<{ success: boolean }> {
    try {
      await withRetry(async () => {
        await prisma.jobBookmark.deleteMany({
          where: { userId, jobId },
        });
      });
      
      return { success: true };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  async getUserBookmarks(
    userId: number,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<JobSummary & { bookmarkedAt: Date }>> {
    try {
      const paginationQuery = createPaginationQuery(pagination);
      
      const [bookmarks, total] = await withRetry(async () => {
        return await Promise.all([
          prisma.jobBookmark.findMany({
            where: { userId },
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: true,
                  companyLogo: true,
                  location: true,
                  country: true,
                  salary: true,
                  salaryMin: true,
                  salaryMax: true,
                  salaryCurrency: true,
                  jobType: true,
                  experienceLevel: true,
                  isRemote: true,
                  isHybrid: true,
                  isFeatured: true,
                  isUrgent: true,
                  sector: true,
                  skills: true,
                  postedAt: true,
                  applyUrl: true,
                  createdAt: true,
                },
              },
            },
            ...paginationQuery,
            orderBy: { createdAt: 'desc' },
          }),
          prisma.jobBookmark.count({ where: { userId } }),
        ]);
      });

      const jobs = bookmarks.map(bookmark => ({
        ...bookmark.job,
        bookmarkedAt: bookmark.createdAt,
      })) as (JobSummary & { bookmarkedAt: Date })[];

      return createPaginatedResponse(jobs, total, pagination);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  // Build complex where clause for filtering
  private buildWhereClause(filters: JobFilters): Prisma.JobWhereInput {
    const where: Prisma.JobWhereInput = {};

    // Always scope to active jobs unless explicitly overridden (e.g., admin usage)
    if (!filters.includeInactive) {
      where.isActive = true;
    }

    // Text search across multiple fields
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { company: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { skills: { hasSome: [filters.q] } },
      ];
    }

    // Location filtering
    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    // Company filtering
    if (filters.company) {
      where.company = { contains: filters.company, mode: 'insensitive' };
    }

    // Country filtering (support both single and multiple countries)
    if (filters.countries && filters.countries.length > 0) {
      where.country = { in: filters.countries };
    } else if (filters.country) {
      where.country = filters.country;
    }

    // Job type filtering
    if (filters.jobType) {
      where.jobType = filters.jobType;
    }

    // Experience level filtering
    if (filters.experienceLevel) {
      where.experienceLevel = filters.experienceLevel;
    }

    // Sector filtering
    if (filters.sector) {
      where.sector = filters.sector;
    }

    // Remote/hybrid filtering
    if (filters.isRemote !== undefined) {
      where.isRemote = filters.isRemote;
    }

    if (filters.isHybrid !== undefined) {
      where.isHybrid = filters.isHybrid;
    }

    // Featured/urgent filtering
    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.isUrgent !== undefined) {
      where.isUrgent = filters.isUrgent;
    }

    // Salary range filtering
    if (filters.salaryMin || filters.salaryMax) {
      where.AND = where.AND || [];
      
      if (filters.salaryMin) {
        where.AND.push({
          OR: [
            { salaryMin: { gte: filters.salaryMin } },
            { salaryMax: { gte: filters.salaryMin } },
          ],
        });
      }
      
      if (filters.salaryMax) {
        where.AND.push({
          OR: [
            { salaryMin: { lte: filters.salaryMax } },
            { salaryMax: { lte: filters.salaryMax } },
          ],
        });
      }
    }

    // Skills filtering
    if (filters.skills && filters.skills.length > 0) {
      where.skills = { hasSome: filters.skills };
    }

    // Date filtering
    if (filters.datePosted) {
      const now = new Date();
      let dateThreshold: Date;
      
      switch (filters.datePosted) {
        case 'today':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        default:
          dateThreshold = new Date(0); // No filtering
      }
      
      if (filters.datePosted !== 'all') {
        where.createdAt = { gte: dateThreshold };
      }
    }

    // Custom date range
    if (filters.postedAfter || filters.postedBefore) {
      where.createdAt = {
        ...(filters.postedAfter && { gte: filters.postedAfter }),
        ...(filters.postedBefore && { lte: filters.postedBefore }),
      };
    }

  return where;
  }
}

// Export singleton instance
export const enhancedJobService = new EnhancedJobService();
