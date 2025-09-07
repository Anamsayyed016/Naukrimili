#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying Database Integrity...\n');

  try {
    // 1. Check total job count
    const totalJobs = await prisma.job.count();
    console.log(`📊 Total Jobs in Database: ${totalJobs}`);

    // 2. Check jobs by country
    const jobsByCountry = await prisma.job.groupBy({
      by: ['country'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    console.log('\n🌍 Jobs by Country:');
    jobsByCountry.forEach(group => {
      console.log(`  ${group.country}: ${group._count.id} jobs`);
    });

    // 3. Check jobs by source
    const jobsBySource = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      }
    });

    console.log('\n📡 Jobs by Source:');
    jobsBySource.forEach(group => {
      console.log(`  ${group.source}: ${group._count.id} jobs`);
    });

    // 4. Check recent jobs (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentJobs = await prisma.job.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });

    console.log(`\n⏰ Recent Jobs (last 24h): ${recentJobs}`);

    // 5. Sample job data verification
    console.log('\n📋 Sample Job Data:');
    const sampleJobs = await prisma.job.findMany({
      take: 3,
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        country: true,
        source: true,
        sourceId: true,
        postedAt: true,
        createdAt: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        requirements: true,
        skills: true,
        isRemote: true,
        source: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sampleJobs.forEach((job, index) => {
      console.log(`\n  Job ${index + 1}:`);
      console.log(`    Title: ${job.title}`);
      console.log(`    Company: ${job.company}`);
      console.log(`    Location: ${job.location}, ${job.country}`);
      console.log(`    Source: ${job.source} (ID: ${job.sourceId})`);
      console.log(`    Posted: ${job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'N/A'}`);
      console.log(`    Created: ${new Date(job.createdAt).toLocaleDateString()}`);
      console.log(`    Salary: ${job.salaryMin ? `${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}` : 'Not specified'}`);
      console.log(`    Remote: ${job.isRemote ? 'Yes' : 'No'}`);
      console.log(`    External: ${job.isExternal ? 'Yes' : 'No'}`);
      console.log(`    Requirements: ${job.requirements ? job.requirements.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`    Skills: ${job.skills || 'N/A'}`);
    });

    // 6. Check for data integrity issues
    console.log('\n🔧 Data Integrity Checks:');
    
    // Check for missing required fields
    const missingTitles = await prisma.job.count({
      where: {
        OR: [
          { title: '' },
          { title: null }
        ]
      }
    });

    const missingCompanies = await prisma.job.count({
      where: {
        OR: [
          { company: '' },
          { company: null }
        ]
      }
    });

    const missingDescriptions = await prisma.job.count({
      where: {
        OR: [
          { description: '' },
          { description: null }
        ]
      }
    });

    console.log(`  Missing titles: ${missingTitles}`);
    console.log(`  Missing companies: ${missingCompanies}`);
    console.log(`  Missing descriptions: ${missingDescriptions}`);

    // 7. Check Adzuna API data specifically
    const adzunaJobs = await prisma.job.findMany({
      where: {
        source: 'external'
      },
      take: 5,
      select: {
        title: true,
        company: true,
        location: true,
        country: true,
        sourceId: true,
        rawJson: true
      }
    });

    console.log('\n🎯 Adzuna API Data Sample:');
    adzunaJobs.forEach((job, index) => {
      console.log(`\n  Adzuna Job ${index + 1}:`);
      console.log(`    Title: ${job.title}`);
      console.log(`    Company: ${job.company}`);
      console.log(`    Location: ${job.location}, ${job.country}`);
      console.log(`    Adzuna ID: ${job.sourceId}`);
      if (job.rawJson) {
        const raw = typeof job.rawJson === 'string' ? JSON.parse(job.rawJson) : job.rawJson;
        console.log(`    Original Adzuna Data: ${raw.__CLASS__ || 'Unknown'}`);
        console.log(`    Adzuna URL: ${raw.redirect_url || 'N/A'}`);
      }
    });

    // 8. Performance check
    console.log('\n⚡ Performance Check:');
    const startTime = Date.now();
    await prisma.job.findMany({
      take: 20,
      where: {
        isActive: true
      }
    });
    const queryTime = Date.now() - startTime;
    console.log(`  Query time for 20 jobs: ${queryTime}ms`);

    console.log('\n✅ Database verification completed successfully!');
    console.log(`\n📈 Summary:`);
    console.log(`  - Total jobs: ${totalJobs}`);
    console.log(`  - Countries: ${jobsByCountry.length}`);
    console.log(`  - Recent imports: ${recentJobs}`);
    console.log(`  - Data integrity: ${missingTitles + missingCompanies + missingDescriptions === 0 ? 'Good' : 'Issues found'}`);

  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
