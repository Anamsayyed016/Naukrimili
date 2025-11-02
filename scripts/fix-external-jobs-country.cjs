#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExternalJobs() {
  console.log('🔧 Fixing external jobs with missing country field...\n');
  
  try {
    // Get all jobs and filter those with empty country
    const allJobs = await prisma.job.findMany({
      select: {
        id: true,
        sourceId: true,
        title: true,
        company: true,
        location: true,
        country: true,
        source: true
      }
    });
    
    const jobsToFix = allJobs.filter(job => !job.country || job.country === '');
    
    console.log(`Found ${jobsToFix.length} jobs with missing country\n`);
    
    if (jobsToFix.length === 0) {
      console.log('✅ All jobs have country set!');
      return;
    }
    
    let updated = 0;
    for (const job of jobsToFix) {
      let country = 'IN';
      
      const location = (job.location || '').toLowerCase();
      if (location.includes('usa') || location.includes('united states') || location.includes('us')) {
        country = 'US';
      } else if (location.includes('uk') || location.includes('united kingdom') || location.includes('london')) {
        country = 'GB';
      } else if (location.includes('uae') || location.includes('dubai') || location.includes('abu dhabi')) {
        country = 'AE';
      } else if (location.includes('india') || location.includes('bangalore') || location.includes('mumbai') || location.includes('delhi')) {
        country = 'IN';
      }
      
      await prisma.job.update({
        where: { id: job.id },
        data: { country }
      });
      
      updated++;
      console.log(`✓ Updated job ${job.id} (${job.title}) - country set to ${country}`);
    }
    
    console.log(`\n✅ Updated ${updated} jobs with country field`);
    console.log('🎉 Fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing jobs:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixExternalJobs();
