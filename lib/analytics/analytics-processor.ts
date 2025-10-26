/**
 * Analytics Processor
 * Processes analytics events and generates real-time metrics and aggregations
 */

import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';
// import { eventCollector } from './event-collector'; // Unused import

export interface DashboardMetrics {
  // Job Seeker Metrics
  jobseeker: {
    profileCompletion: number;
    applicationsCount: number;
    bookmarksCount: number;
    searchCount: number;
    recommendedJobs: number;
    recentApplications: Array<{
      id: string;
      jobTitle: string;
      company: string;
      status: string;
      appliedAt: Date;
    }>;
    savedJobs: Array<{
      id: string;
      jobTitle: string;
      company: string;
      bookmarkedAt: Date;
    }>;
  };
  
  // Employer Metrics
  employer: {
    activeJobs: number;
    totalApplications: number;
    newApplications: number;
    shortlistedCount: number;
    jobViews: number;
    topPerformingJobs: Array<{
      id: string;
      title: string;
      applications: number;
      views: number;
    }>;
    recentApplications: Array<{
      id: string;
      jobTitle: string;
      applicantName: string;
      appliedAt: Date;
      status: string;
    }>;
  };
  
  // Admin Metrics
  admin: {
    totalUsers: number;
    activeUsers: number;
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    systemHealth: {
      uptime: number;
      responseTime: number;
      errorRate: number;
    };
    topSectors: Array<{
      sector: string;
      count: number;
    }>;
    recentActivity: Array<{
      type: string;
      description: string;
      timestamp: Date;
    }>;
  };
}

export interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  jobViews: number;
  applications: number;
  searches: number;
  events: Array<{
    type: string;
    count: number;
  }>;
}

export class AnalyticsProcessor {
  private static instance: AnalyticsProcessor;
  private redisClient: any = null;
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  public static getInstance(): AnalyticsProcessor {
    if (!AnalyticsProcessor.instance) {
      AnalyticsProcessor.instance = new AnalyticsProcessor();
    }
    return AnalyticsProcessor.instance;
  }

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis() {
    try {
      this.redisClient = getRedisClient();
      console.log('✅ Analytics Processor: Redis connected');
    } catch {
      console.warn('⚠️ Analytics Processor: Redis not available');
    }
  }

  /**
   * Get dashboard metrics for a specific user role
   */
  async getDashboardMetrics(userId: string, userRole: string): Promise<Partial<DashboardMetrics>> {
    const cacheKey = `dashboard:${userId}:${userRole}`;
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    let metrics: Partial<DashboardMetrics> = {};

    try {
      switch (userRole) {
        case 'jobseeker':
          metrics.jobseeker = await this.getJobSeekerMetrics(userId);
          break;
        case 'employer':
          metrics.employer = await this.getEmployerMetrics(userId);
          break;
        case 'admin':
          metrics.admin = await this.getAdminMetrics();
          break;
      }

      // Cache the results
      this.metricsCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });

