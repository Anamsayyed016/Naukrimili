/**
 * Clean Users for Role Lock System
 * This script removes existing users to allow fresh registration with role locking
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanUsersForRoleLock() {
  console.log('🧹 Starting user cleanup for role lock system...\n');

  try {
    // Get count of existing users
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} existing users`);

    if (userCount === 0) {
      console.log('✅ No users to clean. Database is already clean.');
      return;
    }

    // Show existing users before deletion
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Existing users:');
    existingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Role: ${user.role || 'Not set'} - Created: ${user.createdAt.toISOString()}`);
    });

    // Delete all users and related data
    console.log('\n🗑️ Deleting users and related data...');

    // Delete in order to respect foreign key constraints
    await prisma.application.deleteMany();
    console.log('   ✅ Deleted applications');

    await prisma.jobBookmark.deleteMany();
    console.log('   ✅ Deleted job bookmarks');

    await prisma.resume.deleteMany();
    console.log('   ✅ Deleted resumes');

    await prisma.company.deleteMany();
    console.log('   ✅ Deleted companies');

    await prisma.account.deleteMany();
    console.log('   ✅ Deleted OAuth accounts');

    await prisma.session.deleteMany();
    console.log('   ✅ Deleted sessions');

    await prisma.verificationToken.deleteMany();
    console.log('   ✅ Deleted verification tokens');

    await prisma.user.deleteMany();
    console.log('   ✅ Deleted users');

    // Verify cleanup
    const finalUserCount = await prisma.user.count();
    console.log(`\n✅ Cleanup complete! Final user count: ${finalUserCount}`);

    console.log('\n🎉 Database is now clean and ready for role lock system!');
    console.log('📝 Users can now register fresh with role locking enabled.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanUsersForRoleLock()
  .then(() => {
    console.log('\n✨ User cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 User cleanup failed:', error);
    process.exit(1);
  });
