#!/usr/bin/env node

/**
 * Quick Database Connection Test
 * Run: node scripts/check-database.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('Test 1: Basic connectivity...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Basic connection successful\n');
    
    // Test 2: Count users
    console.log('Test 2: Query test (counting users)...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users\n`);
    
    // Test 3: Count jobs
    console.log('Test 3: Query test (counting jobs)...');
    const jobCount = await prisma.job.count();
    console.log(`✅ Found ${jobCount} jobs\n`);
    
    // Test 4: Check database info
    console.log('Test 4: Database version...');
    const versionResult = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database version:', versionResult[0].version.split(',')[0], '\n');
    
    console.log('🎉 All database tests passed!\n');
    console.log('Your database is working correctly.');
    
  } catch (error) {
    console.error('❌ Database test failed!\n');
    console.error('Error:', error.message);
    console.error('\nPossible causes:');
    console.error('1. DATABASE_URL is incorrect');
    console.error('2. PostgreSQL service is not running');
    console.error('3. Network/firewall blocking connection');
    console.error('4. Database credentials are wrong');
    console.error('5. Database does not exist\n');
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

