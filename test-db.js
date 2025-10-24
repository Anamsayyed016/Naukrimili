const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await prisma.job.count();
    console.log('✅ Success! Jobs count:', result);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
