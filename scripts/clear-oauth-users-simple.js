import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearOAuthUsers() {
  try {
    console.log('🗑️  Starting OAuth users cleanup...');
    
    // First, let's see what OAuth users we have using raw SQL
    const oauthUsers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        u."createdAt",
        COUNT(a.id) as oauth_accounts
      FROM "User" u
      LEFT JOIN "Account" a ON u.id = a."userId"
      WHERE u.password IS NULL 
        AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
      GROUP BY u.id, u.name, u.email, u."createdAt"
      ORDER BY u."createdAt" DESC
    `;
    
    console.log(`📊 Found ${oauthUsers.length} OAuth users to remove:`);
    
    // Display user info before deletion
    oauthUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.oauth_accounts} OAuth account(s)`);
    });
    
    if (oauthUsers.length === 0) {
      console.log('✅ No OAuth users found. Database is clean!');
      return;
    }
    
    // Confirmation prompt
    console.log('\n⚠️  WARNING: This will delete the above OAuth users and all their data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🗑️  Proceeding with OAuth users deletion...');
    
    // Delete OAuth users using raw SQL
    const result = await prisma.$executeRaw`
      -- Delete job applications for OAuth users
      DELETE FROM "JobApplication" 
      WHERE "userId" IN (
          SELECT u.id 
          FROM "User" u 
          WHERE u.password IS NULL 
            AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
      );
      
      -- Delete jobs posted by OAuth users
      DELETE FROM "Job" 
      WHERE "userId" IN (
          SELECT u.id 
          FROM "User" u 
          WHERE u.password IS NULL 
            AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
      );
      
      -- Delete resumes uploaded by OAuth users
      DELETE FROM "Resume" 
      WHERE "userId" IN (
          SELECT u.id 
          FROM "User" u 
          WHERE u.password IS NULL 
            AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
      );
      
      -- Delete notifications for OAuth users
      DELETE FROM "Notification" 
      WHERE "userId" IN (
          SELECT u.id 
          FROM "User" u 
          WHERE u.password IS NULL 
            AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
      );
      
      -- Delete OAuth accounts
      DELETE FROM "Account" 
      WHERE "userId" IN (
          SELECT u.id 
          FROM "User" u 
          WHERE u.password IS NULL 
            AND u.id IN (SELECT DISTINCT "userId" FROM "Account")
      );
      
      -- Delete OAuth users
      DELETE FROM "User" 
      WHERE password IS NULL 
        AND id IN (SELECT DISTINCT "userId" FROM "Account");
    `;
    
    console.log(`\n🎉 Successfully deleted OAuth users and their data!`);
    console.log('✨ OAuth users cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during OAuth users cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearOAuthUsers()
  .then(() => {
    console.log('✨ OAuth users cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 OAuth users cleanup failed:', error);
    process.exit(1);
  });
