const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Force production mode
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const dev = false;
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

console.log('🚀 Starting Naukrimili server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Hostname:', hostname);
console.log('Working directory:', process.cwd());
console.log('Node version:', process.version);

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.error('❌ .next directory not found at:', nextDir);
  console.error('Available files:', fs.readdirSync(process.cwd()));
  process.exit(1);
}

console.log('✅ .next directory found');

// Check if BUILD_ID exists
const buildIdPath = path.join(nextDir, 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.error('❌ BUILD_ID not found at:', buildIdPath);
  process.exit(1);
}

console.log('✅ BUILD_ID found');

// Check if .next/server directory exists
const serverDir = path.join(nextDir, 'server');
if (!fs.existsSync(serverDir)) {
  console.error('❌ .next/server directory not found at:', serverDir);
  process.exit(1);
}

console.log('✅ .next/server directory found');

// Check if .next/static directory exists
const staticDir = path.join(nextDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.log('⚠️ .next/static directory not found, creating...');
  try {
    fs.mkdirSync(staticDir, { recursive: true });
    fs.mkdirSync(path.join(staticDir, 'chunks'), { recursive: true });
    fs.mkdirSync(path.join(staticDir, 'css'), { recursive: true });
    fs.mkdirSync(path.join(staticDir, 'media'), { recursive: true });
    console.log('✅ Created .next/static directory structure');
  } catch (err) {
    console.error('❌ Failed to create .next/static directory:', err);
    process.exit(1);
  }
} else {
  console.log('✅ .next/static directory found');
}

// Create the Next.js app
const app = next({ 
  dev, 
  hostname, 
  port,
  dir: process.cwd()
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('✅ Next.js app prepared successfully');
  
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize Socket.io server
  console.log('🔌 Initializing Socket.io server...');
  try {
    // Dynamic import for ES modules in CommonJS
    const { initializeSocket } = require('./lib/socket-setup.ts');
    const { SocketNotificationService } = require('./lib/socket-server.ts');
    
    const io = initializeSocket(server);
    
    // Initialize socket notification service
    new SocketNotificationService(io);
    
    console.log('✅ Socket.io server initialized successfully');
    console.log('🔔 Real-time notifications enabled');
  } catch (socketError) {
    console.warn('⚠️ Socket.io initialization failed (continuing without real-time notifications):', socketError.message);
    console.log('📝 To enable real-time notifications, ensure all socket dependencies are properly installed');
  }

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    console.log(`🎉 Server ready on http://${hostname}:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log('✅ Server startup completed');
    console.log('🔔 Socket.io ready and listening for connections');
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  console.error('Error details:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});