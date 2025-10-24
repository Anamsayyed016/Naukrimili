/**
 * Real-time Dashboard Service
 * Manages real-time dashboard updates via Socket.IO and Redis
 */

import { Server as SocketIOServer } from 'socket.io';
import { getRedisClient } from '@/lib/redis';
import { analyticsProcessor } from './analytics-processor';
import { eventCollector } from './event-collector';

export interface DashboardUpdate {
  type: 'metrics' | 'notification' | 'activity';
  data: any;
  timestamp: Date;
  userId?: string;
  userRole?: string;
}

export interface RealTimeDashboardConfig {
  enableRedis: boolean;
  updateInterval: number; // milliseconds
  enableUserChannels: boolean;
  enableRoleChannels: boolean;
  enableGlobalChannels: boolean;
}

export class RealTimeDashboard {
  private static instance: RealTimeDashboard;
  private io: SocketIOServer | null = null;
  private redisClient: any = null;
  private config: RealTimeDashboardConfig;
  private updateTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  public static getInstance(): RealTimeDashboard {
    if (!RealTimeDashboard.instance) {
      RealTimeDashboard.instance = new RealTimeDashboard();
    }
    return RealTimeDashboard.instance;
  }

  constructor(config: Partial<RealTimeDashboardConfig> = {}) {
    this.config = {
      enableRedis: process.env.REDIS_ENABLED === 'true',
      updateInterval: 5000, // 5 seconds
      enableUserChannels: true,
      enableRoleChannels: true,
      enableGlobalChannels: true,
      ...config
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis() {
    if (this.config.enableRedis) {
      try {
        this.redisClient = getRedisClient();
        console.log('✅ Real-time Dashboard: Redis connected');
      } catch (error) {
        console.warn('⚠️ Real-time Dashboard: Redis not available');
        this.config.enableRedis = false;
      }
    }
  }

  /**
   * Set Socket.IO server instance
   */
  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    console.log('✅ Real-time Dashboard: Socket.IO server connected');
  }

  /**
   * Start real-time dashboard updates
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startUpdateTimer();
    this.setupRedisSubscriptions();

    console.log('✅ Real-time Dashboard: Started');
  }

  /**
   * Stop real-time dashboard updates
   */
  stop(): void {
    this.isRunning = false;

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    console.log('✅ Real-time Dashboard: Stopped');
  }

  /**
   * Start update timer
   */
  private startUpdateTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.broadcastMetrics();
      }
    }, this.config.updateInterval);
  }

  /**
   * Setup Redis subscriptions for real-time updates
   */
  private setupRedisSubscriptions(): void {
    if (!this.config.enableRedis || !this.redisClient) return;

    // Subscribe to analytics channels
    this.redisClient.subscribe('analytics:job_view');
    this.redisClient.subscribe('analytics:job_application');
    this.redisClient.subscribe('analytics:job_search');
    this.redisClient.subscribe('analytics:profile_update');
    this.redisClient.subscribe('analytics:dashboard_view');

    // Handle Redis messages
    this.redisClient.on('message', (channel: string, message: string) => {
      try {
        const event = JSON.parse(message);
        this.handleRedisEvent(channel, event);
      } catch (error) {
        console.error('❌ Failed to parse Redis message:', error);
      }
    });

    console.log('✅ Real-time Dashboard: Redis subscriptions active');
  }

  /**
   * Handle Redis event
   */
  private handleRedisEvent(channel: string, event: any): void {
    if (!this.io) return;

    const update: DashboardUpdate = {
      type: 'activity',
      data: event,
      timestamp: new Date(),
      userId: event.userId,
      userRole: event.userRole
    };

    // Broadcast to specific user
    if (this.config.enableUserChannels && event.userId) {
      this.io.to(`user:${event.userId}`).emit('dashboard_update', update);
    }

    // Broadcast to role-specific channel
    if (this.config.enableRoleChannels && event.userRole) {
      this.io.to(`role:${event.userRole}`).emit('dashboard_update', update);
    }

    // Broadcast to admin channel
    if (this.config.enableGlobalChannels) {
      this.io.to('admin').emit('dashboard_update', update);
    }
  }

  /**
   * Broadcast metrics to all connected clients
   */
  async broadcastMetrics(): Promise<void> {
    if (!this.io) return;

    try {
      const metrics = await analyticsProcessor.getRealTimeMetrics();
      
      const update: DashboardUpdate = {
        type: 'metrics',
        data: metrics,
        timestamp: new Date()
      };

      // Broadcast to all connected clients
      this.io.emit('dashboard_metrics', update);

    } catch (error) {
      console.error('❌ Failed to broadcast metrics:', error);
    }
  }

  /**
   * Send dashboard update to specific user
   */
  async sendUserUpdate(userId: string, update: DashboardUpdate): Promise<void> {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit('dashboard_update', update);
  }

  /**
   * Send dashboard update to specific role
   */
  async sendRoleUpdate(userRole: string, update: DashboardUpdate): Promise<void> {
    if (!this.io) return;

    this.io.to(`role:${userRole}`).emit('dashboard_update', update);
  }

  /**
   * Send dashboard update to admin users
   */
  async sendAdminUpdate(update: DashboardUpdate): Promise<void> {
    if (!this.io) return;

    this.io.to('admin').emit('dashboard_update', update);
  }

  /**
   * Get dashboard metrics for user
   */
  async getUserDashboardMetrics(userId: string, userRole: string): Promise<any> {
    try {
      const metrics = await analyticsProcessor.getDashboardMetrics(userId, userRole);
      
      // Send real-time update
      await this.sendUserUpdate(userId, {
        type: 'metrics',
        data: metrics,
        timestamp: new Date(),
        userId,
        userRole
      });

      return metrics;

    } catch (error) {
      console.error('❌ Failed to get user dashboard metrics:', error);
      return {};
    }
  }

  /**
   * Track dashboard view
   */
  async trackDashboardView(userId: string, userRole: string, dashboardType: string): Promise<void> {
    await eventCollector.trackDashboardView(userId, userRole, dashboardType as any);
  }

  /**
   * Get real-time activity feed
   */
  async getActivityFeed(userId?: string, userRole?: string, limit: number = 20): Promise<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    metadata?: any;
  }>> {
    try {
      const where: any = {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      };

      if (userId) {
        where.OR = [
          { userId },
          { userRole }
        ];
      }

      const events = await prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          eventType: true,
          entityType: true,
          createdAt: true,
          metadata: true
        }
      });

      return events.map(event => ({
        id: event.id,
        type: event.eventType,
        description: this.formatEventDescription(event),
        timestamp: event.createdAt,
        metadata: event.metadata
      }));

    } catch (error) {
      console.error('❌ Failed to get activity feed:', error);
      return [];
    }
  }

  /**
   * Format event description for activity feed
   */
  private formatEventDescription(event: any): string {
    const { eventType, entityType, metadata } = event;
    
    switch (eventType) {
      case 'job_view':
        return `Viewed job: ${metadata?.jobTitle || 'Unknown Job'}`;
      case 'job_application':
        return `Applied to: ${metadata?.jobTitle || 'Unknown Job'}`;
      case 'job_search':
        return `Searched for: "${metadata?.query || 'jobs'}"`;
      case 'job_bookmark':
        return `Bookmarked: ${metadata?.jobTitle || 'Unknown Job'}`;
      case 'profile_update':
        return `Updated profile: ${metadata?.updateType || 'Unknown'}`;
      case 'dashboard_view':
        return `Viewed ${metadata?.dashboardType || 'dashboard'}`;
      default:
        return `${eventType.replace(/_/g, ' ')} on ${entityType || 'unknown'}`;
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<{
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    activeConnections: number;
    eventStats: any;
  }> {
    try {
      const eventStats = await eventCollector.getEventStats('hour');
      
      return {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        activeConnections: this.io?.engine?.clientsCount || 0,
        eventStats
      };

    } catch (error) {
      console.error('❌ Failed to get system health:', error);
      return {
        uptime: 0,
        memoryUsage: process.memoryUsage(),
        activeConnections: 0,
        eventStats: {}
      };
    }
  }

  /**
   * Subscribe user to dashboard updates
   */
  subscribeUser(socket: any, userId: string, userRole: string): void {
    if (!this.io) return;

    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join role-specific room
    socket.join(`role:${userRole}`);
    
    // Join admin room if user is admin
    if (userRole === 'admin') {
      socket.join('admin');
    }

    console.log(`✅ User ${userId} (${userRole}) subscribed to dashboard updates`);
  }

  /**
   * Unsubscribe user from dashboard updates
   */
  unsubscribeUser(socket: any, userId: string, userRole: string): void {
    if (!this.io) return;

    // Leave user-specific room
    socket.leave(`user:${userId}`);
    
    // Leave role-specific room
    socket.leave(`role:${userRole}`);
    
    // Leave admin room if user is admin
    if (userRole === 'admin') {
      socket.leave('admin');
    }

    console.log(`✅ User ${userId} (${userRole}) unsubscribed from dashboard updates`);
  }
}

// Export singleton instance
export const realTimeDashboard = RealTimeDashboard.getInstance();
