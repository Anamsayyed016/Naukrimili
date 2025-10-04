/**
 * Custom Next.js Server with Socket.io Integration
 * This server wraps Next.js with Socket.io for real-time notifications
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { existsSync } from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0');
const port = parseInt(process.env.PORT || '3000', 10);

console.log('🚀 Starting custom Next.js server with Socket.io...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);
console.log(`Hostname: ${hostname}`);

// Check required environment variables
const requiredEnvVars = ['NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}
console.log('✅ Environment variables verified');

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  console.log('✅ Next.js app prepared');
  
  // Verify .next directory exists
  if (!existsSync('.next')) {
    console.error('❌ .next directory not found! Make sure the app is built.');
    process.exit(1);
  }
  console.log('✅ .next directory verified');

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
        'http://localhost:3001',
        'https://aftionix.in',
        'https://www.aftionix.in',
        'https://jobportal.aftionix.in'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  console.log('✅ Socket.io server initialized successfully');

  // Initialize the notification service
  try {
    const { initializeSocketService } = await import('./lib/socket-server.js');
    const socketService = initializeSocketService(io);
    console.log('✅ Socket notification service initialized');
    console.log('✅ Socket service linked to notification service');
  } catch (error) {
    console.error('❌ Failed to initialize socket service:', error);
    console.log('⚠️ Continuing without socket service...');
    // Don't fail the entire server if socket service fails
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