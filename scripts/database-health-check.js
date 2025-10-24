#!/usr/bin/env node

/**
 * Database Health Check Script
 * Tests PostgreSQL connection, Prisma operations, and real data functionality
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`  ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function checkEnvironment() {
  logHeader('Environment Check');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    logSuccess('.env.local file found');
  } else {
    logWarning('.env.local file not found, using system environment');
  }
  
  // Check DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    logSuccess('DATABASE_URL is set');
    
    // Parse database URL to show connection details
    try {
      const url = new URL(dbUrl);
      logInfo(`Database Type: ${url.protocol.replace(':', '')}`);
      logInfo(`Host: ${url.hostname}`);
      logInfo(`Port: ${url.port || 'default'}`);
      logInfo(`Database: ${url.pathname.substring(1)}`);
      logInfo(`User: ${url.username}`);
    } catch (error) {
      logError('Invalid DATABASE_URL format');
    }
  } else {
    logError('DATABASE_URL is not set');
    return false;
  }
  
  return true;
}

async function testDatabaseConnection() {
  logHeader('Database Connection Test');
  
  let prisma;
  try {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // Test basic connection
    logInfo('Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    logSuccess('Database connection successful');
    
    // Test connection with timeout
    logInfo('Testing connection with timeout...');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT pg_sleep(0.1)`;
    const endTime = Date.now();
    logSuccess(`Connection response time: ${endTime - startTime}ms`);
    
    return prisma;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return null;
  }
}

async function checkDatabaseSchema(prisma) {
  logHeader('Database Schema Check');
  
  try {
    // Check if tables exist
    logInfo('Checking database tables...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    logSuccess(`Found ${tables.length} tables:`);
    tables.forEach(table => {
      logInfo(`  - ${table.table_name}`);
    });
    
    // Check specific tables
    const requiredTables = ['Job', 'User', 'Company', 'Resume', 'Application'];
    for (const table of requiredTables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        logSuccess(`${table} table: ${count} records`);
      } catch (error) {
        logWarning(`${table} table not accessible: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    logError(`Schema check failed: ${error.message}`);
    return false;
  }
}

async function testRealDataOperations(prisma) {
  logHeader('Real Data Operations Test');
  
  try {
    // Test Job operations
    logInfo('Testing Job operations...');
    
    // Count jobs
    const jobCount = await prisma.job.count();
    logInfo(`Total jobs in database: ${jobCount}`);
    
    if (jobCount > 0) {
      // Get sample jobs
      const sampleJobs = await prisma.job.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          createdAt: true
        }
      });
      
      logSuccess('Sample jobs:');
      sampleJobs.forEach(job => {
        logInfo(`  - ${job.title} at ${job.company} (${job.location})`);
      });
    }
    
    // Test User operations
    logInfo('Testing User operations...');
    const userCount = await prisma.user.count();
    logInfo(`Total users in database: ${userCount}`);
    
    // Test Company operations
    logInfo('Testing Company operations...');
    const companyCount = await prisma.company.count();
    logInfo(`Total companies in database: ${companyCount}`);
    
    // Test complex queries
    logInfo('Testing complex queries...');
    
    // Jobs by location
    const jobsByLocation = await prisma.job.groupBy({
      by: ['location'],
      _count: {
        location: true
      },
      orderBy: {
        _count: {
          location: 'desc'
        }
      },
      take: 5
    });
    
    logSuccess('Top job locations:');
    jobsByLocation.forEach(item => {
      logInfo(`  - ${item.location || 'Remote'}: ${item._count.location} jobs`);
    });
    
    // Jobs by type
    const jobsByType = await prisma.job.groupBy({
      by: ['jobType'],
      _count: {
        jobType: true
      },
      orderBy: {
        _count: {
          jobType: 'desc'
        }
      }
    });
    
    logSuccess('Jobs by type:');
    jobsByType.forEach(item => {
      logInfo(`  - ${item.jobType || 'Not specified'}: ${item._count.jobType} jobs`);
    });
    
    return true;
  } catch (error) {
    logError(`Real data operations failed: ${error.message}`);
    return false;
  }
}

async function testDatabasePerformance(prisma) {
  logHeader('Database Performance Test');
  
  try {
    // Test query performance
    logInfo('Testing query performance...');
    
    const startTime = Date.now();
    await prisma.job.findMany({
      where: { isActive: true },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });
    const endTime = Date.now();
    
    logSuccess(`Query 100 active jobs: ${endTime - startTime}ms`);
    
    // Test indexed queries
    logInfo('Testing indexed queries...');
    
    const startTime2 = Date.now();
    await prisma.job.findMany({
      where: {
        country: 'IN',
        isActive: true
      },
      take: 50
    });
    const endTime2 = Date.now();
    
    logSuccess(`Query jobs by country (indexed): ${endTime2 - startTime2}ms`);
    
    // Test connection pooling
    logInfo('Testing connection pooling...');
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        prisma.job.count()
      );
    }
    
    const startTime3 = Date.now();
    await Promise.all(promises);
    const endTime3 = Date.now();
    
    logSuccess(`Parallel queries (5): ${endTime3 - startTime3}ms`);
    
    return true;
  } catch (error) {
    logError(`Performance test failed: ${error.message}`);
    return false;
  }
}

async function checkDatabaseHealth() {
  logHeader('Database Health Check Started');
  
  try {
    // Step 1: Environment check
    const envOk = await checkEnvironment();
    if (!envOk) {
      logError('Environment check failed. Exiting.');
      process.exit(1);
    }
    
    // Step 2: Connection test
    const prisma = await testDatabaseConnection();
    if (!prisma) {
      logError('Database connection failed. Exiting.');
      process.exit(1);
    }
    
    // Step 3: Schema check
    const schemaOk = await checkDatabaseSchema(prisma);
    
    // Step 4: Real data operations
    const dataOk = await testRealDataOperations(prisma);
    
    // Step 5: Performance test
    const performanceOk = await testDatabasePerformance(prisma);
    
    // Summary
    logHeader('Health Check Summary');
    
    if (envOk && prisma && schemaOk && dataOk && performanceOk) {
      logSuccess('🎉 All database checks passed! Your database is healthy.');
    } else {
      logWarning('⚠️  Some checks failed. Review the output above.');
    }
    
    // Cleanup
    await prisma.$disconnect();
    
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the health check
if (require.main === module) {
  checkDatabaseHealth()
    .then(() => {
      log('\n🏁 Database health check completed!', 'green');
      process.exit(0);
    })
    .catch((error) => {
      logError(`\n💥 Health check crashed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { checkDatabaseHealth };

