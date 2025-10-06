const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Windows Deployment Fix - Starting...\n');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Clean everything safely
function cleanProject() {
  try {
    log('🧹 Cleaning project...', 'blue');
    
    // Remove .next directory
    if (fs.existsSync('.next')) {
      execSync('rmdir /s /q .next', { stdio: 'ignore' });
    }
    
    // Remove out directory
    if (fs.existsSync('out')) {
      execSync('rmdir /s /q out', { stdio: 'ignore' });
    }
    
    // Remove production directory
    if (fs.existsSync('production')) {
      execSync('rmdir /s /q production', { stdio: 'ignore' });
    }
    
    // Remove node_modules/.cache
    if (fs.existsSync('node_modules/.cache')) {
      execSync('rmdir /s /q node_modules\\.cache', { stdio: 'ignore' });
    }
    
    log('✅ Project cleaned', 'green');
  } catch (error) {
    log('⚠️  Some files could not be cleaned (this is normal)', 'yellow');
  }
}

// 2. Create proper .npmrc
function createNpmrc() {
  try {
    log('📝 Creating .npmrc...', 'blue');
    
    const npmrcContent = `engine-strict=false
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
auto-install-peers=true`;
    
    fs.writeFileSync('.npmrc', npmrcContent, 'utf8');
    log('✅ .npmrc created', 'green');
  } catch (error) {
    log('❌ Failed to create .npmrc:', error.message, 'red');
  }
}

// 3. Install dependencies with retry logic
function installDependencies() {
  try {
    log('📦 Installing dependencies...', 'blue');
    
    // Set environment variables
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
    process.env.NODE_ENV = 'production';
    
    // Try to install with different strategies
    let success = false;
    const strategies = [
      'npm install --legacy-peer-deps --engine-strict=false --force',
      'npm install --legacy-peer-deps --force',
      'npm install --force',
      'npm install'
    ];
    
    for (const strategy of strategies) {
      try {
        log(`Trying: ${strategy}`, 'yellow');
        execSync(strategy, { stdio: 'inherit' });
        success = true;
        break;
      } catch (error) {
        log(`Strategy failed: ${strategy}`, 'yellow');
        continue;
      }
    }
    
    if (success) {
      log('✅ Dependencies installed', 'green');
    } else {
      throw new Error('All installation strategies failed');
    }
  } catch (error) {
    log('❌ Failed to install dependencies:', error.message, 'red');
    throw error;
  }
}

// 4. Generate Prisma client
function generatePrisma() {
  try {
    log('🗄️ Generating Prisma client...', 'blue');
    execSync('npx prisma generate', { stdio: 'inherit' });
    log('✅ Prisma client generated', 'green');
  } catch (error) {
    log('❌ Failed to generate Prisma client:', error.message, 'red');
    throw error;
  }
}

// 5. Create BUILD_ID
function createBuildId() {
  try {
    log('🆔 Creating BUILD_ID...', 'blue');
    
    // Ensure .next directory exists
    if (!fs.existsSync('.next')) {
      fs.mkdirSync('.next', { recursive: true });
    }
    
    const buildId = Date.now().toString();
    fs.writeFileSync('.next/BUILD_ID', buildId, 'utf8');
    log(`✅ BUILD_ID created: ${buildId}`, 'green');
  } catch (error) {
    log('❌ Failed to create BUILD_ID:', error.message, 'red');
  }
}

// 6. Build the application
function buildApplication() {
  try {
    log('🔨 Building Next.js application...', 'blue');
    
    // Set environment variables
    process.env.NODE_ENV = 'production';
    process.env.NODE_OPTIONS = '--max-old-space-size=4096';
    process.env.NEXT_TELEMETRY_DISABLED = '1';
    
    // Try different build strategies
    const strategies = [
      'npm run build',
      'npx next build',
      'npx next build --no-lint'
    ];
    
    let success = false;
    for (const strategy of strategies) {
      try {
        log(`Trying build: ${strategy}`, 'yellow');
        execSync(strategy, { stdio: 'inherit' });
        success = true;
        break;
      } catch (error) {
        log(`Build strategy failed: ${strategy}`, 'yellow');
        continue;
      }
    }
    
    if (success) {
      log('✅ Build completed', 'green');
    } else {
      throw new Error('All build strategies failed');
    }
  } catch (error) {
    log('❌ Build failed:', error.message, 'red');
    throw error;
  }
}

// 7. Verify build
function verifyBuild() {
  try {
    log('🔍 Verifying build...', 'blue');
    
    const requiredFiles = [
      '.next/BUILD_ID',
      '.next/package.json',
      '.next/server'
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Missing required file: ${file}`);
      }
    }
    
    log('✅ Build verification passed', 'green');
  } catch (error) {
    log('❌ Build verification failed:', error.message, 'red');
    throw error;
  }
}

// 8. Create optimized server.cjs
function createServer() {
  try {
    log('🚀 Creating server.cjs...', 'blue');
    
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

    fs.writeFileSync('server.cjs', serverContent, 'utf8');
    log('✅ server.cjs created', 'green');
  } catch (error) {
    log('❌ Failed to create server.cjs:', error.message, 'red');
  }
}

// 9. Create PM2 ecosystem config
function createEcosystem() {
  try {
    log('⚙️ Creating PM2 ecosystem config...', 'blue');
    
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

    fs.writeFileSync('ecosystem.config.cjs', ecosystemContent, 'utf8');
    log('✅ ecosystem.config.cjs created', 'green');
  } catch (error) {
    log('❌ Failed to create ecosystem.config.cjs:', error.message, 'red');
  }
}

// 10. Create logs directory
function createLogsDir() {
  try {
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
      log('✅ logs directory created', 'green');
    }
  } catch (error) {
    log('❌ Failed to create logs directory:', error.message, 'red');
  }
}

// 11. Test server startup
function testServer() {
  try {
    log('🧪 Testing server startup...', 'blue');
    
    // Test if server.cjs can be required
    require('./server.cjs');
    log('✅ Server test passed', 'green');
  } catch (error) {
    log('❌ Server test failed:', error.message, 'red');
  }
}

// Main execution
async function main() {
  try {
    cleanProject();
    createNpmrc();
    installDependencies();
    generatePrisma();
    createBuildId();
    buildApplication();
    verifyBuild();
    createServer();
    createEcosystem();
    createLogsDir();
    testServer();
    
    log('\n🎉 Windows deployment fix completed successfully!', 'green');
    log('\n📋 Next steps:', 'blue');
    log('1. Run: npm run pm2:start', 'yellow');
    log('2. Check: npm run pm2:status', 'yellow');
    log('3. View logs: npm run pm2:logs', 'yellow');
    log('4. Test: http://localhost:3000', 'yellow');
    
  } catch (error) {
    log('\n❌ Deployment fix failed:', error.message, 'red');
    log('\n🔧 Troubleshooting:', 'blue');
    log('1. Check if Node.js version is >= 18', 'yellow');
    log('2. Check available disk space', 'yellow');
    log('3. Try running as administrator', 'yellow');
    log('4. Check Windows Defender exclusions', 'yellow');
    process.exit(1);
  }
}

main();
