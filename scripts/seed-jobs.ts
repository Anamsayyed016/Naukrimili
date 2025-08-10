import { prisma } from '../lib/prisma';

async function main() {
  const samples = [
    {
      source: 'seed',
      sourceId: 'sample-1',
      title: 'Sample Backend Engineer',
      country: 'US',
      description: 'A placeholder backend engineer role',
      rawJson: { level: 'mid' },
    },
    {
      source: 'seed',
      sourceId: 'sample-2',
      title: 'Sample Frontend Engineer',
      country: 'DE',
      description: 'A placeholder frontend engineer role',
      rawJson: { level: 'junior' },
    },
  ];

  for (const data of samples) {
    try {
      await prisma.job.create({ data });
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log('Skipping duplicate', data.sourceId);
      } else {
        console.error('Insert failed', data, e);
      }
    }
  }
  console.log('Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
