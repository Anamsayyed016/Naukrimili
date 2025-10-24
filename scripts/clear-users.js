import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllUsers() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Delete all users and related data
    const result = await prisma.user.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} users from the database`);
    console.log('🎉 Database is now clean and ready for fresh users!');
    
  } catch (error) {
    console.error('❌ Error clearing users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearAllUsers()
  .then(() => {
    console.log('✨ Database cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database cleanup failed:', error);
    process.exit(1);
  });
