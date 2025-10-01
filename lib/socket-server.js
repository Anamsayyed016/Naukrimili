/**
 * Socket.io Server for Real-time Notifications (JavaScript version)
 * Integrates with existing NextAuth.js and notification system
 */

// Basic notification types for job portal
const NOTIFICATION_TYPES = {
  // Application & Job Flow
  APPLICATION_UPDATE: 'APPLICATION_UPDATE',
  APPLICATION_RECEIVED: 'APPLICATION_RECEIVED',
  APPLICATION_REVIEWED: 'APPLICATION_REVIEWED',
  APPLICATION_SHORTLISTED: 'APPLICATION_SHORTLISTED',
  APPLICATION_REJECTED: 'APPLICATION_REJECTED',
  APPLICATION_ACCEPTED: 'APPLICATION_ACCEPTED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEW_RESCHEDULED: 'INTERVIEW_RESCHEDULED',
  INTERVIEW_CANCELLED: 'INTERVIEW_CANCELLED',
  OFFER_MADE: 'OFFER_MADE',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_REJECTED: 'OFFER_REJECTED',
  OFFER_WITHDRAWN: 'OFFER_WITHDRAWN',
  
  // Job Management
  JOB_CREATED: 'JOB_CREATED',
  JOB_UPDATED: 'JOB_UPDATED',
  JOB_DELETED: 'JOB_DELETED',
  JOB_EXPIRED: 'JOB_EXPIRED',
  JOB_REACTIVATED: 'JOB_REACTIVATED',
  JOB_FEATURED: 'JOB_FEATURED',
  JOB_VIEWED: 'JOB_VIEWED',
  JOB_APPLIED: 'JOB_APPLIED',
  JOB_SAVED: 'JOB_SAVED',
  JOB_UNSAVED: 'JOB_UNSAVED',
  JOB_SHARED: 'JOB_SHARED',
  
  // Company & Profile
  COMPANY_UPDATE: 'COMPANY_UPDATE',
  COMPANY_VERIFIED: 'COMPANY_VERIFIED',
  COMPANY_APPROVED: 'COMPANY_APPROVED',
  COMPANY_REJECTED: 'COMPANY_REJECTED',
  COMPANY_SUSPENDED: 'COMPANY_SUSPENDED',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  PROFILE_VERIFIED: 'PROFILE_VERIFIED',
  PROFILE_COMPLETED: 'PROFILE_COMPLETED',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  
  // Resume & Documents
  RESUME_UPLOADED: 'RESUME_UPLOADED',
  RESUME_PARSED: 'RESUME_PARSED',
  RESUME_ATS_SCORED: 'RESUME_ATS_SCORED',
  RESUME_DOWNLOADED: 'RESUME_DOWNLOADED',
  RESUME_VIEWED: 'RESUME_VIEWED',
  
  // System & Admin
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
  SECURITY_ALERT: 'SECURITY_ALERT',
  ADMIN_ACTION: 'ADMIN_ACTION',
  
  // Communication
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  CHAT_STARTED: 'CHAT_STARTED',
  CHAT_ENDED: 'CHAT_ENDED',
  
  // Analytics & Insights
  DASHBOARD_UPDATE: 'DASHBOARD_UPDATE',
  ANALYTICS_READY: 'ANALYTICS_READY',
  REPORT_GENERATED: 'REPORT_GENERATED',
  
  // AI & Automation
  AI_ANALYSIS_COMPLETE: 'AI_ANALYSIS_COMPLETE',
  AI_SUGGESTION_READY: 'AI_SUGGESTION_READY',
  AUTOMATION_TRIGGERED: 'AUTOMATION_TRIGGERED',
  
  // General
  GENERAL: 'GENERAL',
  WELCOME: 'WELCOME',
  REMINDER: 'REMINDER',
  ALERT: 'ALERT'
};

// Socket service class
class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();
    this.userRooms = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);
      
      // Handle user authentication and room joining
      socket.on('authenticate', (data) => {
        try {
          const { userId, userType, token } = data;
          
          if (userId) {
            this.connectedUsers.set(socket.id, {
              userId,
              userType: userType || 'jobseeker',
              socketId: socket.id,
              connectedAt: new Date()
            });
            
            // Join user-specific room
            const userRoom = `user_${userId}`;
            socket.join(userRoom);
            this.userRooms.set(userId, userRoom);
            
            console.log(`✅ User ${userId} authenticated and joined room ${userRoom}`);
            
            socket.emit('authenticated', {
              success: true,
              message: 'Successfully authenticated',
              userId,
              userType
            });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Handle joining specific rooms (company, job, etc.)
      socket.on('join_room', (data) => {
        try {
          const { roomType, roomId } = data;
          const room = `${roomType}_${roomId}`;
          socket.join(room);
          console.log(`📝 User ${socket.id} joined room: ${room}`);
          socket.emit('room_joined', { room, success: true });
        } catch (error) {
          console.error('Room join error:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Handle leaving rooms
      socket.on('leave_room', (data) => {
        try {
          const { roomType, roomId } = data;
          const room = `${roomType}_${roomId}`;
          socket.leave(room);
          console.log(`📝 User ${socket.id} left room: ${room}`);
          socket.emit('room_left', { room, success: true });
        } catch (error) {
          console.error('Room leave error:', error);
          socket.emit('error', { message: 'Failed to leave room' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          console.log(`👋 User ${user.userId} disconnected`);
          this.connectedUsers.delete(socket.id);
          this.userRooms.delete(user.userId);
        }
      });
    });
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    try {
      const userRoom = this.userRooms.get(userId);
      if (userRoom) {
        this.io.to(userRoom).emit('notification', {
          ...notification,
          timestamp: new Date().toISOString(),
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        console.log(`📤 Notification sent to user ${userId}:`, notification.type);
        return true;
      } else {
        console.log(`⚠️ User ${userId} not connected, notification queued`);
        return false;
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  // Send notification to room
  sendToRoom(roomType, roomId, notification) {
    try {
      const room = `${roomType}_${roomId}`;
      this.io.to(room).emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      console.log(`📤 Notification sent to room ${room}:`, notification.type);
      return true;
    } catch (error) {
      console.error('Error sending notification to room:', error);
      return false;
    }
  }

  // Broadcast to all connected users
  broadcast(notification) {
    try {
      this.io.emit('notification', {
        ...notification,
        timestamp: new Date().toISOString(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      console.log(`📢 Broadcast notification sent:`, notification.type);
      return true;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return false;
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users list
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }
}

// Initialize socket service
export function initializeSocketService(io) {
  console.log('🔌 Initializing Socket Service...');
  const socketService = new SocketService(io);
  console.log('✅ Socket Service initialized successfully');
  return socketService;
}

// Export notification types
export { NOTIFICATION_TYPES };