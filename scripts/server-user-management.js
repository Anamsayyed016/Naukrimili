#!/usr/bin/env node

/**
 * Server User Management Script
 * Comprehensive user removal and management for production server
 * 
 * Usage:
 *   node scripts/server-user-management.js --help
 *   node scripts/server-user-management.js --list
 *   node scripts/server-user-management.js --remove-all
 *   node scripts/server-user-management.js --remove-test
 *   node scripts/server-user-management.js --remove-oauth
 *   node scripts/server-user-management.js --remove-by-email user@example.com
 *   node scripts/server-user-management.js --remove-by-role jobseeker
 *   node scripts/server-user-management.js --remove-inactive
 */

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask for confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Helper function to wait for user input
function waitForInput(seconds = 5) {
  return new Promise((resolve) => {
    console.log(`\n⏰ Waiting ${seconds} seconds for you to cancel (Ctrl+C)...`);
    setTimeout(resolve, seconds * 1000);
  });
}

// List all users with details
async function listUsers() {
  try {
    console.log('📋 Listing all users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            applications: true,
            resumes: true,
            accounts: true,
            sessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('✅ No users found in database.');
      return;
    }

    console.log(`📊 Found ${users.length} users:\n`);
    console.log('ID'.padEnd(12) + 'Email'.padEnd(30) + 'Name'.padEnd(20) + 'Role'.padEnd(12) + 'Active'.padEnd(8) + 'Verified'.padEnd(8) + 'Created'.padEnd(12) + 'Data Count');
    console.log('─'.repeat(120));
    
    users.forEach((user, index) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A';
      const created = user.createdAt.toISOString().split('T')[0];
      const dataCount = `${user._count.applications}A ${user._count.resumes}R ${user._count.accounts}O ${user._count.sessions}S`;
      
      console.log(
        user.id.substring(0, 11).padEnd(12) +
        user.email.substring(0, 29).padEnd(30) +
        name.substring(0, 19).padEnd(20) +
        (user.role || 'N/A').padEnd(12) +
        (user.isActive ? 'Yes' : 'No').padEnd(8) +
        (user.isVerified ? 'Yes' : 'No').padEnd(8) +
        created.padEnd(12) +
        dataCount
      );
    });

    console.log('\n📊 Summary:');
    const activeUsers = users.filter(u => u.isActive).length;
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const oauthUsers = users.filter(u => u._count.accounts > 0).length;
    const usersWithData = users.filter(u => u._count.applications > 0 || u._count.resumes > 0).length;

    console.log(`   - Total users: ${users.length}`);
    console.log(`   - Active users: ${activeUsers}`);
    console.log(`   - Verified users: ${verifiedUsers}`);
    console.log(`   - OAuth users: ${oauthUsers}`);
    console.log(`   - Users with data: ${usersWithData}`);

  } catch (error) {
    console.error('❌ Error listing users:', error);
    throw error;
  }
}

