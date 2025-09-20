/**
 * Custom Next.js Server with Socket.io Integration
 * Integrates with existing PM2 ecosystem configuration
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocket } = require('./lib/socket-setup');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('🚀 Starting Next.js server with Socket.io...');
  
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

  // Initialize Socket.io
  const io = initializeSocket(server);

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`✅ Server ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.io server ready for real-time notifications`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
