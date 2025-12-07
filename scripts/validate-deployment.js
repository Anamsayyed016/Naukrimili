#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates database connection and environment before deployment
 */

const { PrismaClient } = require('@prisma/client');

async function validateDeployment() {
  console.log('🔍 Validating deployment configuration...\n');
  
  const errors = [];
  const warnings = [];
  
  // 1. Check DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    errors.push('❌ DATABASE_URL is not set');
  } else {
    console.log('✅ DATABASE_URL is set');
    
    // Check for connection pooling parameters
    if (!dbUrl.includes('connection_limit')) {
      warnings.push('⚠️  DATABASE_URL missing connection_limit parameter');
      console.log('   💡 Add: ?connection_limit=10&pool_timeout=20&connect_timeout=10');
    } else {
      console.log('✅ Connection pooling configured');
    }
    
    // Test database connection
    try {
      const prisma = new PrismaClient({
        datasources: {
          db: { url: dbUrl }
        }
      });
      
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test a simple query
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database query test passed');
      
      await prisma.$disconnect();
    } catch (error) {
      errors.push(`❌ Database connection failed: ${error.message}`);
      console.error('   Error:', error.message);
    }
  }
  
  // 2. Check NEXTAUTH_SECRET
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('❌ NEXTAUTH_SECRET is not set');
  } else {
    console.log('✅ NEXTAUTH_SECRET is set');
  }
  
  // 3. Check NEXTAUTH_URL
  if (!process.env.NEXTAUTH_URL) {
    warnings.push('⚠️  NEXTAUTH_URL not set, using default');
  } else {
    console.log(`✅ NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  }
  
  // 4. Check required directories
  const fs = require('fs');
  const path = require('path');
  
  const requiredDirs = ['.next', 'prisma', 'public'];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(path.join(process.cwd(), dir))) {
      warnings.push(`⚠️  ${dir} directory not found`);
    } else {
      console.log(`✅ ${dir} directory exists`);
    }
  }
  
  // 5. Check server.cjs
  if (!fs.existsSync(path.join(process.cwd(), 'server.cjs'))) {
    errors.push('❌ server.cjs not found');
  } else {
    console.log('✅ server.cjs exists');
  }
  
  // 6. Check ecosystem.config.cjs
  if (!fs.existsSync(path.join(process.cwd(), 'ecosystem.config.cjs'))) {
    errors.push('❌ ecosystem.config.cjs not found');
  } else {
    console.log('✅ ecosystem.config.cjs exists');
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Validation Summary');
  console.log('='.repeat(50));
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(w => console.log(`   ${w}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(e => console.log(`   ${e}`));
    console.log('\n❌ Deployment validation failed!');
    process.exit(1);
  }
  
  if (warnings.length === 0 && errors.length === 0) {
    console.log('\n✅ All checks passed! Deployment is ready.');
  } else if (errors.length === 0) {
    console.log('\n⚠️  Deployment ready with warnings (non-critical).');
  }
  
  process.exit(0);
}

// Run validation
validateDeployment().catch((error) => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});

