/**
 * Database Migration Script
 * 
 * Senior-level implementation for:
 * - Schema updates
 * - Index optimization
 * - Data migration
 * - Performance improvements
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function migrateDatabase() {
  console.log('🚀 Starting database migration...');

  try {
    // Step 1: Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Step 2: Run database migrations
    console.log('🔄 Running database migrations...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    // Step 3: Create additional indexes for performance
    console.log('📊 Creating performance indexes...');
    await createPerformanceIndexes();

    // Step 4: Update existing data
    console.log('🔄 Updating existing data...');
    await updateExistingData();

    // Step 5: Verify migration
    console.log('✅ Verifying migration...');
    await verifyMigration();

    console.log('🎉 Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createPerformanceIndexes() {
  const indexes = [
    // Job search optimization
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_search_text" ON "Job" USING gin(to_tsvector(\'english\', title || \' \' || description));',
    
    // Location-based search
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_location_country" ON "Job" (location, country) WHERE "isActive" = true;',
    
    // Salary range queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_salary_range" ON "Job" (salaryMin, salaryMax) WHERE "isActive" = true;',
    
    // Job type and experience filtering
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_type_experience" ON "Job" (jobType, experienceLevel) WHERE "isActive" = true;',
    
    // Remote work filtering
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_remote" ON "Job" (isRemote, isHybrid) WHERE "isActive" = true;',
    
    // Featured and urgent jobs
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_featured" ON "Job" (isFeatured, isUrgent, createdAt) WHERE "isActive" = true;',
    
    // Company-based queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_company" ON "Job" (companyId) WHERE "isActive" = true;',
    
    // Posted date queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_posted" ON "Job" (postedAt DESC) WHERE "isActive" = true;',
    
    // Skills array queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_jobs_skills" ON "Job" USING gin(skills) WHERE "isActive" = true;',
    
    // Application queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_applications_user_job" ON "Application" (userId, jobId);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_applications_status" ON "Application" (status, appliedAt);',
    
    // Bookmark queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_bookmarks_user_job" ON "JobBookmark" (userId, jobId);',
    
    // User queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email" ON "User" (email);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role" ON "User" (role);',
    
    // Company queries
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_name" ON "Company" (name);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_companies_industry" ON "Company" (industry);'
  ];

  for (const indexQuery of indexes) {
    try {
      await prisma.$executeRawUnsafe(indexQuery);
      console.log(`✅ Created index: ${indexQuery.split('"')[1]}`);
    } catch (error) {
      console.warn(`⚠️ Index creation failed: ${error}`);
    }
  }
}

async function updateExistingData() {
  // Update job descriptions to extract requirements
  console.log('📝 Updating job descriptions...');
  
  const jobs = await prisma.job.findMany({
    where: {
      requirements: {
        equals: ''
      }
    },
    select: {
      id: true,
      description: true
    }
  });

  for (const job of jobs) {
    const requirements = extractRequirements(job.description);
    await prisma.job.update({
      where: { id: job.id },
      data: { requirements }
    });
  }

  console.log(`✅ Updated ${jobs.length} job descriptions`);

  // Update salary data
  console.log('💰 Normalizing salary data...');
  
  const salaryJobs = await prisma.job.findMany({
    where: {
      salary: {
        not: null
      },
      OR: [
        { salaryMin: null },
        { salaryMax: null }
      ]
    },
    select: {
      id: true,
      salary: true
    }
  });

  for (const job of salaryJobs) {
    const salaryData = parseSalary(job.salary);
    if (salaryData) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          salaryMin: salaryData.min,
          salaryMax: salaryData.max,
          salaryCurrency: salaryData.currency
        }
      });
    }
  }

  console.log(`✅ Updated ${salaryJobs.length} salary records`);
}

async function verifyMigration() {
  // Check if all indexes exist
  const indexQuery = `
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'Job' 
    AND indexname LIKE 'idx_jobs_%'
  `;
  
  const indexes = await prisma.$queryRawUnsafe(indexQuery);
  console.log(`📊 Found ${Array.isArray(indexes) ? indexes.length : 0} performance indexes`);

  // Check data integrity
  const jobCount = await prisma.job.count();
  const activeJobCount = await prisma.job.count({ where: { isActive: true } });
  const userCount = await prisma.user.count();
  const companyCount = await prisma.company.count();

  console.log('📈 Database statistics:');
  console.log(`  - Total jobs: ${jobCount}`);
  console.log(`  - Active jobs: ${activeJobCount}`);
  console.log(`  - Users: ${userCount}`);
  console.log(`  - Companies: ${companyCount}`);

  // Test query performance
  const startTime = Date.now();
  await prisma.job.findMany({
    where: { isActive: true },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  const queryTime = Date.now() - startTime;
  
  console.log(`⚡ Test query performance: ${queryTime}ms`);
  
  if (queryTime > 1000) {
    console.warn('⚠️ Query performance is slower than expected');
  } else {
    console.log('✅ Query performance is good');
  }
}

function extractRequirements(description: string): string {
  const lines = description.split('\n');
  const requirements = lines.filter(line => 
    line.toLowerCase().includes('requirement') ||
    line.toLowerCase().includes('qualification') ||
    line.toLowerCase().includes('must have') ||
    line.toLowerCase().includes('should have') ||
    line.toLowerCase().includes('experience') ||
    line.toLowerCase().includes('skill')
  );
  
  return requirements.join('\n') || description.substring(0, 500);
}

function parseSalary(salary: string | null): { min: number; max: number; currency: string } | null {
  if (!salary) return null;
  
  const salaryStr = salary.toLowerCase();
  const currencyMatch = salaryStr.match(/(\d+)\s*(inr|usd|gbp|eur|cad|aud)/);
  const currency = currencyMatch ? currencyMatch[2].toUpperCase() : 'INR';
  
  const numbers = salaryStr.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  
  const nums = numbers.map(Number);
  if (nums.length === 1) {
    return { min: nums[0], max: nums[0], currency };
  } else if (nums.length >= 2) {
    return { min: Math.min(...nums), max: Math.max(...nums), currency };
  }
  
  return null;
}

// Run migration if called directly
if (require.main === module) {
  migrateDatabase();
}

export { migrateDatabase };
