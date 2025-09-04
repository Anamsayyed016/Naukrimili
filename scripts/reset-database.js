import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🗑️  Starting complete database reset...');
    
    // Delete all data in the correct order to respect foreign key constraints
    console.log('📝 Clearing job applications...');
    await prisma.jobApplication.deleteMany({});
    
    console.log('📝 Clearing jobs...');
    await prisma.job.deleteMany({});
    
    console.log('📝 Clearing companies...');
    await prisma.company.deleteMany({});
    
    console.log('📝 Clearing resumes...');
    await prisma.resume.deleteMany({});
    
    console.log('📝 Clearing notifications...');
    await prisma.notification.deleteMany({});
    
    console.log('📝 Clearing users...');
    const userResult = await prisma.user.deleteMany({});
    
    console.log('📝 Clearing accounts...');
    await prisma.account.deleteMany({});
    
    console.log('📝 Clearing sessions...');
    await prisma.session.deleteMany({});
    
    console.log('📝 Clearing verification tokens...');
    await prisma.verificationToken.deleteMany({});
    
    console.log(`✅ Successfully deleted ${userResult.count} users and all related data`);
    console.log('🎉 Database is now completely clean and ready for fresh start!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log('✨ Database reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database reset failed:', error);
    process.exit(1);
  });
