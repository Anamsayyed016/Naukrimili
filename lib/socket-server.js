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
    io: io,
    connectedUsers: new Map(),
    userRooms: new Map()
  };

  // Handle connections
  io.on('connection', function(socket) {
    console.log('🔌 User connected:', socket.id);

    // Track connection
    service.connectedUsers.set(socket.id, {
      socketId: socket.id,
      connectedAt: new Date()
    });

    socket.on('disconnect', function() {
      console.log('🔌 User disconnected:', socket.id);
      service.connectedUsers.delete(socket.id);
    });

    // Listen for authentication
    socket.on('authenticate', function(data) {
      if (data && data.userId) {
        const user = service.connectedUsers.get(socket.id);
        if (user) {
          user.userId = data.userId;
          user.role = data.role;
          
          // Join user room
          socket.join('user:' + data.userId);
          
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
          console.log('✅ User authenticated: ' + data.userId + ' (' + data.role + ')');
        }
      }
    });

    // Handle notification acknowledgment
    socket.on('notification_read', function(data) {
      console.log('✅ Notification marked as read:', data.notificationId);
    });
  });

  // Add helper methods to service
  service.sendNotificationToAdmins = function(notification) {
    console.log('📤 Sending notification to admins:', notification.title);
    
    // Send to admin rooms
    const notificationData = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: new Date().toISOString(),
      role: 'admin'
    };
    
    io.to('admin:global').emit('notification:admin', notificationData);
    io.to('admins').emit('notification:admin', notificationData);
    
    console.log('✅ Admin notification sent');
    return { success: true, sent: true };
  };

  service.sendNotificationToUser = function(userId, notification) {
    console.log('📤 Sending notification to user ' + userId + ':', notification.title);
    
    const notificationData = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: new Date().toISOString()
    };
    
    io.to('user:' + userId).emit('new_notification', notificationData);
    
    console.log('✅ Notification sent to user ' + userId);
  };

  service.sendNotificationToEmployers = function(notification) {
    console.log('📤 Sending notification to employers:', notification.title);
    
    const notificationData = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: new Date().toISOString(),
      role: 'employer'
    };
    
    io.to('employers').emit('notification:employer', notificationData);
    
    console.log('✅ Employer notification sent');
    return { success: true, sent: true };
  };

  service.sendNotificationToJobseekers = function(notification) {
    console.log('📤 Sending notification to jobseekers:', notification.title);
    
    const notificationData = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: new Date().toISOString(),
      role: 'jobseeker'
    };
    
    io.to('jobseekers').emit('notification:jobseeker', notificationData);
    
    console.log('✅ Jobseeker notification sent');
    return { success: true, sent: true };
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
  initializeSocketService: initializeSocketService,
  getSocketService: getSocketService
};
