/**
 * Custom Next.js Server with Socket.io Integration
 * This server wraps Next.js with Socket.io for real-time notifications
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting custom Next.js server with Socket.io...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);
console.log(`Hostname: ${hostname}`);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  console.log('✅ Next.js app prepared');

  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.io with the HTTP server
  console.log('🔌 Initializing Socket.io...');
  const io = new SocketIOServer(server, {
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

  console.log('✅ Socket.io server initialized successfully');

  // Initialize the notification service
  try {
    const { initializeSocketService } = await import('./lib/socket-server.js');
    initializeSocketService(io);
    console.log('✅ Socket notification service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize socket service:', error);
  }

  // Start the server
  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    console.log(`✅ Server ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.io ready and listening for connections`);
  });

  // Handle server shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

}).catch((ex) => {
  console.error('❌ Failed to prepare Next.js app:', ex);
  process.exit(1);
});