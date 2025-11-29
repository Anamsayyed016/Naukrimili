#!/usr/bin/env node

/**
 * Pre-Build Dependency Check
 * Ensures all required dependencies are installed before building
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDependency(packageName, description) {
  const packagePath = path.join(process.cwd(), 'node_modules', packageName);
  if (fs.existsSync(packagePath)) {
    log(`✅ ${description} (${packageName}) is installed`, 'green');
    return true;
  } else {
    log(`❌ ${description} (${packageName}) is missing!`, 'red');
    return false;
  }
}

function main() {
  log('\n🔍 Checking build dependencies...', 'blue');
  
  const criticalDeps = [
    { name: 'next', desc: 'Next.js' },
    { name: 'react', desc: 'React' },
    { name: 'react-dom', desc: 'React DOM' },
    { name: 'tailwindcss', desc: 'Tailwind CSS' },
    { name: 'postcss', desc: 'PostCSS' },
    { name: 'autoprefixer', desc: 'Autoprefixer' },
    { name: 'cross-env', desc: 'Cross-env (for cross-platform builds)' },
    { name: '@prisma/client', desc: 'Prisma Client' },
  ];
  
  let allDepsExist = true;
  for (const dep of criticalDeps) {
    if (!checkDependency(dep.name, dep.desc)) {
      allDepsExist = false;
    }
  }
  
  // Check for .env file (optional but recommended)
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    log('✅ .env file exists', 'green');
  } else {
    log('⚠️ .env file not found (will use environment variables)', 'yellow');
  }
  
  if (!allDepsExist) {
    log('\n❌ Missing critical dependencies!', 'red');
    log('💡 Run: npm install --legacy-peer-deps', 'yellow');
    process.exit(1);
  }
  
  log('\n✅ All critical dependencies are installed!', 'green');
  process.exit(0);
}

main();

