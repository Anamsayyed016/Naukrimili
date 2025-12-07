const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file FIRST (before anything else)
// This ensures DATABASE_URL is available for Prisma connections
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log('✅ Environment variables loaded from .env');
    // Verify DATABASE_URL is loaded
    if (process.env.DATABASE_URL) {
      console.log('✅ DATABASE_URL is set');
    } else {
      console.warn('⚠️  DATABASE_URL not found in environment');
    }
  } else {
    console.warn('⚠️  .env file not found, using system environment variables');
  }
} catch (error) {
  console.error('❌ Error loading .env:', error.message);
}

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
  console.error('Current working directory:', process.cwd());
  try {
    const files = fs.readdirSync(process.cwd());
    console.error('Available files in root:', files.slice(0, 20).join(', '));
  } catch (e) {
    console.error('Could not read directory:', e.message);
  }
  console.error('\n💡 SOLUTION: Run "npm run build" before starting the server');
  process.exit(1);
}

console.log('✅ .next directory found');

// Check if BUILD_ID exists, create if missing
const buildIdPath = path.join(nextDir, 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.warn('⚠️ BUILD_ID not found, creating...');
  try {
    fs.writeFileSync(buildIdPath, Date.now().toString());
    console.log('✅ BUILD_ID created');
  } catch (err) {
    console.error('❌ Failed to create BUILD_ID:', err.message);
    process.exit(1);
  }
} else {
  console.log('✅ BUILD_ID found');
}

// Check if prerender-manifest.json exists, create minimal one if missing
const prerenderManifestPath = path.join(nextDir, 'prerender-manifest.json');
if (!fs.existsSync(prerenderManifestPath)) {
  console.warn('⚠️ prerender-manifest.json not found, creating minimal version...');
  try {
    const minimalPrerenderManifest = {
      version: 4,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: {
        previewModeId: 'development-id',
        previewModeSigningKey: 'development-key',
        previewModeEncryptionKey: 'development-key'
      }
    };
    fs.writeFileSync(prerenderManifestPath, JSON.stringify(minimalPrerenderManifest, null, 2));
    console.log('✅ Created minimal prerender-manifest.json');
  } catch (err) {
    console.error('❌ Failed to create prerender-manifest.json:', err.message);
    // Don't exit - this is not critical for server startup
  }
} else {
  console.log('✅ prerender-manifest.json found');
}

// Check if .next/server directory exists
const serverDir = path.join(nextDir, 'server');
if (!fs.existsSync(serverDir)) {
  console.error('❌ .next/server directory not found at:', serverDir);
  console.error('\n💡 SOLUTION: The build did not complete successfully.');
  console.error('   Run "npm run build" and ensure it completes without errors.');
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
    // Import Socket.io directly in CommonJS
    const { Server: SocketIOServer } = require('socket.io');
    
    // Canonical base URL - single source of truth
    const canonicalBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://naukrimili.com';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const io = new SocketIOServer(server, {
      cors: {
        origin: isDevelopment 
          ? ['http://localhost:3000', canonicalBaseUrl]
          : [canonicalBaseUrl], // Production: only canonical domain (www will be redirected by middleware)
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      path: '/socket.io/' // Explicit socket path for consistency
    });
    
    // Initialize socket notification service
    const { initializeSocketService } = require('./lib/socket-server.js');
    initializeSocketService(io);
    
    console.log('✅ Socket.io server initialized successfully');
    console.log('🔔 Real-time notifications enabled');
  } catch (socketError) {
    console.warn('⚠️ Socket.io initialization failed (continuing without real-time notifications):', socketError.message);
    console.log('📝 To enable real-time notifications, ensure all socket dependencies are properly installed');
  }

  // Global error handlers to prevent crashes
  process.on('uncaughtException', (err) => {
    console.error('❌ [CRITICAL] Uncaught Exception:', err);
    console.error('Stack:', err.stack);
    // Don't exit - let PM2 handle restart if needed
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ [CRITICAL] Unhandled Promise Rejection at:', promise);
    console.error('Reason:', reason);
    // Don't exit - log and continue
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  // Graceful shutdown handler for PM2 reload (zero-downtime)
  process.on('SIGINT', () => {
    console.log('📥 Received SIGINT, starting graceful shutdown...');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
      console.log('⚠️ Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  });

  process.on('SIGTERM', () => {
    console.log('📥 Received SIGTERM, starting graceful shutdown...');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
      console.log('⚠️ Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
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
    
    // Signal PM2 that the server is ready (for zero-downtime reloads)
    if (process.send) {
      process.send('ready');
    }
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  console.error('Error details:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});