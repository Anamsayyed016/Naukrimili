import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function resetServerDatabase() {
  try {
    console.log('🗑️  Starting server database reset...');
    console.log('⚠️  WARNING: This will delete ALL data from the production database!');
    
    // Confirmation prompt
    if (process.env.NODE_ENV === 'production' && !process.env.FORCE_RESET) {
      console.log('❌ Production reset blocked. Set FORCE_RESET=true to override.');
      process.exit(1);
    }
    
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
    console.log('🎉 Server database is now completely clean!');
    
  } catch (error) {
    console.error('❌ Error resetting server database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetServerDatabase()
  .then(() => {
    console.log('✨ Server database reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Server database reset failed:', error);
    process.exit(1);
  });
