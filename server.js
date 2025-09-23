/**
 * Custom Next.js Server with Socket.io Integration
 * This server wraps Next.js with Socket.io for real-time notifications
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0');
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
      // Simple health check endpoint
      if (req.url === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development'
        }));
        return;
      }
      
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
    const socketService = initializeSocketService(io);
    console.log('✅ Socket notification service initialized');
    
    // Set the socket service in the notification service
    try {
      setSocketService(socketService);
      console.log('✅ Socket service linked to notification service');
    } catch (linkError) {
      console.warn('⚠️ Failed to link socket service to notification service:', linkError);
    }
  } catch (error) {
    console.error('❌ Failed to initialize socket service:', error);
    console.log('⚠️ Continuing without socket service...');
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