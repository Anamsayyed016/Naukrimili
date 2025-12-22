/**
 * Socket.io Server for Real-time Notifications
 * Integrates with existing NextAuth.js and notification system
 */

import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './prisma';
import { createNotification } from './notification-service';
import { realTimeDashboard } from './analytics/real-time-dashboard';
import jwt from 'jsonwebtoken';

// Comprehensive notification types for job portal
export type NotificationType = 
  // Application & Job Flow
  | 'APPLICATION_UPDATE' | 'APPLICATION_RECEIVED' | 'APPLICATION_REVIEWED' | 'APPLICATION_SHORTLISTED' 
  | 'APPLICATION_REJECTED' | 'APPLICATION_ACCEPTED' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_RESCHEDULED'
  | 'INTERVIEW_CANCELLED' | 'OFFER_MADE' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'OFFER_WITHDRAWN'
  
  // Job Management
  | 'JOB_CREATED' | 'JOB_UPDATED' | 'JOB_DELETED' | 'JOB_EXPIRED' | 'JOB_REACTIVATED' | 'JOB_FEATURED'
  | 'JOB_VIEWED' | 'JOB_APPLIED' | 'JOB_SAVED' | 'JOB_UNSAVED' | 'JOB_SHARED'
  
  // Company & Profile
  | 'COMPANY_CREATED' | 'COMPANY_UPDATE' | 'COMPANY_VERIFIED' | 'COMPANY_APPROVED' | 'COMPANY_REJECTED' | 'COMPANY_SUSPENDED'
  | 'PROFILE_UPDATE' | 'PROFILE_VERIFIED' | 'PROFILE_COMPLETED' | 'PROFILE_INCOMPLETE'
  
  // Resume & Documents
  | 'RESUME_UPLOADED' | 'RESUME_PARSED' | 'RESUME_ATS_SCORED' | 'RESUME_DOWNLOADED' | 'RESUME_VIEWED'
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_VERIFIED' | 'DOCUMENT_REJECTED'
  
  // Communication
  | 'MESSAGE_RECEIVED' | 'MESSAGE_SENT' | 'MESSAGE_READ' | 'CHAT_STARTED' | 'CHAT_ENDED'
  | 'EMAIL_SENT' | 'SMS_SENT' | 'CALL_SCHEDULED' | 'CALL_COMPLETED'
  
  // System & Admin
  | 'SYSTEM_ANNOUNCEMENT' | 'SYSTEM_MAINTENANCE' | 'SYSTEM_UPDATE' | 'SECURITY_ALERT'
  | 'ADMIN_ACTION' | 'USER_SUSPENDED' | 'USER_ACTIVATED' | 'USER_DELETED'
  
  // OTP & Authentication
  | 'OTP_SENT' | 'OTP_VERIFIED' | 'OTP_FAILED' | 'OTP_EXPIRED'
  
  // Job Alerts & Recommendations
  | 'JOB_ALERT_MATCH' | 'JOB_RECOMMENDATION' | 'SKILL_MATCH' | 'LOCATION_MATCH' | 'SALARY_MATCH'
  | 'ALERT_CREATED' | 'ALERT_UPDATED' | 'ALERT_DELETED'
  
  // Analytics & Insights
  | 'DASHBOARD_UPDATE' | 'ANALYTICS_READY' | 'REPORT_GENERATED' | 'INSIGHT_AVAILABLE'
  | 'PERFORMANCE_UPDATE' | 'METRICS_CHANGED'
  
  // Payment & Subscription
  | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'SUBSCRIPTION_ACTIVE' | 'SUBSCRIPTION_EXPIRED'
  | 'INVOICE_GENERATED' | 'REFUND_PROCESSED'
  
  // Legacy types (maintain compatibility)
  | 'info' | 'success' | 'warning' | 'error';

export interface SocketUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  socketId: string;
}