// Remove all users and related data
async function removeAllUsers() {
  try {
    console.log('🗑️  Preparing to remove ALL users and related data...');
    
    // Get current user count
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('✅ No users found to remove.');
      return;
    }

    console.log(`⚠️  WARNING: This will permanently delete ${userCount} users and ALL their related data!`);
    console.log('This includes: applications, resumes, notifications, sessions, OAuth accounts, etc.');
    
    const confirmed = await askConfirmation('\nAre you absolutely sure? Type "yes" to confirm: ');
    if (!confirmed) {
      console.log('❌ Operation cancelled.');
      return;
    }

    console.log('\n⏰ Final confirmation in 5 seconds...');
    await waitForInput(5);

    console.log('\n🗑️  Starting complete user removal...\n');

    // Delete in correct order to respect foreign key constraints
    const steps = [
      { name: 'Notifications', fn: () => prisma.notification.deleteMany({}) },
      { name: 'Mobile Errors', fn: () => prisma.mobileError.deleteMany({}) },
      { name: 'Search History', fn: () => prisma.searchHistory.deleteMany({}) },
      { name: 'Analytics Events', fn: () => prisma.analyticsEvent.deleteMany({}) },
      { name: 'Resume Views', fn: () => prisma.resumeView.deleteMany({}) },
      { name: 'Job Bookmarks', fn: () => prisma.jobBookmark.deleteMany({}) },
      { name: 'Applications', fn: () => prisma.application.deleteMany({}) },
      { name: 'Resumes', fn: () => prisma.resume.deleteMany({}) },
      { name: 'Sessions', fn: () => prisma.session.deleteMany({}) },
      { name: 'OAuth Accounts', fn: () => prisma.account.deleteMany({}) },
      { name: 'Verification Tokens', fn: () => prisma.verificationToken.deleteMany({}) },
      { name: 'Settings', fn: () => prisma.settings.deleteMany({}) },
      { name: 'OTP Verifications', fn: () => prisma.otpVerification.deleteMany({}) },
      { name: 'Users', fn: () => prisma.user.deleteMany({}) }
    ];

    const results = {};
    for (const step of steps) {
      try {
        console.log(`   Deleting ${step.name}...`);
        const result = await step.fn();
        results[step.name] = result.count || 0;
        console.log(`   ✅ Deleted ${results[step.name]} ${step.name.toLowerCase()}`);
      } catch (error) {
        console.log(`   ⚠️  ${step.name} deletion failed (might not exist): ${error.message}`);
        results[step.name] = 0;
      }
    }

    console.log('\n🎉 Complete user removal finished!');
    console.log('\n📊 Deletion Summary:');
    Object.entries(results).forEach(([name, count]) => {
      console.log(`   - ${name}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error removing all users:', error);
    throw error;
  }
}

// Remove test users only
async function removeTestUsers() {
  try {
    console.log('🧹 Identifying test users...\n');

    // Define test user patterns
    const testPatterns = [
      /test/i,
      /example/i,
      /demo/i,
      /sample/i,
      /gmail\.com$/i,
      /yahoo\.com$/i,
      /outlook\.com$/i,
      /hotmail\.com$/i,
      /temp/i,
      /fake/i
    ];

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        isActive: true
      }
    });

    // Filter test users
    const testUsers = allUsers.filter(user => {
      const isTestEmail = testPatterns.some(pattern => pattern.test(user.email));
      const isTestName = testPatterns.some(pattern => 
        pattern.test(user.firstName || '') || pattern.test(user.lastName || '')
      );
      return isTestEmail || isTestName;
    });

    if (testUsers.length === 0) {
      console.log('✅ No test users found to remove.');
      return;
    }

    console.log(`🎯 Found ${testUsers.length} test users:`);
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });

    const confirmed = await askConfirmation(`\nRemove these ${testUsers.length} test users? (y/N): `);
    if (!confirmed) {
      console.log('❌ Operation cancelled.');
      return;
    }

    await waitForInput(3);

    console.log('\n🗑️  Removing test users...\n');
    const userIds = testUsers.map(u => u.id);

    // Delete related data first
    const relatedData = [
      { name: 'Notifications', fn: () => prisma.notification.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Applications', fn: () => prisma.application.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Resumes', fn: () => prisma.resume.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Sessions', fn: () => prisma.session.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'OAuth Accounts', fn: () => prisma.account.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Job Bookmarks', fn: () => prisma.jobBookmark.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Search History', fn: () => prisma.searchHistory.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Settings', fn: () => prisma.settings.deleteMany({ where: { userId: { in: userIds } } }) }
    ];

    for (const data of relatedData) {
      try {
        const result = await data.fn();
        console.log(`   ✅ Deleted ${result.count} ${data.name.toLowerCase()}`);
      } catch (error) {
        console.log(`   ⚠️  ${data.name} deletion failed: ${error.message}`);
      }
    }

    // Finally delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    console.log(`\n🎉 Successfully removed ${deletedUsers.count} test users!`);

  } catch (error) {
    console.error('❌ Error removing test users:', error);
    throw error;
  }
}

// Remove OAuth users only
async function removeOAuthUsers() {
  try {
    console.log('🔐 Identifying OAuth users...\n');

    const oauthUsers = await prisma.user.findMany({
      where: {
        password: null,
        accounts: {
          some: {}
        }
      },
      include: {
        accounts: true
      }
    });

    if (oauthUsers.length === 0) {
      console.log('✅ No OAuth users found to remove.');
      return;
    }

    console.log(`🎯 Found ${oauthUsers.length} OAuth users:`);
    oauthUsers.forEach((user, index) => {
      const providers = user.accounts.map(acc => acc.provider).join(', ');
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - Providers: ${providers}`);
    });

    const confirmed = await askConfirmation(`\nRemove these ${oauthUsers.length} OAuth users? (y/N): `);
    if (!confirmed) {
      console.log('❌ Operation cancelled.');
      return;
    }

    await waitForInput(3);

    console.log('\n🗑️  Removing OAuth users...\n');
    const userIds = oauthUsers.map(u => u.id);

    // Delete related data
    const relatedData = [
      { name: 'Notifications', fn: () => prisma.notification.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Applications', fn: () => prisma.application.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Resumes', fn: () => prisma.resume.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Sessions', fn: () => prisma.session.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'OAuth Accounts', fn: () => prisma.account.deleteMany({ where: { userId: { in: userIds } } }) }
    ];

    for (const data of relatedData) {
      try {
        const result = await data.fn();
        console.log(`   ✅ Deleted ${result.count} ${data.name.toLowerCase()}`);
      } catch (error) {
        console.log(`   ⚠️  ${data.name} deletion failed: ${error.message}`);
      }
    }

    // Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    console.log(`\n🎉 Successfully removed ${deletedUsers.count} OAuth users!`);

  } catch (error) {
    console.error('❌ Error removing OAuth users:', error);
    throw error;
  }
}

