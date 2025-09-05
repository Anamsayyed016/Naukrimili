#!/usr/bin/env node

/**
 * SYSTEM STATUS CHECKER
 * Comprehensive check of all system components before deployment
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkSystemStatus() {
  console.log('🔍 COMPREHENSIVE SYSTEM STATUS CHECK');
  console.log('=====================================\n');

  const issues = [];
  const warnings = [];
  const successes = [];

  // 1. Database Connection Check
  console.log('1. 🗄️  Database Connection Check');
  try {
    await prisma.$connect();
    const jobCount = await prisma.job.count();
    const companyCount = await prisma.company.count();
    const categoryCount = await prisma.category.count();
    
    console.log(`   ✅ Database connected successfully`);
    console.log(`   📊 Data counts: ${jobCount} jobs, ${companyCount} companies, ${categoryCount} categories`);
    successes.push('Database connection successful');
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    issues.push(`Database connection failed: ${error.message}`);
  }

  // 2. Environment Variables Check
  console.log('\n2. 🔧 Environment Variables Check');
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const optionalEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'LINKEDIN_CLIENT_ID',
    'LINKEDIN_CLIENT_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
      successes.push(`${envVar} is configured`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      issues.push(`${envVar} is missing`);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
      successes.push(`${envVar} is configured`);
    } else {
      console.log(`   ⚠️  ${envVar}: Not set (optional)`);
      warnings.push(`${envVar} is not configured (optional)`);
    }
  }

  // 3. API Endpoints Check
  console.log('\n3. 🌐 API Endpoints Check');
  const apiEndpoints = [
    '/api/health',
    '/api/jobs',
    '/api/companies',
    '/api/categories',
    '/api/auth/[...nextauth]'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`);
      if (response.ok) {
        console.log(`   ✅ ${endpoint}: Working (${response.status})`);
        successes.push(`${endpoint} is working`);
      } else {
        console.log(`   ⚠️  ${endpoint}: Error (${response.status})`);
        warnings.push(`${endpoint} returned status ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint}: Failed to connect`);
      issues.push(`${endpoint} connection failed`);
    }
  }

  // 4. File Structure Check
  console.log('\n4. 📁 File Structure Check');
  const requiredFiles = [
    'app/page.tsx',
    'app/layout.tsx',
    'app/jobs/page.tsx',
    'app/companies/page.tsx',
    'app/auth/login/page.tsx',
    'app/auth/register/page.tsx',
    'lib/prisma.ts',
    'lib/database.ts',
    'prisma/schema.prisma'
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}: Exists`);
      successes.push(`${file} exists`);
    } else {
      console.log(`   ❌ ${file}: Missing`);
      issues.push(`${file} is missing`);
    }
  }

  // 5. Test/Development Files Check
  console.log('\n5. 🧪 Test/Development Files Check');
  const testFiles = [
    'app/test',
    'app/diagnostic',
    'app/preview',
    'app/simple',
    'app/simple-jobs',
    'app/gmail',
    'app/resume-theme-demo',
    'app/resume-upload-test',
    'app/test-gmail-auth',
    'app/test-oauth'
  ];

  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      console.log(`   ⚠️  ${file}: Still exists (should be removed for production)`);
      warnings.push(`${file} should be removed for production`);
    } else {
      console.log(`   ✅ ${file}: Removed (good for production)`);
      successes.push(`${file} removed for production`);
    }
  }

  // 6. Build Status Check
  console.log('\n6. 🏗️  Build Status Check');
  try {
    const { execSync } = await import('child_process');
    const buildOutput = execSync('npm run build', { encoding: 'utf8', timeout: 120000 });
    if (buildOutput.includes('✓ Ready')) {
      console.log('   ✅ Build successful');
      successes.push('Build process successful');
    } else {
      console.log('   ⚠️  Build completed with warnings');
      warnings.push('Build completed with warnings');
    }
  } catch (error) {
    console.log(`   ❌ Build failed: ${error.message}`);
    issues.push(`Build failed: ${error.message}`);
  }

  // Summary
  console.log('\n📋 SUMMARY');
  console.log('==========');
  console.log(`✅ Successes: ${successes.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Issues: ${issues.length}`);

  if (issues.length === 0) {
    console.log('\n🎉 SYSTEM IS READY FOR PRODUCTION!');
    console.log('All critical issues have been resolved.');
  } else {
    console.log('\n🚨 CRITICAL ISSUES DETECTED:');
    console.log('Please resolve these before deployment:');
    issues.forEach(issue => console.log(`   • ${issue}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (non-critical):');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }

  await prisma.$disconnect();
}

// Run the check
checkSystemStatus()
  .then(() => {
    console.log('\n✅ System check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 System check failed:', error);
    process.exit(1);
  });
