class SocketNotificationService {
  public io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    
    // Initialize real-time dashboard
    realTimeDashboard.setSocketServer(io);
    realTimeDashboard.start();
  }

  private setupMiddleware() {
    // Authentication middleware for Socket.io
    this.io.use(async (socket, next) => {
      try {
        console.log('🔐 Socket authentication attempt for:', socket.handshake.auth);
        
        // Get token from handshake
        const token = socket.handshake.auth.token || socket.handshake.auth.accessToken;
        
        if (!token) {
          console.log('❌ No token provided');
          return next(new Error('Authentication token required'));
        }

        // Verify the token (this should match your NextAuth.js JWT verification)
        const session = await this.verifyToken(token);
        
        if (!session?.user) {
          console.log('❌ Invalid token');
          return next(new Error('Invalid authentication token'));
        }

        // Add user info to socket
        socket.data.user = session.user;
        console.log('✅ Socket authenticated for user:', session.user.email);
        next();
      } catch (error) {
        console.error('❌ Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private async verifyToken(token: string) {
    try {
      console.log('🔐 Verifying token:', token.substring(0, 20) + '...');
      
      // For development, accept user ID directly
      if (token.length > 20 && !token.includes('.')) {
        // Likely a user ID, verify it exists
        const user = await prisma.user.findUnique({
          where: { id: token },
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        });

        if (user) {
          console.log('✅ Token verified as user ID:', user.email);
          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.email,
              role: user.role
            }
          };
        }
      }

      // Try JWT verification
      try {
        const secret = process.env.NEXTAUTH_SECRET || 'fallback_secret';
        
        const decoded = jwt.verify(token, secret) as { userId?: string; sub?: string; id?: string };
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId || decoded.sub || decoded.id },
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        });

        if (user) {
          console.log('✅ JWT token verified:', user.email);
          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.email,
              role: user.role
            }
          };
        }
      } catch {
        console.log('⚠️ JWT verification failed, trying alternative methods');
      }

      console.log('❌ Token verification failed for all methods');
      return null;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return null;
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      const userId = user.id;
      const userRoom = `user:${userId}`;

      console.log(`🔌 User connected: ${user.email} (${userId}) - Socket: ${socket.id}`);

      // Store user connection
      const socketUser: SocketUser = {
        userId,
        email: user.email,
        name: user.name,
        role: user.role,
        socketId: socket.id
      };

      this.connectedUsers.set(socket.id, socketUser);
      
      // Track user rooms
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId)!.add(socket.id);

      // Join user-specific room
      socket.join(userRoom);
      console.log(`📱 User ${user.email} joined room: ${userRoom}`);

      // Join role-based rooms
      if (user.role === 'employer') {
        socket.join('employers');
        console.log(`💼 Employer ${user.email} joined employers room`);
        // Get user's company ID and join company room
        this.joinCompanyRoom(socket, userId);
      } else if (user.role === 'admin') {
        socket.join('admin:global');
        socket.join('admins'); // Also join general admins room
        console.log(`👑 Admin ${user.email} joined admin:global and admins rooms`);
      } else {
        // Default to jobseeker role
        socket.join('jobseekers');
        console.log(`👤 Jobseeker ${user.email} joined jobseekers room`);
      }
      
      // Subscribe to dashboard updates
      realTimeDashboard.subscribeUser(socket, userId, user.role || 'jobseeker');

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to real-time notifications',
        userId,
        userRoom,
        timestamp: new Date().toISOString()
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${user.email} (${userId}) - Socket: ${socket.id}`);
        
        // Remove from tracking
        this.connectedUsers.delete(socket.id);
        
        const userSockets = this.userRooms.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.userRooms.delete(userId);
          }
        }
        
        // Unsubscribe from dashboard updates
        realTimeDashboard.unsubscribeUser(socket, userId, user?.role || 'jobseeker');
      });

      // Handle notification acknowledgment
      socket.on('notification_read', async (data) => {
        try {
          const { notificationId } = data;
          if (notificationId) {
            await this.markNotificationAsRead(notificationId, userId);
            console.log(`✅ Notification ${notificationId} marked as read by ${user.email}`);
            
            // Update unread count
            await this.updateUnreadCount(userId);
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });

      // Handle typing indicators for messages (future feature)
      socket.on('typing_start', (data) => {
        const { receiverId } = data;
        socket.to(`user:${receiverId}`).emit('user_typing', {
          userId,
          userName: user.name,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data) => {
        const { receiverId } = data;
        socket.to(`user:${receiverId}`).emit('user_typing', {
          userId,
          userName: user.name,
          isTyping: false
        });
      });
    });
  }

  // Private helper methods
  private async joinCompanyRoom(socket: unknown, userId: string) {
    try {
      const companies = await prisma.company.findMany({
        where: { createdBy: userId },
        select: { id: true }
      });

      for (const company of companies) {
        const companyRoom = `company:${company.id}`;
        (socket as { join: (room: string) => void }).join(companyRoom);
        console.log(`🏢 User ${userId} joined company room: ${companyRoom}`);
      }
    } catch (error) {
      console.error('❌ Failed to join company room:', error);
    }
  }

  // Public methods for sending notifications

  /**
   * Send notification to a specific user
   */
  async sendNotificationToUser(
    userId: string, 
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    try {
      console.log(`📤 Sending notification to user ${userId}:`, notification);

      // 1. Save to database FIRST
      const dbNotification = await createNotification({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      });

      // 2. Get fresh unread count from database
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });

      // 3. Send real-time notification
      this.io.to(`user:${userId}`).emit('new_notification', {
        ...dbNotification,
        timestamp: new Date().toISOString()
      });

      // 4. Send updated unread count
      this.io.to(`user:${userId}`).emit('notification_count', {
        count: unreadCount,
        userId
      });

      console.log(`✅ Notification sent to user ${userId}: ${notification.title} (Unread: ${unreadCount})`);
      return dbNotification;
    } catch (error) {
      console.error(`❌ Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to a specific room
   */
  async sendNotificationToRoom(
    room: string,
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    try {
      console.log(`📤 Sending notification to room ${room}:`, notification);

      // Get all users in this room (for database storage)
      const roomUsers = await this.getUsersInRoom(room);
      
      // Create notifications for all users in the room
      const dbNotifications = [];
      for (const userId of roomUsers) {
        const dbNotification = await createNotification({
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data
        });
        dbNotifications.push(dbNotification);
      }

      // Send to room
      this.io.to(room).emit('new_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      // Update unread counts for all users in room
      for (const userId of roomUsers) {
        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false }
        });
        this.io.to(`user:${userId}`).emit('notification_count', {
          count: unreadCount,
          userId
        });
      }

      console.log(`✅ Notification sent to room ${room}: ${notification.title}`);
      return dbNotifications;
    } catch (error) {
      console.error(`❌ Failed to send notification to room ${room}:`, error);
      throw error;
    }
  }

  /**
   * Send an existing notification via Socket.io (without creating a new one in database)
   */
  sendExistingNotification(notification: { userId: string; title: string; [key: string]: unknown }) {
    try {
      console.log(`📤 Sending existing notification via Socket.io:`, notification.title);

      // Send real-time notification
      this.io.to(`user:${notification.userId}`).emit('new_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Existing notification sent via Socket.io: ${notification.title}`);
    } catch (error) {
      console.error(`❌ Failed to send existing notification via Socket.io:`, error);
      throw error;
    }
  }

  // Role-based notification methods for dynamic notifications

  /**
   * Send notification to all jobseekers
   */
  async sendNotificationToJobseekers(
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    try {
      console.log(`📤 Sending notification to all jobseekers:`, notification.title);

      // Send to jobseekers room
      this.io.to('jobseekers').emit('notification:jobseeker', {
        ...notification,
        timestamp: new Date().toISOString(),
        role: 'jobseeker'
      });

      // Also send as broadcast notification for compatibility
      this.io.to('jobseekers').emit('broadcast_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notification sent to jobseekers: ${notification.title}`);
    } catch (error) {
      console.error(`❌ Failed to send notification to jobseekers:`, error);
      throw error;
    }
  }

  /**
   * Send notification to all employers
   */
  async sendNotificationToEmployers(
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    try {
      console.log(`📤 Sending notification to all employers:`, notification.title);

      // Send to employers room
      this.io.to('employers').emit('notification:employer', {
        ...notification,
        timestamp: new Date().toISOString(),
        role: 'employer'
      });

      // Also send as broadcast notification for compatibility
      this.io.to('employers').emit('broadcast_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notification sent to employers: ${notification.title}`);
    } catch (error) {
      console.error(`❌ Failed to send notification to employers:`, error);
      throw error;
    }
  }

  /**
   * Send notification to all admins
   */
  async sendNotificationToAdmins(
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    try {
      console.log(`📤 Sending notification to all admins:`, notification.title);

      // Send to admin room
      this.io.to('admin:global').emit('notification:admin', {
        ...notification,
        timestamp: new Date().toISOString(),
        role: 'admin'
      });

      // Also send as broadcast notification for compatibility
      this.io.to('admin:global').emit('broadcast_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notification sent to admins: ${notification.title}`);
    } catch (error) {
      console.error(`❌ Failed to send notification to admins:`, error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[], 
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    const promises = userIds.map(userId => 
      this.sendNotificationToUser(userId, notification)
    );
    
    return Promise.allSettled(promises);
  }

  /**
   * Send notification to users by role
   */
  async sendNotificationToRole(
    role: string, 
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    try {
      // Get all users with the specified role
      const users = await prisma.user.findMany({
        where: { role },
        select: { id: true }
      });

      const userIds = users.map(user => user.id);
      return this.sendNotificationToUsers(userIds, notification);
    } catch (error) {
      console.error(`❌ Failed to send notification to role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to all connected users
   */
  async sendBroadcastNotification(
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    }
  ) {
    try {
      console.log('📢 Broadcasting notification:', notification);
      
      // Send to all connected sockets
      this.io.emit('broadcast_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Broadcast notification sent');
    } catch (error) {
      console.error('❌ Failed to send broadcast notification:', error);
      throw error;
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get users by role
   */
  getConnectedUsersByRole(role: string): SocketUser[] {
    return Array.from(this.connectedUsers.values()).filter(user => user.role === role);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userRooms.has(userId) && this.userRooms.get(userId)!.size > 0;
  }

  private async getUsersInRoom(room: string): Promise<string[]> {
    try {
      if (room === 'admin:global') {
        const admins = await prisma.user.findMany({
          where: { role: 'admin' },
          select: { id: true }
        });
        return admins.map(admin => admin.id);
      }
      
      if (room.startsWith('company:')) {
        const companyId = room.replace('company:', '');
        const companyUsers = await prisma.user.findMany({
          where: { 
            role: 'employer',
            createdCompanies: {
              some: { id: companyId }
            }
          },
          select: { id: true }
        });
        return companyUsers.map(user => user.id);
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to get users in room:', error);
      return [];
    }
  }

  async updateUnreadCount(userId: string) {
    try {
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });
      
      this.io.to(`user:${userId}`).emit('notification_count', {
        count: unreadCount,
        userId
      });
    } catch (error) {
      console.error('❌ Failed to update unread count:', error);
    }
  }

  private async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

// Export singleton instance
let socketService: SocketNotificationService | null = null;

export function initializeSocketService(io: SocketIOServer): SocketNotificationService {
  if (!socketService) {
    socketService = new SocketNotificationService(io);
  }
  return socketService;
}

export function getSocketService(): SocketNotificationService | null {
  return socketService;
}

// Get the Socket.io server instance
export function getServerSocket(): SocketIOServer | null {
  return socketService?.io || null;
}

// Export the class as default
export default SocketNotificationService;
