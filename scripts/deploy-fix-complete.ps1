# PowerShell script for Windows deployment fix
Write-Host "🚀 CRITICAL DEPLOYMENT FIX - Starting..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue

# 1. Check Node.js and npm versions
Write-Host "ℹ️  Checking Node.js and npm versions..." -ForegroundColor Blue
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✅ npm: $npmVersion" -ForegroundColor Green

# 2. Clean everything
Write-Host "ℹ️  Cleaning previous builds and caches..." -ForegroundColor Blue
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
if (Test-Path "production") { Remove-Item -Recurse -Force "production" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
Write-Host "✅ Cleanup completed" -ForegroundColor Green

# 3. Create necessary directories
Write-Host "ℹ️  Creating necessary directories..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
New-Item -ItemType Directory -Force -Path ".next" | Out-Null
New-Item -ItemType Directory -Force -Path ".next\server" | Out-Null
Write-Host "✅ Directories created" -ForegroundColor Green

# 4. Check package.json
Write-Host "ℹ️  Checking package.json..." -ForegroundColor Blue
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ package.json found" -ForegroundColor Green

# 5. Install dependencies
Write-Host "ℹ️  Installing dependencies..." -ForegroundColor Blue
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NODE_ENV = "production"

# Create .npmrc for production
@"
engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
"@ | Out-File -FilePath ".npmrc" -Encoding UTF8

# Install dependencies
npm install --legacy-peer-deps --engine-strict=false --force
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# 6. Generate Prisma client
Write-Host "ℹ️  Generating Prisma client..." -ForegroundColor Blue
npx prisma generate
Write-Host "✅ Prisma client generated" -ForegroundColor Green

# 7. Create BUILD_ID
Write-Host "ℹ️  Creating BUILD_ID..." -ForegroundColor Blue
$buildId = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$buildId | Out-File -FilePath ".next\BUILD_ID" -Encoding UTF8
Write-Host "✅ BUILD_ID created: $buildId" -ForegroundColor Green

# 8. Build the application
Write-Host "ℹ️  Building Next.js application..." -ForegroundColor Blue
$env:NODE_OPTIONS = "--max-old-space-size=4096"
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:NODE_ENV = "production"

npm run build
Write-Host "✅ Build completed" -ForegroundColor Green

# 9. Verify build files
Write-Host "ℹ️  Verifying build files..." -ForegroundColor Blue
if ((Test-Path ".next\BUILD_ID") -and (Test-Path ".next\server") -and (Test-Path ".next\package.json")) {
    Write-Host "✅ All critical build files present" -ForegroundColor Green
} else {
    Write-Host "❌ Build verification failed - missing critical files" -ForegroundColor Red
    Get-ChildItem ".next" | Format-Table
    exit 1
}

# 10. Create optimized server.cjs
Write-Host "ℹ️  Creating optimized server.cjs..." -ForegroundColor Blue
@"
const { createServer } = require('http');
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
});
"@ | Out-File -FilePath "server.cjs" -Encoding UTF8
Write-Host "✅ server.cjs created" -ForegroundColor Green

# 11. Create PM2 ecosystem config
Write-Host "ℹ️  Creating PM2 ecosystem config..." -ForegroundColor Blue
@"
module.exports = {
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
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-naukrimili-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-naukrimili-production",
        DATABASE_URL: "postgresql://postgres:password@localhost:5432/jobportal"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=4096",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SKIP_GOOGLE_FONTS: "true",
        NEXT_PUBLIC_APP_URL: "https://naukrimili.com",
        NEXTAUTH_URL: "https://naukrimili.com",
        NEXTAUTH_SECRET: "jobportal-secret-key-2024-naukrimili-production-deployment",
        JWT_SECRET: "jobportal-jwt-secret-2024-naukrimili-production",
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
};
"@ | Out-File -FilePath "ecosystem.config.cjs" -Encoding UTF8
Write-Host "✅ ecosystem.config.cjs created" -ForegroundColor Green

# 12. Stop existing PM2 processes
Write-Host "ℹ️  Stopping existing PM2 processes..." -ForegroundColor Blue
pm2 stop jobportal 2>$null
pm2 delete jobportal 2>$null
Write-Host "✅ PM2 processes stopped" -ForegroundColor Green

# 13. Start with PM2
Write-Host "ℹ️  Starting application with PM2..." -ForegroundColor Blue
pm2 start ecosystem.config.cjs --env production
Write-Host "✅ Application started with PM2" -ForegroundColor Green

# 14. Save PM2 configuration
Write-Host "ℹ️  Saving PM2 configuration..." -ForegroundColor Blue
pm2 save
Write-Host "✅ PM2 configuration saved" -ForegroundColor Green

# 15. Show status
Write-Host "ℹ️  Checking PM2 status..." -ForegroundColor Blue
pm2 status

Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "✅ DEPLOYMENT FIX COMPLETED!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "ℹ️  Next steps:" -ForegroundColor Blue
Write-Host "1. Check PM2 status: pm2 status"
Write-Host "2. View logs: pm2 logs jobportal"
Write-Host "3. Monitor: pm2 monit"
Write-Host "4. Test URL: http://localhost:3000"
Write-Host ""
Write-Host "ℹ️  If issues persist, check:" -ForegroundColor Blue
Write-Host "- Database connection"
Write-Host "- Environment variables"
Write-Host "- Port availability"
Write-Host "- PM2 logs for errors"
Write-Host ""