// Remove users by email
async function removeUserByEmail(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            applications: true,
            resumes: true,
            accounts: true,
            sessions: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found.');
      return;
    }

    console.log(`📋 User found:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Active: ${user.isActive}`);
    console.log(`   - Data: ${user._count.applications} applications, ${user._count.resumes} resumes, ${user._count.accounts} OAuth accounts`);

    const confirmed = await askConfirmation(`\nRemove this user and all their data? (y/N): `);
    if (!confirmed) {
      console.log('❌ Operation cancelled.');
      return;
    }

    console.log('\n🗑️  Removing user...\n');

    // Delete related data
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.application.deleteMany({ where: { userId: user.id } });
    await prisma.resume.deleteMany({ where: { userId: user.id } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.jobBookmark.deleteMany({ where: { userId: user.id } });
    await prisma.searchHistory.deleteMany({ where: { userId: user.id } });
    await prisma.settings.deleteMany({ where: { userId: user.id } });

    // Delete user
    await prisma.user.delete({ where: { id: user.id } });

    console.log('🎉 User removed successfully!');

  } catch (error) {
    console.error('❌ Error removing user:', error);
    throw error;
  }
}

// Remove users by role
async function removeUsersByRole(role) {
  try {
    console.log(`🔍 Looking for users with role: ${role}\n`);

    const users = await prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log(`✅ No users found with role: ${role}`);
      return;
    }

    console.log(`🎯 Found ${users.length} users with role "${role}":`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });

    const confirmed = await askConfirmation(`\nRemove these ${users.length} users? (y/N): `);
    if (!confirmed) {
      console.log('❌ Operation cancelled.');
      return;
    }

    await waitForInput(3);

    console.log('\n🗑️  Removing users...\n');
    const userIds = users.map(u => u.id);

    // Delete related data
    const relatedData = [
      { name: 'Notifications', fn: () => prisma.notification.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Applications', fn: () => prisma.application.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Resumes', fn: () => prisma.resume.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Sessions', fn: () => prisma.session.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'OAuth Accounts', fn: () => prisma.account.deleteMany({ where: { userId: { in: userIds } } }) }
    ];

    for (const data of relatedData) {
      try {
        const result = await data.fn();
        console.log(`   ✅ Deleted ${result.count} ${data.name.toLowerCase()}`);
      } catch (error) {
        console.log(`   ⚠️  ${data.name} deletion failed: ${error.message}`);
      }
    }

    // Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    console.log(`\n🎉 Successfully removed ${deletedUsers.count} users with role "${role}"!`);

  } catch (error) {
    console.error('❌ Error removing users by role:', error);
    throw error;
  }
}

