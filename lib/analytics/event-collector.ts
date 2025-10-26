/**
 * Analytics Event Collector
 * Collects and processes user events for real-time analytics and dashboards
 */

import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  eventId: string;
  userId?: string;
  userRole?: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp?: Date;
}

export interface EventCollectorConfig {
  enableRedis: boolean;
  enableDatabase: boolean;
  enableSampling: boolean;
  samplingRate: number; // 0.0 to 1.0
  batchSize: number;
  flushInterval: number; // milliseconds
  maxRetries: number;
}

export class EventCollector {
  private static instance: EventCollector;
  private config: EventCollectorConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private redisClient: any = null;

  public static getInstance(): EventCollector {
    if (!EventCollector.instance) {
      EventCollector.instance = new EventCollector();
    }
    return EventCollector.instance;
  }

  constructor(config: Partial<EventCollectorConfig> = {}) {
    this.config = {
      enableRedis: process.env.REDIS_ENABLED === 'true',
      enableDatabase: true,
      enableSampling: true,
      samplingRate: 1.0, // 100% by default
      batchSize: 100,
      flushInterval: 5000, // 5 seconds
      maxRetries: 3,
      ...config
    };

    this.initializeRedis();
    this.startFlushTimer();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis() {
    if (this.config.enableRedis) {
      try {
        this.redisClient = getRedisClient();
        console.log('✅ Analytics Event Collector: Redis connected');
      } catch {
        console.warn('⚠️ Analytics Event Collector: Redis not available, using database only');
        this.config.enableRedis = false;
      }
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.flushInterval);
  }

  /**
   * Collect an analytics event
   */
  async collectEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): Promise<void> {
    try {
      // Apply sampling if enabled
      if (this.config.enableSampling && Math.random() > this.config.samplingRate) {
        return;
      }

      const analyticsEvent: AnalyticsEvent = {
        ...event,
        eventId: uuidv4(),
        timestamp: new Date()
      };

      // Add to queue
      this.eventQueue.push(analyticsEvent);

      // Flush if queue is full
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flushEvents();
      }

      // Publish to Redis for real-time processing
      if (this.config.enableRedis && this.redisClient) {
        await this.publishToRedis(analyticsEvent);
      }

    } catch (error) {
      console.error('❌ Failed to collect analytics event:', error);
    }
  }

  /**
   * Publish event to Redis for real-time processing
   */
  private async publishToRedis(event: AnalyticsEvent) {
    try {
      const channel = `analytics:${event.eventType}`;
      const userChannel = event.userId ? `analytics:user:${event.userId}` : null;
      const roleChannel = event.userRole ? `analytics:role:${event.userRole}` : null;

      // Publish to event type channel
      await this.redisClient.publish(channel, JSON.stringify(event));

      // Publish to user-specific channel
      if (userChannel) {
        await this.redisClient.publish(userChannel, JSON.stringify(event));
      }

      // Publish to role-specific channel
      if (roleChannel) {
        await this.redisClient.publish(roleChannel, JSON.stringify(event));
      }

    } catch (error) {
      console.error('❌ Failed to publish event to Redis:', error);
    }
  }

  /**
   * Flush events to database
   */
  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Batch insert to database
      if (this.config.enableDatabase) {
        await this.saveEventsToDatabase(eventsToFlush);
      }

      console.log(`✅ Flushed ${eventsToFlush.length} analytics events`);

    } catch (error) {
      console.error('❌ Failed to flush analytics events:', error);
      
      // Re-queue events for retry (with limit)
      if (this.eventQueue.length < this.config.batchSize * 2) {
        this.eventQueue.unshift(...eventsToFlush);
      }
    }
  }

  /**
   * Save events to database
   */
  private async saveEventsToDatabase(events: AnalyticsEvent[]): Promise<void> {
    const dbEvents = events.map(event => ({
      eventId: event.eventId,
      userId: event.userId,
      userRole: event.userRole,
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      createdAt: event.timestamp || new Date()
    }));

    await prisma.analyticsEvent.createMany({
      data: dbEvents,
      skipDuplicates: true
    });
  }

  /**
   * Collect job view event
   */
  async trackJobView(
    userId: string | undefined,
    userRole: string | undefined,
    jobId: string,
    jobTitle: string,
    company: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      userId,
      userRole,
      eventType: 'job_view',
      entityType: 'job',
      entityId: jobId,
      metadata: {
        jobTitle,
        company,
        ...metadata
      }
    });
  }

  /**
   * Collect job search event
   */
  async trackJobSearch(
    userId: string | undefined,
    userRole: string | undefined,
    query: string,
    location: string,
    filters: Record<string, any>,
    resultCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      userId,
      userRole,
      eventType: 'job_search',
      entityType: 'search',
      entityId: uuidv4(),
      metadata: {
        query,
        location,
        filters,
        resultCount,
        ...metadata
      }
    });
  }

  /**
   * Collect job application event
   */
  async trackJobApplication(
    userId: string,
    userRole: string,
    jobId: string,
    jobTitle: string,
    company: string,
    applicationId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      userId,
      userRole,
      eventType: 'job_application',
      entityType: 'application',
      entityId: applicationId,
      metadata: {
        jobId,
        jobTitle,
        company,
        ...metadata
      }
    });
  }

  /**
   * Collect job bookmark event
   */
  async trackJobBookmark(
    userId: string,
    userRole: string,
    jobId: string,
    jobTitle: string,
    company: string,
    action: 'bookmark' | 'unbookmark',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      userId,
      userRole,
      eventType: `job_${action}`,
      entityType: 'job',
      entityId: jobId,
      metadata: {
        jobTitle,
        company,
        action,
        ...metadata
      }
    });
  }

  /**
   * Collect user profile update event
   */
  async trackProfileUpdate(
    userId: string,
    userRole: string,
    updateType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      userId,
      userRole,
      eventType: 'profile_update',
      entityType: 'user',
      entityId: userId,
      metadata: {
        updateType,
        ...metadata
      }
    });
  }

  /**
   * Collect employer job posting event
   */
  async trackJobPosting(
    userId: string,
    userRole: string,
    jobId: string,
    jobTitle: string,
    company: string,
    action: 'create' | 'update' | 'delete',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      userId,
      userRole,
      eventType: `job_${action}`,
      entityType: 'job',
      entityId: jobId,
      metadata: {
        jobTitle,
        company,
        action,
        ...metadata
      }
    });
  }

  /**
   * Collect dashboard view event
   */
  async trackDashboardView(
    userId: string,
    userRole: string,
    dashboardType: 'jobseeker' | 'employer' | 'admin',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      userId,
      userRole,
      eventType: 'dashboard_view',
      entityType: 'dashboard',
      entityId: dashboardType,
      metadata: {
        dashboardType,
        ...metadata
      }
    });
  }

  /**
   * Collect system health event
   */
  async trackSystemHealth(
    eventType: string,
    metrics: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.collectEvent({
      eventType,
      entityType: 'system',
      entityId: 'health',
      metadata: {
        ...metrics,
        ...metadata
      }
    });
  }

  /**
   * Get event statistics
   */
  async getEventStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByRole: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    const now = new Date();
    const startTime = new Date(now.getTime() - this.getTimeRangeMs(timeRange));

    const events = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: {
          gte: startTime
        }
      },
      select: {
        eventType: true,
        userRole: true,
        userId: true
      }
    });

    const stats = {
      totalEvents: events.length,
      eventsByType: {} as Record<string, number>,
      eventsByRole: {} as Record<string, number>,
      topUsers: [] as Array<{ userId: string; count: number }>
    };

    // Count events by type
    events.forEach(event => {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      if (event.userRole) {
        stats.eventsByRole[event.userRole] = (stats.eventsByRole[event.userRole] || 0) + 1;
      }
    });

    // Count top users
    const userCounts = events.reduce((acc, event) => {
      if (event.userId) {
        acc[event.userId] = (acc[event.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    stats.topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Get time range in milliseconds
   */
  private getTimeRangeMs(timeRange: string): number {
    switch (timeRange) {
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushEvents();

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    console.log('✅ Analytics Event Collector shutdown complete');
  }
}

// Export singleton instance
export const eventCollector = EventCollector.getInstance();
