const { PrismaClient } = require('@prisma/client');

// Test with different connection string formats
const connectionStrings = [
  'postgresql://postgres:job123@localhost:5432/naukrimili',
  'postgresql://postgres:job123@127.0.0.1:5432/naukrimili',
  'postgresql://postgres:job123@/naukrimili?host=/var/run/postgresql',
];

async function testConnection(connectionString, label) {
  console.log(`\nTesting ${label}: ${connectionString}`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString
      }
    },
    log: ['error']
  });

  try {
    const result = await prisma.job.count();
    console.log(`✅ Success! Jobs count: ${result}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function runTests() {
  for (let i = 0; i < connectionStrings.length; i++) {
    const success = await testConnection(connectionStrings[i], `Connection ${i + 1}`);
    if (success) break;
  }
}

runTests();
