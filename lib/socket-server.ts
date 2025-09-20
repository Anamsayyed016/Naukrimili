/**
 * Socket.io Server for Real-time Notifications
 * Integrates with existing NextAuth.js and notification system
 */

import { Server as SocketIOServer } from 'socket.io';
import { NextRequest } from 'next/server';
import { auth } from './nextauth-config';
import { createNotification, NotificationData, CreateNotificationData } from './notification-service';
import { prisma } from './prisma';

// Use the notification service types
export type NotificationType = CreateNotificationData['type'];

export interface SocketUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  socketId: string;
}

class SocketNotificationService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
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
      // This should match your NextAuth.js JWT verification
      // For now, we'll use a simple approach - in production, use proper JWT verification
      const jwt = require('jsonwebtoken');
      const secret = process.env.NEXTAUTH_SECRET || 'fallback_secret';
      
      const decoded = jwt.verify(token, secret);
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true }
      });

      if (!user) {
        return null;
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      const userId = user.id;
      const userRoom = `user_${userId}`;

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
      });

      // Handle notification acknowledgment
      socket.on('notification_read', async (data) => {
        try {
          const { notificationId } = data;
          if (notificationId) {
            await this.markNotificationAsRead(notificationId, userId);
            console.log(`✅ Notification ${notificationId} marked as read by ${user.email}`);
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      });

      // Handle typing indicators for messages (future feature)
      socket.on('typing_start', (data) => {
        const { receiverId } = data;
        socket.to(`user_${receiverId}`).emit('user_typing', {
          userId,
          userName: user.name,
          isTyping: true
        });
      });

      socket.on('typing_stop', (data) => {
        const { receiverId } = data;
        socket.to(`user_${receiverId}`).emit('user_typing', {
          userId,
          userName: user.name,
          isTyping: false
        });
      });
    });
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

      // Save to database using existing service
      const dbNotification = await createNotification({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      });

      // Send real-time notification
      this.io.to(`user_${userId}`).emit('new_notification', {
        ...dbNotification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notification sent to user ${userId}: ${notification.title}`);
      return dbNotification;
    } catch (error) {
      console.error(`❌ Failed to send notification to user ${userId}:`, error);
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

export default SocketNotificationService;