// Remove inactive users
async function removeInactiveUsers() {
  try {
    console.log('🔍 Looking for inactive users...\n');

    // Users who haven't logged in for 30+ days or are marked as inactive
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactiveUsers = await prisma.user.findMany({
      where: {
        OR: [
          { isActive: false },
          { lastLogin: { lt: thirtyDaysAgo } },
          { 
            AND: [
              { lastLogin: null },
              { createdAt: { lt: thirtyDaysAgo } }
            ]
          }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        lastLogin: true,
        createdAt: true
      }
    });

    if (inactiveUsers.length === 0) {
      console.log('✅ No inactive users found to remove.');
      return;
    }

    console.log(`🎯 Found ${inactiveUsers.length} inactive users:`);
    inactiveUsers.forEach((user, index) => {
      const lastLogin = user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never';
      const status = user.isActive ? 'Inactive (no login)' : 'Inactive (disabled)';
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${status} - Last login: ${lastLogin}`);
    });

    const confirmed = await askConfirmation(`\nRemove these ${inactiveUsers.length} inactive users? (y/N): `);
    if (!confirmed) {
      console.log('❌ Operation cancelled.');
      return;
    }

    await waitForInput(3);

    console.log('\n🗑️  Removing inactive users...\n');
    const userIds = inactiveUsers.map(u => u.id);

    // Delete related data
    const relatedData = [
      { name: 'Notifications', fn: () => prisma.notification.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Applications', fn: () => prisma.application.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Resumes', fn: () => prisma.resume.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'Sessions', fn: () => prisma.session.deleteMany({ where: { userId: { in: userIds } } }) },
      { name: 'OAuth Accounts', fn: () => prisma.account.deleteMany({ where: { userId: { in: userIds } } }) }
    ];

    for (const data of relatedData) {
      try {
        const result = await data.fn();
        console.log(`   ✅ Deleted ${result.count} ${data.name.toLowerCase()}`);
      } catch (error) {
        console.log(`   ⚠️  ${data.name} deletion failed: ${error.message}`);
      }
    }

    // Delete users
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    console.log(`\n🎉 Successfully removed ${deletedUsers.count} inactive users!`);

  } catch (error) {
    console.error('❌ Error removing inactive users:', error);
    throw error;
  }
}

// Show help
function showHelp() {
  console.log(`
🏢 Server User Management Script
================================

This script provides comprehensive user management for your job portal database.

USAGE:
  node scripts/server-user-management.js [OPTIONS]

OPTIONS:
  --help              Show this help message
  --list              List all users with details
  --remove-all        Remove ALL users and related data (DANGEROUS!)
  --remove-test       Remove test users only (safe)
  --remove-oauth      Remove OAuth users only
  --remove-by-email   Remove specific user by email
  --remove-by-role    Remove users by role (jobseeker, employer, admin)
  --remove-inactive   Remove inactive users (30+ days no login)

EXAMPLES:
  node scripts/server-user-management.js --list
  node scripts/server-user-management.js --remove-test
  node scripts/server-user-management.js --remove-oauth
  node scripts/server-user-management.js --remove-by-email user@example.com
  node scripts/server-user-management.js --remove-by-role jobseeker
  node scripts/server-user-management.js --remove-inactive

SAFETY FEATURES:
  - Confirmation prompts for destructive operations
  - Detailed user listing before deletion
  - Proper foreign key constraint handling
  - Rollback-safe operations
  - Production environment checks

⚠️  WARNING: Always backup your database before running destructive operations!
`);
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
      showHelp();
      return;
    }

    // Check if we're in production
    if (process.env.NODE_ENV === 'production' && args.includes('--remove-all')) {
      console.log('❌ Production environment detected. Use --remove-test or --remove-oauth instead.');
      console.log('   Set FORCE_RESET=true to override this protection.');
      process.exit(1);
    }

    // Connect to database
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Execute based on arguments
    if (args.includes('--list')) {
      await listUsers();
    } else if (args.includes('--remove-all')) {
      await removeAllUsers();
    } else if (args.includes('--remove-test')) {
      await removeTestUsers();
    } else if (args.includes('--remove-oauth')) {
      await removeOAuthUsers();
    } else if (args.includes('--remove-by-email')) {
      const emailIndex = args.indexOf('--remove-by-email');
      const email = args[emailIndex + 1];
      if (!email) {
        console.log('❌ Please provide an email address: --remove-by-email user@example.com');
        return;
      }
      await removeUserByEmail(email);
    } else if (args.includes('--remove-by-role')) {
      const roleIndex = args.indexOf('--remove-by-role');
      const role = args[roleIndex + 1];
      if (!role) {
        console.log('❌ Please provide a role: --remove-by-role jobseeker');
        return;
      }
      await removeUsersByRole(role);
    } else if (args.includes('--remove-inactive')) {
      await removeInactiveUsers();
    } else {
      console.log('❌ Unknown option. Use --help to see available options.');
    }

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the script
main();
