/**
 * Socket.io Server for Real-time Notifications (CommonJS)
 * Simplified version for production use with server.cjs
 */

let socketServiceInstance = null;

function initializeSocketService(io) {
  console.log('🔌 Initializing Socket Service...');
  
  if (socketServiceInstance) {
    console.log('⚠️ Socket service already initialized, reusing existing instance');
    return socketServiceInstance;
  }

  // Store io instance
  const service = {
    io,
    connectedUsers: new Map(),
    userRooms: new Map()
  };

  // Handle connections
  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Track connection
    service.connectedUsers.set(socket.id, {
      socketId: socket.id,
      connectedAt: new Date()
    });

    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
      service.connectedUsers.delete(socket.id);
    });

    // Listen for authentication
    socket.on('authenticate', (data) => {
      if (data?.userId) {
        const user = service.connectedUsers.get(socket.id);
        if (user) {
          user.userId = data.userId;
          user.role = data.role;
          
          // Join user room
          socket.join(`user:${data.userId}`);
          
          // Join role-based rooms
          if (data.role === 'admin') {
            socket.join('admins');
            socket.join('admin:global');
            console.log('👑 Admin joined admin rooms');
          } else if (data.role === 'employer') {
            socket.join('employers');
            console.log('💼 Employer joined employers room');
          } else {
            socket.join('jobseekers');
            console.log('👤 Jobseeker joined jobseekers room');
          }
          
          socket.emit('authenticated', { success: true, userId: data.userId });
          console.log(`✅ User authenticated: ${data.userId} (${data.role})`);
        }
      }
    });

    // Handle notification acknowledgment
    socket.on('notification_read', (data) => {
      console.log('✅ Notification marked as read:', data.notificationId);
    });
  });

  // Add helper methods to service
  service.sendNotificationToAdmins = function(notification) {
    console.log('📤 Sending notification to admins:', notification.title);
    
    // Send to admin rooms
    io.to('admin:global').emit('notification:admin', {
      ...notification,
      timestamp: new Date().toISOString(),
      role: 'admin'
    });
    
    io.to('admins').emit('notification:admin', {
      ...notification,
      timestamp: new Date().toISOString(),
      role: 'admin'
    });
    
    console.log('✅ Admin notification sent');
  };

  service.sendNotificationToUser = function(userId, notification) {
    console.log(`📤 Sending notification to user ${userId}:`, notification.title);
    
    io.to(`user:${userId}`).emit('new_notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Notification sent to user ${userId}`);
  };

  service.sendNotificationToEmployers = function(notification) {
    console.log('📤 Sending notification to employers:', notification.title);
    
    io.to('employers').emit('notification:employer', {
      ...notification,
      timestamp: new Date().toISOString(),
      role: 'employer'
    });
    
    console.log('✅ Employer notification sent');
  };

  service.getConnectedUsersCount = function() {
    return service.connectedUsers.size;
  };

  socketServiceInstance = service;
  
  console.log('✅ Socket Service initialized successfully');
  
  return service;
}

function getSocketService() {
  return socketServiceInstance;
}

module.exports = {
  initializeSocketService,
  getSocketService
};
