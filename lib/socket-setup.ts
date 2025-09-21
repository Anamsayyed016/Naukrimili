/**
 * Socket.io Server Setup for Next.js
 * Integrates with existing PM2 and Nginx setup
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
// Note: Socket service initialization is handled in server.js

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  console.log('🚀 Initializing Socket.io server...');

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://aftionix.in',
        'https://www.aftionix.in'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Socket service initialization is handled in server.js
  // This function just creates the Socket.io server instance

  console.log('✅ Socket.io server initialized successfully');
  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function closeSocket(): void {
  if (io) {
    io.close();
    io = null;
  }
}
