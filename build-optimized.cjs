#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized build process...');

// Set environment variables for faster builds
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
  if (fs.existsSync('out')) {
    execSync('rm -rf out', { stdio: 'inherit' });
  }

  // Install dependencies with optimizations
  console.log('📦 Installing dependencies...');
  execSync('npm ci --only=production --legacy-peer-deps', { stdio: 'inherit' });

  // Generate Prisma client
  console.log('🗄️ Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Build with optimizations
  console.log('🔨 Building application...');
  execSync('npx next build --no-lint', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });

  console.log('✅ Build completed successfully!');
  console.log('📊 Build size analysis:');
  
  // Show build size
  if (fs.existsSync('.next')) {
    const buildSize = execSync('du -sh .next', { encoding: 'utf8' });
    console.log(`Build size: ${buildSize.trim()}`);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
