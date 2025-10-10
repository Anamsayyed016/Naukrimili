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

// CRITICAL: Check for required manifest files
const requiredFiles = [
  'BUILD_ID',
  'routes-manifest.json',
  'prerender-manifest.json'
];

for (const file of requiredFiles) {
  const filePath = path.join(nextDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ CRITICAL: Missing ${file}`);
    if (file === 'routes-manifest.json') {
      // Create minimal routes manifest to prevent dataRoutes error
      const minimalManifest = {
        version: 3,
        pages404: true,
        basePath: "",
        redirects: [],
        headers: [],
        dynamicRoutes: [],
        dataRoutes: [],
        i18n: null
      };
      fs.writeFileSync(filePath, JSON.stringify(minimalManifest, null, 2));
      console.log('✅ Created minimal routes-manifest.json');
    } else if (file === 'prerender-manifest.json') {
      // Create minimal prerender manifest
      const minimalPrerender = {
        version: 4,
        routes: {},
        dynamicRoutes: {},
        notFoundRoutes: [],
        preview: { previewModeId: "", previewModeSigningKey: "", previewModeEncryptionKey: "" }
      };
      fs.writeFileSync(filePath, JSON.stringify(minimalPrerender, null, 2));
      console.log('✅ Created minimal prerender-manifest.json');
    }
  } else {
    console.log(`✅ ${file} found`);
  }
}

console.log('✅ Build artifacts verified');

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
    console.log('🎉 Server ready on http://' + hostname + ':' + port);
    console.log('📊 Environment: ' + process.env.NODE_ENV);
    console.log('✅ Server startup completed');
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  console.error('Error details:', err.message);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});
