/**
 * Socket.io Server for Real-time Notifications - JavaScript Version
 * This is a simplified JavaScript version for server-side import
 */

import { Server as SocketIOServer } from 'socket.io';

// Simple notification service for real-time notifications
class SimpleSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.setupEventHandlers();
    console.log('✅ Simple Socket Service initialized');
  }

  async sendPendingNotifications(userId, socket) {
    try {
      console.log(`🔔 Checking for pending notifications for user ${userId}`);
      
      // Import Prisma dynamically to avoid circular dependencies
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Get unread notifications for the user
      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Limit to recent notifications
      });
      
      console.log(`📬 Found ${notifications.length} pending notifications for user ${userId}`);
      
      // Send each notification to the user
      notifications.forEach(notification => {
        const notificationData = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt.toISOString(),
          isRead: notification.isRead
        };
        
        console.log(`📤 Sending notification: ${notification.title} to user ${userId}`);
        socket.emit('notification', notificationData);
      });
      
      // Send notification count update
      socket.emit('notification_count', {
        count: notifications.length,
        userId: userId
      });
      
      await prisma.$disconnect();
      
    } catch (error) {
      console.error('❌ Error sending pending notifications:', error);
    }
  }


  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // Handle user authentication and room joining
      socket.on('authenticate', (data) => {
        try {
          const { userId, email, name, role } = data;
          
          if (!userId) {
            socket.emit('auth_error', { message: 'User ID required' });
            return;
          }

          // Store user info
          this.connectedUsers.set(socket.id, { userId, email, name, role });
          
          // Join user-specific room
          socket.join(`user:${userId}`);
          
          // Join role-based rooms
          if (role === 'admin') {
            socket.join('admin:global');
          } else if (role === 'employer') {
            // Join company-specific room if available
            socket.join(`employer:${userId}`);
          }

          console.log(`✅ User ${email} authenticated and joined rooms`);
          
          // Check for pending notifications and send them
          this.sendPendingNotifications(userId, socket);
          
          socket.emit('authenticated', { 
            message: 'Authentication successful',
            userId,
            role 
          });

        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle notification marking as read
      socket.on('mark_notification_read', (data) => {
        try {
          const { notificationId } = data;
          const user = this.connectedUsers.get(socket.id);
          
          if (user) {
            console.log(`✅ Notification ${notificationId} marked as read by ${user.email}`);
            // Here you would typically update the database
            // For now, just emit back the confirmation
            socket.emit('notification_marked_read', { notificationId });
          }
        } catch (error) {
          console.error('❌ Error marking notification as read:', error);
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { receiverId } = data;
        const user = this.connectedUsers.get(socket.id);
        
        if (user) {
          socket.to(`user:${receiverId}`).emit('user_typing', {
            userId: user.userId,
            userName: user.name,
            isTyping: true
          });
        }
      });

      socket.on('typing_stop', (data) => {
        const { receiverId } = data;
        const user = this.connectedUsers.get(socket.id);
        
        if (user) {
          socket.to(`user:${receiverId}`).emit('user_typing', {
            userId: user.userId,
            userName: user.name,
            isTyping: false
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          console.log(`🔌 User disconnected: ${user.email}`);
        }
        this.connectedUsers.delete(socket.id);
      });
    });
  }

  // Send notification to specific user (updated method)
  async sendNotificationToUser(userId, notification) {
    try {
      console.log(`📤 Sending notification to user ${userId}:`, notification);
      
      // Find all connected sockets for this user
      const userSockets = Array.from(this.connectedUsers.entries())
        .filter(([_, user]) => user.userId === userId)
        .map(([socketId, _]) => socketId);
      
      if (userSockets.length === 0) {
        console.log(`⚠️ User ${userId} is not currently connected, notification will be sent when they connect`);
        return false;
      }
      
      // Send notification to all user's connected sockets
      userSockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('notification', notification);
          console.log(`✅ Notification sent to socket ${socketId} for user ${userId}`);
        }
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to send notification to user ${userId}:`, error);
      return false;
    }
  }

  // Send notification to role-based room
  async sendNotificationToRoom(room, notification) {
    try {
      console.log(`📤 Sending notification to room ${room}:`, notification);
      
      // Send to room
      this.io.to(room).emit('new_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notification sent to room ${room}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send notification to room ${room}:`, error);
      return false;
    }
  }

  // Broadcast notification to all connected users
  async broadcastNotification(notification) {
    try {
      console.log(`📤 Broadcasting notification:`, notification);
      
      this.io.emit('broadcast_notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Notification broadcasted: ${notification.title}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to broadcast notification:`, error);
      return false;
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users info
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }
}

// Global instance
let socketService = null;

// Initialize function
function initializeSocketService(io) {
  if (!socketService) {
    socketService = new SimpleSocketService(io);
    console.log('✅ Socket Notification Service initialized successfully');
  }
  return socketService;
}

// Export functions
export {
  initializeSocketService,
  SimpleSocketService
};
