/**
 * Safe User Cleanup Script
 * Removes test users and their related data for notification testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestUsers() {
  try {
    console.log('🧹 Starting safe user cleanup...\n');

    // Step 1: List all users first
    console.log('📋 Current users in database:');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    });

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - ${user.role} - Created: ${user.createdAt.toISOString()}`);
    });

    console.log(`\nTotal users: ${allUsers.length}\n`);

    // Step 2: Identify test users to remove
    const testUserPatterns = [
      /test/i,
      /example/i,
      /gmail\.com$/i,
      /yahoo\.com$/i,
      /outlook\.com$/i,
      /hotmail\.com$/i,
    ];

    // Users created after a specific date (adjust as needed)
    const cutoffDate = new Date('2025-01-01T00:00:00Z');

    const testUsers = allUsers.filter(user => {
      const isTestEmail = testUserPatterns.some(pattern => pattern.test(user.email));
      const isRecentUser = new Date(user.createdAt) > cutoffDate;
      return isTestEmail || isRecentUser;
    });

    if (testUsers.length === 0) {
      console.log('✅ No test users found to remove.');
      return;
    }

    console.log('🎯 Test users to be removed:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - ID: ${user.id}`);
    });

    console.log(`\n⚠️  This will remove ${testUsers.length} users and all their related data.`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    const userIds = testUsers.map(user => user.id);

    // Step 3: Delete in correct order (respecting foreign key constraints)
    console.log('🗑️  Starting deletion process...\n');

    // Delete notifications
    console.log('1. Deleting notifications...');
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`   ✅ Deleted ${deletedNotifications.count} notifications`);

    // Delete mobile errors (if any)
    console.log('2. Deleting mobile errors...');
    try {
      const deletedMobileErrors = await prisma.mobileError.deleteMany({
        where: { 
          OR: [
            { userAgent: { contains: 'test', mode: 'insensitive' } },
            { hostname: { contains: 'localhost' } }
          ]
        }
      });
      console.log(`   ✅ Deleted ${deletedMobileErrors.count} mobile errors`);
    } catch (error) {
      console.log('   ⚠️  Mobile errors table might not exist, skipping...');
    }

    // Delete applications
    console.log('3. Deleting applications...');
    const deletedApplications = await prisma.application.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`   ✅ Deleted ${deletedApplications.count} applications`);

    // Delete bookmarks
    console.log('4. Deleting bookmarks...');
    const deletedBookmarks = await prisma.bookmark.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`   ✅ Deleted ${deletedBookmarks.count} bookmarks`);

    // Delete resumes
    console.log('5. Deleting resumes...');
    const deletedResumes = await prisma.resume.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`   ✅ Deleted ${deletedResumes.count} resumes`);

    // Delete sessions
    console.log('6. Deleting sessions...');
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`   ✅ Deleted ${deletedSessions.count} sessions`);

    // Delete accounts (OAuth connections)
    console.log('7. Deleting OAuth accounts...');
    const deletedAccounts = await prisma.account.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`   ✅ Deleted ${deletedAccounts.count} OAuth accounts`);

    // Finally, delete users
    console.log('8. Deleting users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(`   ✅ Deleted ${deletedUsers.count} users`);

    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Users removed: ${deletedUsers.count}`);
    console.log(`   - Notifications removed: ${deletedNotifications.count}`);
    console.log(`   - Applications removed: ${deletedApplications.count}`);
    console.log(`   - Sessions removed: ${deletedSessions.count}`);
    console.log(`   - OAuth accounts removed: ${deletedAccounts.count}`);

    // Step 4: Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const remainingUsers = await prisma.user.count();
    const remainingNotifications = await prisma.notification.count();
    const remainingSessions = await prisma.session.count();
    const remainingAccounts = await prisma.account.count();

    console.log(`   - Remaining users: ${remainingUsers}`);
    console.log(`   - Remaining notifications: ${remainingNotifications}`);
    console.log(`   - Remaining sessions: ${remainingSessions}`);
    console.log(`   - Remaining accounts: ${remainingAccounts}`);

    if (remainingUsers === 0 && remainingNotifications === 0) {
      console.log('\n✅ Database is clean and ready for testing!');
      console.log('🔔 You can now test real-time notifications with fresh user registrations.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestUsers();
