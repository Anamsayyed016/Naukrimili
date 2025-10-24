const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupUsers() {
  console.log('🧹 Starting user cleanup...\n');

  try {
    // Get current user count
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);

    // List all users (email only for privacy)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('\n📋 Current users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (${user.role || 'no role'}) - Created: ${user.createdAt.toISOString()}`);
    });

    console.log('\n⚠️  This will delete:');
    console.log('  - All users');
    console.log('  - All accounts (OAuth connections)');
    console.log('  - All sessions');
    console.log('  - All notifications');
    console.log('  - All applications');
    console.log('  - All resumes');
    console.log('  - All bookmarks');
    console.log('  - All messages');
    console.log('  - Related data');

    console.log('\n🔄 Starting deletion...\n');

    // Delete in order to respect foreign key constraints
    // Helper function to safely delete
    async function safeDelete(tableName, deleteFunc) {
      try {
        const result = await deleteFunc();
        console.log(`✅ Deleted ${result.count} ${tableName}`);
        return result.count;
      } catch (error) {
        console.log(`⚠️  Skipped ${tableName} (table may not exist)`);
        return 0;
      }
    }

    await safeDelete('bookmarks', () => prisma.bookmark?.deleteMany({}));
    await safeDelete('messages', () => prisma.message.deleteMany({}));
    await safeDelete('notifications', () => prisma.notification.deleteMany({}));
    await safeDelete('applications', () => prisma.application.deleteMany({}));
    await safeDelete('resumes', () => prisma.resume.deleteMany({}));
    await safeDelete('sessions', () => prisma.session.deleteMany({}));
    await safeDelete('accounts', () => prisma.account.deleteMany({}));
    
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.count} users`);

    console.log('\n✅ Cleanup completed successfully!');
    console.log('🎉 Database is now clean. You can test fresh user signups with real email notifications.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers();

