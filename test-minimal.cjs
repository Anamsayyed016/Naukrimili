const { PrismaClient } = require('@prisma/client');

console.log('Environment DATABASE_URL:', process.env.DATABASE_URL);

// Create Prisma client with explicit connection string
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:job123@localhost:5432/naukrimili'
    }
  },
  log: ['query', 'info', 'warn', 'error']
});

async function test() {
  try {
    console.log('Testing with explicit connection string...');
    
    // Try a simple query first
    const result = await prisma.$queryRaw`SELECT current_database() as db_name`;
    console.log('Current database:', result);
    
    // Now try the job count
    const count = await prisma.job.count();
    console.log('Jobs count:', count);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
