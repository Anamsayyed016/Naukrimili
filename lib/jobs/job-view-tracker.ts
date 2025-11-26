/**
 * Job View Tracker Service
 * Tracks when jobseekers view job details for history and analytics
 */

import { prisma } from '@/lib/prisma';

export interface JobViewData {
  userId: string;
  jobId: string | number;
  ipAddress?: string;
  userAgent?: string;
}

export interface JobViewStats {
  totalViews: number;
  uniqueJobs: number;
  recentViews: Array<{
    jobId: number;
    jobTitle: string;
    company: string;
    viewedAt: Date;
  }>;
}

/**
 * Track a job view (only for authenticated users)
 */
export async function trackJobView(viewData: JobViewData): Promise<void> {
  try {
    // Convert jobId to number if it's a string
    const jobId = typeof viewData.jobId === 'string' ? parseInt(viewData.jobId) : viewData.jobId;
    
    if (isNaN(jobId)) {
      console.error(`❌ Invalid job ID: ${viewData.jobId}`);
      return;
    }

    console.log(`📊 Tracking job view: Job ${jobId} by user ${viewData.userId}`);

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, company: true }
    });

    if (!job) {
      console.error(`❌ Job not found: ${jobId}`);
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: viewData.userId },
      select: { id: true }
    });

    if (!user) {
      console.error(`❌ User not found: ${viewData.userId}`);
      return;
    }

    // Check if this is a duplicate view within the last hour (prevent spam)
    const recentView = await prisma.jobView.findFirst({
      where: {
        userId: viewData.userId,
        jobId: jobId,
        viewedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    if (recentView) {
      console.log(`⏭️ Skipping duplicate view from user ${viewData.userId} for job ${jobId} within last hour`);
      return;
    }

    // Create job view record
    const jobView = await prisma.jobView.create({
      data: {
        userId: viewData.userId,
        jobId: jobId,
        ipAddress: viewData.ipAddress,
        userAgent: viewData.userAgent
      }
    });

    console.log(`✅ Job view tracked: ${jobView.id} (Job: ${job.title})`);

  } catch (error) {
    console.error('❌ Error tracking job view:', error);
    // Don't throw error to avoid breaking the viewing experience
  }
}

/**
 * Get user's job view history
 */
export async function getUserJobViews(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    orderBy?: 'recent' | 'oldest';
  } = {}
): Promise<{
  views: Array<{
    id: string;
    jobId: number;
    viewedAt: Date;
    job: {
      id: number;
      title: string;
      company: string | null;
      location: string | null;
      salary: string | null;
      salaryMin: number | null;
      salaryMax: number | null;
      jobType: string | null;
      experienceLevel: string | null;
      isRemote: boolean;
      isHybrid: boolean;
      postedAt: Date | null;
      source: string;
    };
  }>;
  total: number;
}> {
  try {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const orderBy = options.orderBy || 'recent';

    const [views, total] = await Promise.all([
      prisma.jobView.findMany({
        where: { userId },
        take: limit,
        skip: offset,
        orderBy: {
          viewedAt: orderBy === 'recent' ? 'desc' : 'asc'
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              location: true,
              salary: true,
              salaryMin: true,
              salaryMax: true,
              jobType: true,
              experienceLevel: true,
              isRemote: true,
              isHybrid: true,
              postedAt: true,
              source: true,
              companyLogo: true
            }
          }
        }
      }),
      prisma.jobView.count({
        where: { userId }
      })
    ]);

    return {
      views: views.map(view => ({
        id: view.id,
        jobId: view.jobId,
        viewedAt: view.viewedAt,
        job: {
          id: view.job.id,
          title: view.job.title,
          company: view.job.company,
          location: view.job.location,
          salary: view.job.salary,
          salaryMin: view.job.salaryMin,
          salaryMax: view.job.salaryMax,
          jobType: view.job.jobType,
          experienceLevel: view.job.experienceLevel,
          isRemote: view.job.isRemote,
          isHybrid: view.job.isHybrid,
          postedAt: view.job.postedAt,
          source: view.job.source
        }
      })),
      total
    };

  } catch (error) {
    console.error('❌ Error getting user job views:', error);
    throw error;
  }
}

/**
 * Get job view statistics for a user
 */
export async function getUserJobViewStats(userId: string): Promise<JobViewStats> {
  try {
    const [totalViews, uniqueJobs, recentViews] = await Promise.all([
      prisma.jobView.count({
        where: { userId }
      }),
      prisma.jobView.groupBy({
        by: ['jobId'],
        where: { userId }
      }).then(result => result.length),
      prisma.jobView.findMany({
        where: { userId },
        take: 10,
        orderBy: { viewedAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true
            }
          }
        }
      })
    ]);

    return {
      totalViews,
      uniqueJobs,
      recentViews: recentViews.map(view => ({
        jobId: view.jobId,
        jobTitle: view.job.title,
        company: view.job.company || 'Unknown',
        viewedAt: view.viewedAt
      }))
    };

  } catch (error) {
    console.error('❌ Error getting job view stats:', error);
    throw error;
  }
}

/**
 * Check if user has viewed a specific job
 */
export async function hasUserViewedJob(userId: string, jobId: number): Promise<boolean> {
  try {
    const view = await prisma.jobView.findFirst({
      where: {
        userId,
        jobId
      }
    });

    return !!view;
  } catch (error) {
    console.error('❌ Error checking job view:', error);
    return false;
  }
}
