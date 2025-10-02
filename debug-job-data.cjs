const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugJobData() {
  try {
    console.log('🔍 Debugging job data...');
    
    // Get a sample of jobs to check their structure
    const jobs = await prisma.job.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        company: true,
        source: true,
        sourceId: true,
        source_url: true,
        apply_url: true,
        applyUrl: true,
        redirect_url: true,
        location: true,
        description: true
      }
    });
    
    console.log('📊 Sample jobs data:');
    console.log(JSON.stringify(jobs, null, 2));
    
    // Check for jobs with missing source_url
    const jobsWithoutSourceUrl = await prisma.job.count({
      where: {
        source: { not: 'manual' },
        source_url: null
      }
    });
    
    console.log(`\n⚠️  Jobs without source_url: ${jobsWithoutSourceUrl}`);
    
    // Check for external jobs
    const externalJobs = await prisma.job.findMany({
      where: {
        source: { not: 'manual' }
      },
      take: 3,
      select: {
        id: true,
        title: true,
        source: true,
        source_url: true,
        applyUrl: true,
        redirect_url: true
      }
    });
    
    console.log('\n🌐 External jobs:');
    console.log(JSON.stringify(externalJobs, null, 2));
    
    // Check for jobs with applyUrl but no source_url
    const jobsWithApplyUrl = await prisma.job.findMany({
      where: {
        source: { not: 'manual' },
        applyUrl: { not: null },
        source_url: null
      },
      take: 3,
      select: {
        id: true,
        title: true,
        source: true,
        applyUrl: true,
        source_url: true
      }
    });
    
    console.log('\n🔗 Jobs with applyUrl but no source_url:');
    console.log(JSON.stringify(jobsWithApplyUrl, null, 2));
    
    // Check for jobs with redirect_url but no source_url
    const jobsWithRedirectUrl = await prisma.job.findMany({
      where: {
        redirect_url: { not: null },
        source_url: null
      },
      take: 3,
      select: {
        id: true,
        title: true,
        source: true,
        redirect_url: true,
        source_url: true
      }
    });
    
    console.log('\n🔄 Jobs with redirect_url but no source_url:');
    console.log(JSON.stringify(jobsWithRedirectUrl, null, 2));
    
    // Count jobs by source
    const jobsBySource = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      }
    });
    
    console.log('\n📊 Jobs by source:');
    console.log(JSON.stringify(jobsBySource, null, 2));
    
  } catch (error) {
    console.error('❌ Error debugging job data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugJobData();
