#!/usr/bin/env node

/**
 * Database Integrity Check Script
 * This script checks for data integrity issues, duplicates, and conflicts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserIntegrity() {
  console.log('🔍 Checking User table integrity...');
  
  try {
    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count
      FROM "User"
      GROUP BY email
      HAVING COUNT(*) > 1;
    `;
    
    if (duplicateEmails.length > 0) {
      console.log('❌ Found duplicate emails:');
      duplicateEmails.forEach(dup => {
        console.log(`  - ${dup.email}: ${dup.count} occurrences`);
      });
    } else {
      console.log('✅ No duplicate emails found');
    }
    
    // Check for users without required fields
    const invalidUsers = await prisma.$queryRaw`
      SELECT id, email, name, role
      FROM "User"
      WHERE email IS NULL OR name IS NULL OR role IS NULL;
    `;
    
    if (invalidUsers.length > 0) {
      console.log('⚠️  Found users with missing required fields:');
      invalidUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
      });
    } else {
      console.log('✅ All users have required fields');
    }
    
  } catch (error) {
    console.error('❌ Error checking user integrity:', error.message);
  }
}

async function checkCompanyIntegrity() {
  console.log('\n🏢 Checking Company table integrity...');
  
  try {
    // Check for companies without creators
    const orphanedCompanies = await prisma.$queryRaw`
      SELECT c.id, c.name, c."createdBy"
      FROM "Company" c
      LEFT JOIN "User" u ON c."createdBy" = u.id
      WHERE u.id IS NULL;
    `;
    
    if (orphanedCompanies.length > 0) {
      console.log('❌ Found companies without valid creators:');
      orphanedCompanies.forEach(company => {
        console.log(`  - ID: ${company.id}, Name: ${company.name}, Creator: ${company.createdBy}`);
      });
    } else {
      console.log('✅ All companies have valid creators');
    }
    
    // Check for duplicate company names
    const duplicateNames = await prisma.$queryRaw`
      SELECT name, COUNT(*) as count
      FROM "Company"
      GROUP BY name
      HAVING COUNT(*) > 1;
    `;
    
    if (duplicateNames.length > 0) {
      console.log('⚠️  Found companies with duplicate names:');
      duplicateNames.forEach(dup => {
        console.log(`  - ${dup.name}: ${dup.count} occurrences`);
      });
    } else {
      console.log('✅ No duplicate company names found');
    }
    
  } catch (error) {
    console.error('❌ Error checking company integrity:', error.message);
  }
}

async function checkJobIntegrity() {
  console.log('\n💼 Checking Job table integrity...');
  
  try {
    // Check for jobs without companies
    const orphanedJobs = await prisma.$queryRaw`
      SELECT j.id, j.title, j."companyId"
      FROM "Job" j
      LEFT JOIN "Company" c ON j."companyId" = c.id
      WHERE c.id IS NULL AND j."companyId" IS NOT NULL;
    `;
    
    if (orphanedJobs.length > 0) {
      console.log('❌ Found jobs without valid companies:');
      orphanedJobs.forEach(job => {
        console.log(`  - ID: ${job.id}, Title: ${job.title}, Company ID: ${job.companyId}`);
      });
    } else {
      console.log('✅ All jobs have valid companies');
    }
    
    // Check for jobs without creators
    const jobsWithoutCreators = await prisma.$queryRaw`
      SELECT j.id, j.title, j."createdBy"
      FROM "Job" j
      LEFT JOIN "User" u ON j."createdBy" = u.id
      WHERE u.id IS NULL AND j."createdBy" IS NOT NULL;
    `;
    
    if (jobsWithoutCreators.length > 0) {
      console.log('❌ Found jobs without valid creators:');
      jobsWithoutCreators.forEach(job => {
        console.log(`  - ID: ${job.id}, Title: ${job.title}, Creator: ${job.createdBy}`);
      });
    } else {
      console.log('✅ All jobs have valid creators');
    }
    
    // Check for duplicate source jobs
    const duplicateSources = await prisma.$queryRaw`
      SELECT source, "sourceId", COUNT(*) as count
      FROM "Job"
      GROUP BY source, "sourceId"
      HAVING COUNT(*) > 1;
    `;
    
    if (duplicateSources.length > 0) {
      console.log('⚠️  Found duplicate source jobs:');
      duplicateSources.forEach(dup => {
        console.log(`  - Source: ${dup.source}, SourceID: ${dup.sourceId}, Count: ${dup.count}`);
      });
    } else {
      console.log('✅ No duplicate source jobs found');
    }
    
  } catch (error) {
    console.error('❌ Error checking job integrity:', error.message);
  }
}

async function checkApplicationIntegrity() {
  console.log('\n📝 Checking Application table integrity...');
  
  try {
    // Check for applications without valid users
    const orphanedApplications = await prisma.$queryRaw`
      SELECT a.id, a."userId", a."jobId"
      FROM "Application" a
      LEFT JOIN "User" u ON a."userId" = u.id
      WHERE u.id IS NULL;
    `;
    
    if (orphanedApplications.length > 0) {
      console.log('❌ Found applications without valid users:');
      orphanedApplications.forEach(app => {
        console.log(`  - ID: ${app.id}, User ID: ${app.userId}, Job ID: ${app.jobId}`);
      });
    } else {
      console.log('✅ All applications have valid users');
    }
    
    // Check for applications without valid jobs
    const applicationsWithoutJobs = await prisma.$queryRaw`
      SELECT a.id, a."userId", a."jobId"
      FROM "Application" a
      LEFT JOIN "Job" j ON a."jobId" = j.id
      WHERE j.id IS NULL;
    `;
    
    if (applicationsWithoutJobs.length > 0) {
      console.log('❌ Found applications without valid jobs:');
      applicationsWithoutJobs.forEach(app => {
        console.log(`  - ID: ${app.id}, User ID: ${app.userId}, Job ID: ${app.jobId}`);
      });
    } else {
      console.log('✅ All applications have valid jobs');
    }
    
    // Check for duplicate applications
    const duplicateApplications = await prisma.$queryRaw`
      SELECT "userId", "jobId", COUNT(*) as count
      FROM "Application"
      GROUP BY "userId", "jobId"
      HAVING COUNT(*) > 1;
    `;
    
    if (duplicateApplications.length > 0) {
      console.log('❌ Found duplicate applications:');
      duplicateApplications.forEach(dup => {
        console.log(`  - User ID: ${dup.userId}, Job ID: ${dup.jobId}, Count: ${dup.count}`);
      });
    } else {
      console.log('✅ No duplicate applications found');
    }
    
  } catch (error) {
    console.error('❌ Error checking application integrity:', error.message);
  }
}

async function checkForeignKeyConstraints() {
  console.log('\n🔗 Checking foreign key constraints...');
  
  try {
    // Check all foreign key relationships
    const constraints = [
      { table: 'Account', column: 'userId', refTable: 'User', refColumn: 'id' },
      { table: 'Session', column: 'userId', refTable: 'User', refColumn: 'id' },
      { table: 'Company', column: 'createdBy', refTable: 'User', refColumn: 'id' },
      { table: 'Job', column: 'createdBy', refTable: 'User', refColumn: 'id' },
      { table: 'Job', column: 'companyId', refTable: 'Company', refColumn: 'id' },
      { table: 'Application', column: 'userId', refTable: 'User', refColumn: 'id' },
      { table: 'Application', column: 'jobId', refTable: 'Job', refColumn: 'id' },
      { table: 'Application', column: 'companyId', refTable: 'Company', refColumn: 'id' },
      { table: 'Resume', column: 'userId', refTable: 'User', refColumn: 'id' },
      { table: 'JobBookmark', column: 'userId', refTable: 'User', refColumn: 'id' },
      { table: 'JobBookmark', column: 'jobId', refTable: 'Job', refColumn: 'id' }
    ];
    
    let allConstraintsValid = true;
    
    for (const constraint of constraints) {
      try {
        const result = await prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM "${constraint.table}" t
          LEFT JOIN "${constraint.refTable}" r ON t."${constraint.column}" = r."${constraint.refColumn}"
          WHERE r."${constraint.refColumn}" IS NULL AND t."${constraint.column}" IS NOT NULL;
        `;
        
        const count = result[0].count;
        if (count > 0) {
          console.log(`❌ ${constraint.table}.${constraint.column} has ${count} invalid references to ${constraint.refTable}.${constraint.refColumn}`);
          allConstraintsValid = false;
        } else {
          console.log(`✅ ${constraint.table}.${constraint.column} -> ${constraint.refTable}.${constraint.refColumn} is valid`);
        }
      } catch (error) {
        console.log(`⚠️  Could not check ${constraint.table}.${constraint.column} constraint: ${error.message}`);
      }
    }
    
    if (allConstraintsValid) {
      console.log('✅ All foreign key constraints are valid');
    }
    
  } catch (error) {
    console.error('❌ Error checking foreign key constraints:', error.message);
  }
}

async function generateReport() {
  console.log('\n📊 Generating database integrity report...');
  
  try {
    // Get table counts
    const tables = ['User', 'Company', 'Job', 'Application', 'Resume', 'JobBookmark'];
    const counts = {};
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "${table}"`;
        counts[table] = result[0].count;
      } catch (error) {
        counts[table] = 'Error';
      }
    }
    
    console.log('\n📈 Table Record Counts:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  - ${table}: ${count} records`);
    });
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
  }
}

async function main() {
  console.log('🔍 Job Portal Database Integrity Check\n');
  console.log('This script will check for data integrity issues, duplicates, and conflicts.\n');
  
  try {
    await checkUserIntegrity();
    await checkCompanyIntegrity();
    await checkJobIntegrity();
    await checkApplicationIntegrity();
    await checkForeignKeyConstraints();
    await generateReport();
    
    console.log('\n✅ Database integrity check completed!');
    
  } catch (error) {
    console.error('❌ Fatal error during integrity check:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