      return metrics;

    } catch (error) {
      console.error('❌ Failed to get dashboard metrics:', error);
      return {};
    }
  }

  /**
   * Get job seeker specific metrics
   */
  private async getJobSeekerMetrics(userId: string): Promise<DashboardMetrics['jobseeker']> {
    const [
      user,
      applications,
      bookmarks,
      searchHistory,
      recentApplications,
      savedJobs
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
          bio: true,
          skills: true,
          experience: true,
          education: true,
          profilePicture: true,
          location: true,
          phone: true
        }
      }),
      prisma.application.findMany({
        where: { userId },
        select: { id: true }
      }),
      prisma.jobBookmark.findMany({
        where: { userId },
        select: { id: true }
      }),
      prisma.searchHistory.findMany({
        where: { userId },
        select: { id: true }
      }),
      prisma.application.findMany({
        where: { userId },
        orderBy: { appliedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          job: {
            select: {
              title: true,
              company: true
            }
          }
        }
      }),
      prisma.jobBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          job: {
            select: {
              title: true,
              company: true
            }
          }
        }
      })
    ]);

    // Calculate profile completion
    const profileFields = [
      user?.firstName,
      user?.lastName,
      user?.bio,
      user?.skills,
      user?.experience,
      user?.education,
      user?.profilePicture,
      user?.location,
      user?.phone
    ];
    const completedFields = profileFields.filter(field => field && field !== '').length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

    return {
      profileCompletion,
      applicationsCount: applications.length,
      bookmarksCount: bookmarks.length,
      searchCount: searchHistory.length,
      recommendedJobs: 0, // Will be calculated by recommendation engine
      recentApplications: recentApplications.map(app => ({
        id: app.id,
        jobTitle: app.job.title,
        company: app.job.company || 'Unknown Company',
        status: app.status,
        appliedAt: app.appliedAt
      })),
      savedJobs: savedJobs.map(bookmark => ({
        id: bookmark.id,
        jobTitle: bookmark.job.title,
        company: bookmark.job.company || 'Unknown Company',
        bookmarkedAt: bookmark.createdAt
      }))
    };
  }

  /**
   * Get employer specific metrics
   */
  private async getEmployerMetrics(userId: string): Promise<DashboardMetrics['employer']> {
    const [
      // _user,
      // _companies,
      jobs,
      applications,
      recentApplications
    ] = await Promise.all([
      // prisma.user.findUnique({
      //   where: { id: userId },
      //   select: { companyName: true }
      // }),
      // prisma.company.findMany({
      //   where: { createdBy: userId },
      //   select: { id: true }
      // }),
      Promise.resolve(null), // user
      Promise.resolve(null), // companies
      prisma.job.findMany({
        where: { createdBy: userId },
        select: {
          id: true,
          title: true,
          isActive: true,
          views: true,
          applicationsCount: true
        }
      }),
      prisma.application.findMany({
        where: {
          job: { createdBy: userId }
        },
        select: { id: true, status: true, appliedAt: true }
      }),
      prisma.application.findMany({
        where: {
          job: { createdBy: userId }
        },
        orderBy: { appliedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          job: {
            select: { title: true }
          },
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      })
    ]);

    const activeJobs = jobs.filter(job => job.isActive);
    const newApplications = applications.filter(app => 
      new Date(app.appliedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    const shortlistedCount = applications.filter(app => app.status === 'shortlisted').length;
    const totalViews = jobs.reduce((sum, job) => sum + job.views, 0);

    const topPerformingJobs = jobs
      .sort((a, b) => (b.applicationsCount + b.views) - (a.applicationsCount + a.views))
      .slice(0, 5)
      .map(job => ({
        id: job.id.toString(),
        title: job.title,
        applications: job.applicationsCount,
        views: job.views
      }));

    return {
      activeJobs: activeJobs.length,
      totalApplications: applications.length,
      newApplications: newApplications.length,
      shortlistedCount,
      jobViews: totalViews,
      topPerformingJobs,
      recentApplications: recentApplications.map((app: any) => ({
        id: app.id.toString(),
        jobTitle: app.job?.title || 'Unknown',
        applicantName: `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim() || 'Anonymous',
        appliedAt: app.appliedAt,
        status: app.status
      }))
    };
  }

  /**
   * Get admin specific metrics
   */
  private async getAdminMetrics(): Promise<DashboardMetrics['admin']> {
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      topSectors,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.application.count(),
      prisma.job.groupBy({
        by: ['sector'],
        _count: { sector: true },
        orderBy: { _count: { sector: 'desc' } },
        take: 5
      }),
      prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          eventType: true,
          entityType: true,
          createdAt: true,
          metadata: true
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      systemHealth: {
        uptime: process.uptime(),
        responseTime: 0, // Will be calculated by monitoring
        errorRate: 0 // Will be calculated by monitoring
      },
      topSectors: topSectors.map(sector => ({
        sector: sector.sector || 'Unknown',
        count: sector._count.sector
      })),
      recentActivity: recentActivity.map(activity => ({
        type: activity.eventType,
        description: this.formatActivityDescription(activity),
        timestamp: activity.createdAt
      }))
    };
  }

  /**
   * Format activity description for admin dashboard
   */
  private formatActivityDescription(activity: any): string {
    const { eventType, entityType, metadata } = activity;
    
    switch (eventType) {
      case 'job_view':
        return `Job viewed: ${metadata?.jobTitle || 'Unknown Job'}`;
      case 'job_application':
        return `New application: ${metadata?.jobTitle || 'Unknown Job'}`;
      case 'job_search':
        return `Search performed: "${metadata?.query || 'No query'}"`;
      case 'profile_update':
        return `Profile updated: ${metadata?.updateType || 'Unknown'}`;
      default:
        return `${eventType.replace(/_/g, ' ')} on ${entityType || 'unknown'}`;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      activeUsers,
      jobViews,
      applications,
      searches,
      events
    ] = await Promise.all([
      this.getActiveUsersCount(),
      this.getJobViewsCount(oneHourAgo),
      this.getApplicationsCount(oneHourAgo),
      this.getSearchesCount(oneHourAgo),
      this.getEventsByType(oneHourAgo)
    ]);

    return {
      timestamp: now,
      activeUsers,
      jobViews,
      applications,
      searches,
      events
    };
  }

  /**
   * Get active users count (last 15 minutes)
   */
  private async getActiveUsersCount(): Promise<number> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const result = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: fifteenMinutesAgo },
        userId: { not: null }
      }
    });

    return result.length;
  }

  /**
   * Get job views count
   */
  private async getJobViewsCount(since: Date): Promise<number> {
    return await prisma.analyticsEvent.count({
      where: {
        eventType: 'job_view',
        createdAt: { gte: since }
      }
    });
  }

  /**
   * Get applications count
   */
  private async getApplicationsCount(since: Date): Promise<number> {
    return await prisma.analyticsEvent.count({
      where: {
        eventType: 'job_application',
        createdAt: { gte: since }
      }
    });
  }

  /**
   * Get searches count
   */
  private async getSearchesCount(since: Date): Promise<number> {
    return await prisma.analyticsEvent.count({
      where: {
        eventType: 'job_search',
        createdAt: { gte: since }
      }
    });
  }

  /**
   * Get events by type
   */
  private async getEventsByType(since: Date): Promise<Array<{ type: string; count: number }>> {
    const result = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      _count: { eventType: true },
      where: {
        createdAt: { gte: since }
      },
      orderBy: { _count: { eventType: 'desc' } },
      take: 10
    });

    return result.map(item => ({
      type: item.eventType,
      count: item._count.eventType
    }));
  }

  /**
   * Process and aggregate events
   */
  async processEvents(): Promise<void> {
    try {
      // Process hourly aggregations
      await this.processHourlyAggregations();
      
      // Process daily aggregations
      await this.processDailyAggregations();
      
      console.log('✅ Analytics processing completed');

    } catch (error) {
      console.error('❌ Analytics processing failed:', error);
    }
  }

  /**
   * Process hourly aggregations
   */
  private async processHourlyAggregations(): Promise<void> {
    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: hourStart,
          lt: hourEnd
        }
      }
    });

    const metrics = this.calculateMetrics(events);

    await prisma.analyticsAggregation.upsert({
      where: {
        aggregationType_timePeriod_startTime: {
          aggregationType: 'hourly',
          timePeriod: hourStart.toISOString(),
          startTime: hourStart
        }
      },
      update: {
        endTime: hourEnd,
        metrics,
        updatedAt: new Date()
      },
      create: {
        aggregationType: 'hourly',
        timePeriod: hourStart.toISOString(),
        startTime: hourStart,
        endTime: hourEnd,
        metrics
      }
    });
  }

  /**
   * Process daily aggregations
   */
  private async processDailyAggregations(): Promise<void> {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    });

    const metrics = this.calculateMetrics(events);

    await prisma.analyticsAggregation.upsert({
      where: {
        aggregationType_timePeriod_startTime: {
          aggregationType: 'daily',
          timePeriod: dayStart.toISOString(),
          startTime: dayStart
        }
      },
      update: {
        endTime: dayEnd,
        metrics,
        updatedAt: new Date()
      },
      create: {
        aggregationType: 'daily',
        timePeriod: dayStart.toISOString(),
        startTime: dayStart,
        endTime: dayEnd,
        metrics
      }
    });
  }

  /**
   * Calculate metrics from events
   */
  private calculateMetrics(events: any[]): Record<string, any> {
    const eventTypes = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userRoles = events.reduce((acc, event) => {
      if (event.userRole) {
        acc[event.userRole] = (acc[event.userRole] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: events.length,
      eventTypes,
      userRoles,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.metricsCache.clear();
  }
}

// Export singleton instance
export const analyticsProcessor = AnalyticsProcessor.getInstance();
