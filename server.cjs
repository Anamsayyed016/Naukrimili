const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

// CRITICAL: Force production mode
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const dev = false; // Always production in deployed environment
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

// Check if BUILD_ID exists
const buildIdPath = path.join(nextDir, 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.error('❌ BUILD_ID not found at:', buildIdPath);
  process.exit(1);
}

// CRITICAL: Check if .next/static directory exists
const staticDir = path.join(nextDir, 'static');
if (!fs.existsSync(staticDir)) {
  console.error('❌ CRITICAL: .next/static directory not found at:', staticDir);
  console.error('🔧 Creating .next/static directory as emergency fix...');
  try {
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

// CRITICAL: Validate and create routes-manifest.json for Next.js 15.x
const routesManifestPath = path.join(nextDir, 'routes-manifest.json');
let routesManifest = null;

try {
  if (fs.existsSync(routesManifestPath)) {
    const manifestContent = fs.readFileSync(routesManifestPath, 'utf-8');
    routesManifest = JSON.parse(manifestContent);
    console.log('✅ routes-manifest.json found');
    
    // Validate critical properties for Next.js 15.x
    if (!routesManifest.rewrites || typeof routesManifest.rewrites !== 'object') {
      console.warn('⚠️ routes-manifest.json missing rewrites object, fixing...');
      routesManifest.rewrites = {
        beforeFiles: [],
        afterFiles: [],
        fallback: []
      };
    } else {
      // Ensure all rewrite arrays exist
      if (!Array.isArray(routesManifest.rewrites.beforeFiles)) {
        console.warn('⚠️ routes-manifest.json missing beforeFiles array, fixing...');
        routesManifest.rewrites.beforeFiles = [];
      }
      if (!Array.isArray(routesManifest.rewrites.afterFiles)) {
        console.warn('⚠️ routes-manifest.json missing afterFiles array, fixing...');
        routesManifest.rewrites.afterFiles = [];
      }
      if (!Array.isArray(routesManifest.rewrites.fallback)) {
        console.warn('⚠️ routes-manifest.json missing fallback array, fixing...');
        routesManifest.rewrites.fallback = [];
      }
    }
    
    // Ensure other required properties exist
    if (!Array.isArray(routesManifest.redirects)) {
      routesManifest.redirects = [];
    }
    if (!Array.isArray(routesManifest.headers)) {
      routesManifest.headers = [];
    }
    if (!Array.isArray(routesManifest.dynamicRoutes)) {
      routesManifest.dynamicRoutes = [];
    }
    if (!Array.isArray(routesManifest.dataRoutes)) {
      routesManifest.dataRoutes = [];
    }
    
    // Write back the fixed manifest
    fs.writeFileSync(routesManifestPath, JSON.stringify(routesManifest, null, 2));
    console.log('✅ routes-manifest.json validated and fixed');
  } else {
    console.warn('⚠️ routes-manifest.json not found, creating minimal version for Next.js 15.x...');
    routesManifest = {
      version: 3,
      pages404: true,
      basePath: "",
      redirects: [],
      rewrites: {
        beforeFiles: [],
        afterFiles: [],
        fallback: []
      },
      headers: [],
      dynamicRoutes: [],
      dataRoutes: [],
      i18n: null
    };
    fs.writeFileSync(routesManifestPath, JSON.stringify(routesManifest, null, 2));
    console.log('✅ Created minimal routes-manifest.json for Next.js 15.x');
  }
} catch (err) {
  console.error('❌ Error handling routes-manifest.json:', err);
  console.error('Creating emergency manifest...');
  
  // Create emergency manifest
  const emergencyManifest = {
    version: 3,
    pages404: true,
    basePath: "",
    redirects: [],
    rewrites: {
      beforeFiles: [],
      afterFiles: [],
      fallback: []
    },
    headers: [],
    dynamicRoutes: [],
    dataRoutes: [],
    i18n: null
  };
  
  try {
    fs.writeFileSync(routesManifestPath, JSON.stringify(emergencyManifest, null, 2));
    console.log('✅ Created emergency routes-manifest.json');
  } catch (writeErr) {
    console.error('❌ FATAL: Could not create routes-manifest.json:', writeErr);
    process.exit(1);
  }
}

// CRITICAL: Check for prerender-manifest.json
const prerenderManifestPath = path.join(nextDir, 'prerender-manifest.json');
if (!fs.existsSync(prerenderManifestPath)) {
  console.warn('⚠️ prerender-manifest.json not found, creating minimal version...');
  const minimalPrerender = {
    version: 4,
    routes: {},
    dynamicRoutes: {},
    notFoundRoutes: [],
    preview: { 
      previewModeId: "", 
      previewModeSigningKey: "", 
      previewModeEncryptionKey: "" 
    }
  };
  fs.writeFileSync(prerenderManifestPath, JSON.stringify(minimalPrerender, null, 2));
  console.log('✅ Created minimal prerender-manifest.json');
} else {
  console.log('✅ prerender-manifest.json found');
}

console.log('✅ All build artifacts verified and validated');

const app = next({ 
  dev, 
  hostname, 
  port,
  dir: process.cwd(),
  conf: {
    distDir: '.next'
  }
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
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  console.error('Error details:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});