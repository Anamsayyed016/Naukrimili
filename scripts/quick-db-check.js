import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('🔍 Quick Database Check...\n');
    
    // Total jobs
    const total = await prisma.job.count();
    console.log(`📊 Total Jobs: ${total}`);
    
    // By country
    const byCountry = await prisma.job.groupBy({
      by: ['country'],
      _count: { id: true }
    });
    console.log('\n🌍 By Country:');
    byCountry.forEach(g => console.log(`  ${g.country}: ${g._count.id}`));
    
    // By source
    const bySource = await prisma.job.groupBy({
      by: ['source'],
      _count: { id: true }
    });
    console.log('\n📡 By Source:');
    bySource.forEach(g => console.log(`  ${g.source}: ${g._count.id}`));
    
    // Sample jobs
    const samples = await prisma.job.findMany({
      take: 3,
      select: {
        title: true,
        company: true,
        location: true,
        country: true,
        source: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📋 Recent Jobs:');
    samples.forEach((job, i) => {
      console.log(`  ${i+1}. ${job.title} at ${job.company}`);
      console.log(`     Location: ${job.location}, ${job.country}`);
      console.log(`     Source: ${job.source} | Created: ${job.createdAt.toLocaleDateString()}`);
    });
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
