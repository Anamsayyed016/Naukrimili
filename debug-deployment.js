#!/usr/bin/env node

/**
 * NaukriMili Job Portal - Deployment Troubleshooting Script
 * This script helps identify common deployment issues on Hostinger
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NaukriMili Deployment Diagnostic\n');
console.log('=====================================\n');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printStatus(message, status) {
  const color = status ? colors.green : colors.red;
  const symbol = status ? '✅' : '❌';
  console.log(`${symbol} ${color}${message}${colors.reset}`);
}

function printWarning(message) {
  console.log(`⚠️  ${colors.yellow}${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`ℹ️  ${colors.blue}${message}${colors.reset}`);
}

// Check 1: Required files
console.log('1. 📁 Checking Required Files:');
const requiredFiles = [
  'package.json',
  'server.js',
  '.htaccess',
  'next.config.mjs'
];

const missingFiles = [];
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  printStatus(`${file}`, exists);
  if (!exists) missingFiles.push(file);
});

console.log();

// Check 2: Build output
console.log('2. 🏗️  Checking Build Output:');
const buildPaths = [
  '.next',
  '.next/static',
  '.next/server',
  'public'
];

buildPaths.forEach(buildPath => {
  const exists = fs.existsSync(buildPath);
  printStatus(`${buildPath}/`, exists);
});

console.log();

// Check 3: Package.json scripts
console.log('3. 📝 Checking Package.json Scripts:');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const scripts = packageJson.scripts || {};
  
  const requiredScripts = [
    'hostinger-build',
    'hostinger-start',
    'build',
    'start'
  ];
  
  requiredScripts.forEach(script => {
    const exists = !!scripts[script];
    printStatus(`${script}`, exists);
    if (exists) {
      printInfo(`  Command: ${scripts[script]}`);
    }
  });
} else {
  printStatus('package.json not found', false);
}

console.log();

// Check 4: Environment file
console.log('4. 🔐 Checking Environment Configuration:');
const envFiles = ['.env.local', '.env', '.env.production'];
let envFileFound = false;

envFiles.forEach(envFile => {
  const exists = fs.existsSync(envFile);
  if (exists) {
    envFileFound = true;
    printStatus(`${envFile}`, true);
    
    // Read and analyze env file
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envLines = envContent.split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    );
    
    printInfo(`  Found ${envLines.length} environment variables`);
    
    // Check for critical variables
    const criticalVars = [
      'NODE_ENV',
      'NEXTAUTH_URL', 
      'NEXTAUTH_SECRET',
      'MONGODB_URI'
    ];
    
    criticalVars.forEach(varName => {
      const hasVar = envContent.includes(varName);
      if (hasVar) {
        printStatus(`  ${varName}`, true);
      } else {
        printWarning(`  Missing: ${varName}`);
      }
    });
  }
});

if (!envFileFound) {
  printStatus('No environment file found', false);
  printWarning('Create .env.local file with required variables');
}

console.log();

// Check 5: Dependencies
console.log('5. 📦 Checking Dependencies:');
if (fs.existsSync('node_modules')) {
  printStatus('node_modules/', true);
  
  // Check critical dependencies
  const criticalDeps = [
    'next',
    'react',
    'react-dom',
    '@prisma/client',
    'next-auth'
  ];
  
  criticalDeps.forEach(dep => {
    const depPath = path.join('node_modules', dep);
    const exists = fs.existsSync(depPath);
    printStatus(`  ${dep}`, exists);
  });
} else {
  printStatus('node_modules/', false);
  printWarning('Run: npm install');
}

console.log();

// Check 6: Next.js configuration
console.log('6. ⚙️  Checking Next.js Configuration:');
if (fs.existsSync('next.config.mjs')) {
  printStatus('next.config.mjs', true);
  
  try {
    const configContent = fs.readFileSync('next.config.mjs', 'utf8');
    
    // Check for important configurations
    const importantConfigs = [
      'output:',
      'experimental:',
      'env:',
      'rewrites:'
    ];
    
    importantConfigs.forEach(config => {
      const hasConfig = configContent.includes(config);
      if (hasConfig) {
        printInfo(`  Contains: ${config}`);
      }
    });
    
  } catch (error) {
    printWarning('Could not read next.config.mjs');
  }
} else {
  printWarning('next.config.mjs not found');
}

console.log();

// Check 7: Server configuration
console.log('7. 🖥️  Checking Server Configuration:');
if (fs.existsSync('server.js')) {
  const serverContent = fs.readFileSync('server.js', 'utf8');
  
  const serverChecks = [
    { pattern: 'process.env.PORT', description: 'PORT configuration' },
    { pattern: 'createServer', description: 'HTTP server creation' },
    { pattern: 'next({', description: 'Next.js app initialization' },
    { pattern: '.listen(', description: 'Server listening setup' }
  ];
  
  serverChecks.forEach(check => {
    const hasPattern = serverContent.includes(check.pattern);
    printStatus(`  ${check.description}`, hasPattern);
  });
} else {
  printStatus('server.js', false);
}

console.log();

// Check 8: Static files
console.log('8. 🎨 Checking Static Files:');
if (fs.existsSync('public')) {
  const publicFiles = fs.readdirSync('public');
  printStatus(`public/ (${publicFiles.length} files)`, true);
  
  // Check for important static files
  const importantStatic = ['favicon.ico', 'manifest.json'];
  importantStatic.forEach(file => {
    const exists = publicFiles.includes(file);
    if (exists) {
      printStatus(`  ${file}`, true);
    }
  });
} else {
  printStatus('public/', false);
}

console.log();

// Summary and recommendations
console.log('📋 SUMMARY & RECOMMENDATIONS:');
console.log('===============================\n');

if (missingFiles.length > 0) {
  printWarning(`Missing required files: ${missingFiles.join(', ')}`);
  console.log('   → Create missing files before deployment\n');
}

if (!fs.existsSync('.next')) {
  printWarning('Build output not found');
  console.log('   → Run: npm run hostinger-build\n');
}

if (!envFileFound) {
  printWarning('Environment file missing');
  console.log('   → Create .env.local with required variables\n');
}

if (!fs.existsSync('node_modules')) {
  printWarning('Dependencies not installed');
  console.log('   → Run: npm install\n');
}

console.log('🚀 NEXT STEPS FOR HOSTINGER:');
console.log('1. Ensure all files are uploaded to public_html/');
console.log('2. Configure Node.js in Hostinger control panel');
console.log('3. Set startup file to: server.js');
console.log('4. Create .env.local with production variables');
console.log('5. Test your website at your domain\n');

console.log('🔗 USEFUL HOSTINGER ENDPOINTS TO TEST:');
console.log('• Homepage: https://yourdomain.com');
console.log('• Health check: https://yourdomain.com/api/health');
console.log('• Jobs API: https://yourdomain.com/api/jobs');
console.log('• Debug info: https://yourdomain.com/api/jobs/debug\n');

console.log('📞 If you need help:');
console.log('• Check Hostinger control panel logs');
console.log('• Verify Node.js version (18+ required)');
console.log('• Ensure SSL certificate is enabled');
console.log('• Test individual API endpoints\n');

console.log('✅ Diagnostic completed!');
