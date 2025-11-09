import { prisma } from '@/lib/prisma';
import { Job } from '@prisma/client';

export interface EnhancedJobData {
  source: string;
  sourceId: string;
  title: string;
  company?: string | null;
  companyLogo?: string | null;
  location?: string | null;
  country?: string;
  description: string;
  requirements?: string;
  applyUrl?: string | null;
  apply_url?: string | null;
  source_url?: string | null;
  postedAt?: Date | null;
  expiryDate?: Date | null;
  salary?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  jobType?: string | null;
  experienceLevel?: string | null;
  skills?: string;
  isRemote?: boolean;
  isHybrid?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
  sector?: string | null;
  benefits?: string | null;
  specialties?: string | null;
  culture?: string | null;
  mission?: string | null;
  vision?: string | null;
  rawJson?: any;
}

export interface UpsertResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Enhanced job upsert service with conflict resolution and change detection
 */
export class EnhancedJobUpsertService {
  /**
   * Upsert multiple jobs with conflict resolution
   */
  static async upsertJobs(jobs: EnhancedJobData[]): Promise<UpsertResult> {
    const result: UpsertResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const jobData of jobs) {
      try {
        const upsertResult = await this.upsertSingleJob(jobData);
        result.created += upsertResult.created ? 1 : 0;
        result.updated += upsertResult.updated ? 1 : 0;
        result.skipped += upsertResult.skipped ? 1 : 0;
      } catch (error) {
        console.error(`❌ Error upserting job ${jobData.sourceId}:`, error);
        result.errors.push(`${jobData.sourceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Upsert a single job with change detection
   */
  static async upsertSingleJob(jobData: EnhancedJobData): Promise<{ created: boolean; updated: boolean; skipped: boolean }> {
    const { source, sourceId } = jobData;

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: {
        source_sourceId: {
          source,
          sourceId
        }
      }
    });

    // If job doesn't exist, create it
    if (!existingJob) {
      // CRITICAL FIX: Remove 'id' from jobData if present to prevent large ID insertion
      // The database will auto-generate the ID, and large external IDs are stored in sourceId
      const { id, ...jobDataWithoutId } = jobData as any;
      
      // Log warning if a large ID was provided
      if (id && typeof id === 'string' && /^\d{11,}$/.test(id)) {
        console.warn(`⚠️ Prevented large ID insertion (${id}), using sourceId (${sourceId}) instead`);
      }
      
      await prisma.job.create({
        data: {
          ...jobDataWithoutId,
          requirements: jobDataWithoutId.requirements || '',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Created new job: ${sourceId} (${jobDataWithoutId.title})`);
      return { created: true, updated: false, skipped: false };
    }

    // Check if job has meaningful changes
    const hasChanges = this.hasSignificantChanges(existingJob, jobData);
    
    if (!hasChanges) {
      console.log(`⏭️ Skipped unchanged job: ${sourceId}`);
      return { created: false, updated: false, skipped: true };
    }

    // Update existing job
    await prisma.job.update({
      where: {
        source_sourceId: {
          source,
          sourceId
        }
      },
      data: {
        ...jobData,
        updatedAt: new Date()
      }
    });

    console.log(`🔄 Updated job: ${sourceId} (${jobData.title})`);
    return { created: false, updated: true, skipped: false };
  }

  /**
   * Check if job has significant changes worth updating
   */
  private static hasSignificantChanges(existing: Job, incoming: EnhancedJobData): boolean {
    const significantFields = [
      'title', 'company', 'location', 'description', 'salary', 'salaryMin', 'salaryMax',
      'jobType', 'experienceLevel', 'isRemote', 'isFeatured', 'sector', 'applyUrl', 'apply_url'
    ];

    for (const field of significantFields) {
      const existingValue = existing[field as keyof Job];
      const incomingValue = incoming[field as keyof EnhancedJobData];
      
      if (existingValue !== incomingValue) {
        return true;
      }
    }

    return false;
  }

  /**
   * Mark expired jobs as inactive
   */
  static async markExpiredJobsInactive(): Promise<number> {
    const result = await prisma.job.updateMany({
      where: {
        isActive: true,
        expiryDate: {
          lt: new Date()
        }
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    console.log(`📅 Marked ${result.count} expired jobs as inactive`);
    return result.count;
  }

  /**
   * Get similar jobs for expired job suggestions
   */
  static async getSimilarJobs(expiredJob: Job, limit: number = 5): Promise<Job[]> {
    return await prisma.job.findMany({
      where: {
        isActive: true,
        id: { not: expiredJob.id },
        OR: [
          { sector: expiredJob.sector },
          { jobType: expiredJob.jobType },
          { experienceLevel: expiredJob.experienceLevel },
          { 
            title: {
              contains: expiredJob.title.split(' ')[0], // First word of title
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });
  }

  /**
   * Get job statistics
   */
  static async getJobStats() {
    const [total, active, expired, bySource] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ 
        where: { 
          isActive: false,
          expiryDate: { lt: new Date() }
        } 
      }),
      prisma.job.groupBy({
        by: ['source'],
        _count: { source: true }
      })
    ]);

    return {
      total,
      active,
      expired,
      bySource: bySource.reduce((acc, item) => {
        acc[item.source] = item._count.source;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}
