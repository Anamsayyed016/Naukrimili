/**
 * Socket.io Server Setup for Next.js
 * Integrates with existing PM2 and Nginx setup
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

/**
 * Get canonical base URL - single source of truth
 */
function getCanonicalBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://naukrimili.com';
}

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  console.log('🚀 Initializing Socket.io server...');

  // Use canonical base URL - single source of truth
  const canonicalBaseUrl = getCanonicalBaseUrl();
  const isDevelopment = process.env.NODE_ENV === 'development';

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: isDevelopment 
        ? ['http://localhost:3000', canonicalBaseUrl]
        : [canonicalBaseUrl], // Production: only canonical domain
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    path: '/socket.io/' // Explicit socket path for consistency
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
