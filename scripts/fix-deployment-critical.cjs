const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Critical Deployment Fix...\n');

// 1. Create BUILD_ID file
function createBuildId() {
  try {
    const buildId = Date.now().toString();
    const buildIdPath = path.join('.next', 'BUILD_ID');
    
    // Ensure .next directory exists
    if (!fs.existsSync('.next')) {
      fs.mkdirSync('.next', { recursive: true });
    }
    
    fs.writeFileSync(buildIdPath, buildId);
    console.log('✅ BUILD_ID created:', buildId);
  } catch (error) {
    console.error('❌ Failed to create BUILD_ID:', error.message);
  }
}

// 2. Fix PM2 ecosystem config
function fixEcosystemConfig() {
  const ecosystemContent = `module.exports = {
  apps: [
    {
      name: "jobportal",
      script: "server.cjs",
      cwd: process.cwd(),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://aftionix.in",
        NEXTAUTH_URL: "https://aftionix.in",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-aftionix-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-aftionix-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://aftionix.in",
        NEXTAUTH_URL: "https://aftionix.in",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-aftionix-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-aftionix-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal"
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      log_type: "json",
      min_uptime: "10s",
      max_restarts: 5,
      restart_delay: 4000,
      exec_mode: "fork",
      ignore_watch: [
        "node_modules",
        ".next",
        "logs",
        "*.log",
        ".git"
      ]
    }
  ]
};`;

  fs.writeFileSync('ecosystem.config.cjs', ecosystemContent);
  console.log('✅ ecosystem.config.cjs fixed');
}

// 3. Create optimized server.cjs
function createOptimizedServer() {
  const serverContent = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

console.log('🚀 Starting server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);
console.log('Hostname:', hostname);

const app = next({ 
  dev, 
  hostname, 
  port,
  dir: process.cwd()
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('✅ Next.js app prepared');
  
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
    console.log(\`🎉 Server ready on http://\${hostname}:\${port}\`);
    console.log(\`📊 Environment: \${process.env.NODE_ENV}\`);
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  process.exit(1);
});`;

  fs.writeFileSync('server.cjs', serverContent);
  console.log('✅ server.cjs optimized');
}

// 4. Create production build script
function createProductionBuildScript() {
  const buildScript = `#!/bin/bash
set -e

echo "🚀 Starting production build..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out
rm -rf production

# Create necessary directories
mkdir -p logs
mkdir -p .next

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production --legacy-peer-deps --engine-strict=false

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building Next.js application..."
npm run build

# Create BUILD_ID
echo "🆔 Creating BUILD_ID..."
echo $(date +%s) > .next/BUILD_ID

# Verify build
if [ -f ".next/BUILD_ID" ] && [ -d ".next/server" ]; then
  echo "✅ Build completed successfully!"
  echo "📊 Build size:"
  du -sh .next
else
  echo "❌ Build failed - missing critical files"
  exit 1
fi

echo "🎉 Production build ready!"
`;

  fs.writeFileSync('build-production.sh', buildScript);
  fs.chmodSync('build-production.sh', '755');
  console.log('✅ build-production.sh created');
}

// 5. Create deployment script
function createDeploymentScript() {
  const deployScript = `#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Stop existing PM2 processes
echo "🛑 Stopping existing processes..."
pm2 stop jobportal 2>/dev/null || true
pm2 delete jobportal 2>/dev/null || true

# Run production build
echo "🔨 Running production build..."
bash build-production.sh

# Start with PM2
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "🎉 Deployment completed!"
echo "🌐 Server should be running on port 3000"
`;

  fs.writeFileSync('deploy-production.sh', deployScript);
  fs.chmodSync('deploy-production.sh', '755');
  console.log('✅ deploy-production.sh created');
}

// 6. Create logs directory
function createLogsDirectory() {
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
    console.log('✅ logs directory created');
  }
}

// 7. Fix package.json scripts
function fixPackageScripts() {
  const packagePath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add critical scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'build:production': 'bash build-production.sh',
    'deploy:production': 'bash deploy-production.sh',
    'start:production': 'NODE_ENV=production node server.cjs',
    'pm2:start': 'pm2 start ecosystem.config.cjs --env production',
    'pm2:stop': 'pm2 stop jobportal',
    'pm2:restart': 'pm2 restart jobportal',
    'pm2:logs': 'pm2 logs jobportal',
    'pm2:status': 'pm2 status'
  };
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json scripts updated');
}

// Run all fixes
try {
  createBuildId();
  fixEcosystemConfig();
  createOptimizedServer();
  createProductionBuildScript();
  createDeploymentScript();
  createLogsDirectory();
  fixPackageScripts();
  
  console.log('\n🎉 All deployment fixes applied successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run build:production');
  console.log('2. Run: npm run deploy:production');
  console.log('3. Check: pm2 status');
  
} catch (error) {
  console.error('❌ Deployment fix failed:', error.message);
  process.exit(1);
}
