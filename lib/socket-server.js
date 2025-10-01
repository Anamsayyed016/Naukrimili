import { Server as SocketIOServer } from 'socket.io';

export function initializeSocketService(io) {
  console.log('🔌 Initializing Socket Service...');
  
  // Example: Handle connections
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });

    // Add more socket event handlers here
  });
  
  console.log('✅ Socket Service initialized successfully');
  
  return {
    // You can expose methods to send notifications from other parts of your app
    sendNotification: (userId, type, message) => {
      console.log(`Sending notification to ${userId}: ${type} - ${message}`);
      io.to(userId).emit('notification', { type, message, timestamp: new Date() });
    }
  };
}
