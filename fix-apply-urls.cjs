const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixApplyUrls() {
  try {
    console.log('🔧 Fixing Apply URL issues...');
    
    // Fix jobs that have applyUrl but no source_url
    const jobsToFix = await prisma.job.findMany({
      where: {
        source: { not: 'manual' },
        applyUrl: { not: null },
        source_url: null
      }
    });
    
    console.log(`📊 Found ${jobsToFix.length} jobs to fix (applyUrl -> source_url)`);
    
    for (const job of jobsToFix) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          source_url: job.applyUrl
        }
      });
      console.log(`✅ Fixed job ${job.id}: ${job.title}`);
    }
    
    // Fix jobs that are external but marked as manual
    const manualJobsToFix = await prisma.job.findMany({
      where: {
        source: 'manual',
        OR: [
          { source_url: { not: null } },
          { applyUrl: { not: null } }
        ]
      }
    });
    
    console.log(`📊 Found ${manualJobsToFix.length} manual jobs that should be external`);
    
    for (const job of manualJobsToFix) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          source: 'external',
          source_url: job.source_url || job.applyUrl
        }
      });
      console.log(`✅ Fixed manual job ${job.id}: ${job.title}`);
    }
    
    // Fix jobs that have redirect_url but no source_url
    const redirectJobsToFix = await prisma.job.findMany({
      where: {
        redirect_url: { not: null },
        source_url: null
      }
    });
    
    console.log(`📊 Found ${redirectJobsToFix.length} jobs with redirect_url to fix`);
    
    for (const job of redirectJobsToFix) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          source_url: job.redirect_url
        }
      });
      console.log(`✅ Fixed redirect job ${job.id}: ${job.title}`);
    }
    
    // Summary
    const totalFixed = jobsToFix.length + manualJobsToFix.length + redirectJobsToFix.length;
    console.log(`\n✅ Apply URL fixes completed! Total jobs fixed: ${totalFixed}`);
    
    // Show sample of fixed jobs
    const sampleFixedJobs = await prisma.job.findMany({
      where: {
        source_url: { not: null }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        source: true,
        source_url: true,
        applyUrl: true
      }
    });
    
    console.log('\n📋 Sample of jobs with source_url:');
    console.log(JSON.stringify(sampleFixedJobs, null, 2));
    
  } catch (error) {
    console.error('❌ Error fixing apply URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApplyUrls();
