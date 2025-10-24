/**
 * Test Automation System
 * Simple script to test the automation system functionality
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAutomation() {
  try {
    console.log('🧪 Testing Job Automation System...');
    
    // Test 1: Check database connection
    console.log('\n1️⃣ Testing database connection...');
    const jobCount = await prisma.job.count();
    console.log(`✅ Database connected. Total jobs: ${jobCount}`);
    
    // Test 2: Check job sources
    console.log('\n2️⃣ Checking job sources...');
    const sources = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });
    
    console.log('📊 Job sources:');
    sources.forEach(source => {
      console.log(`   - ${source.source}: ${source._count.id} jobs`);
    });
    
    // Test 3: Check recent jobs
    console.log('\n3️⃣ Checking recent jobs...');
    const recentJobs = await prisma.job.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        company: true,
        source: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log('📋 Recent jobs:');
    recentJobs.forEach(job => {
      console.log(`   - ${job.title} at ${job.company} (${job.source}) - ${job.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Test 4: Check automation readiness
    console.log('\n4️⃣ Checking automation readiness...');
    const activeJobs = await prisma.job.count({ where: { isActive: true } });
    const externalJobs = await prisma.job.count({ where: { source: { not: 'manual' } } });
    const employerJobs = await prisma.job.count({ where: { source: 'manual', companyId: { not: null } } });
    
    console.log('✅ Automation system ready:');
    console.log(`   - Active jobs: ${activeJobs}`);
    console.log(`   - External jobs: ${externalJobs}`);
    console.log(`   - Employer jobs: ${employerJobs}`);
    
    console.log('\n🎉 Automation system test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start the automation system via API: POST /api/automation/start');
    console.log('   2. Or use the admin dashboard: /dashboard/admin/automation');
    console.log('   3. Monitor the system via: GET /api/automation/status');
    
  } catch (error) {
    console.error('❌ Automation system test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAutomation();

