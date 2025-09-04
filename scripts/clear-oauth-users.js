import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearOAuthUsers() {
  try {
    console.log('🗑️  Starting OAuth users cleanup...');
    
    // Find OAuth users (users with accounts but no password)
    const oauthUsers = await prisma.user.findMany({
      where: {
        password: null, // OAuth users don't have passwords
        accounts: {
          some: {} // They have OAuth accounts
        }
      },
      include: {
        accounts: true
      }
    });
    
    console.log(`📊 Found ${oauthUsers.length} OAuth users to remove:`);
    
    // Display user info before deletion
    oauthUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.accounts.length} OAuth account(s)`);
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
    
    // Delete OAuth users and their related data
    let deletedCount = 0;
    
    for (const user of oauthUsers) {
      try {
        // Delete user's related data first
        await prisma.jobApplication.deleteMany({
          where: { userId: user.id }
        });
        
        await prisma.job.deleteMany({
          where: { userId: user.id }
        });
        
        await prisma.resume.deleteMany({
          where: { userId: user.id }
        });
        
        await prisma.notification.deleteMany({
          where: { userId: user.id }
        });
        
        // Delete user's OAuth accounts
        await prisma.account.deleteMany({
          where: { userId: user.id }
        });
        
        // Finally delete the user
        await prisma.user.delete({
          where: { id: user.id }
        });
        
        deletedCount++;
        console.log(`✅ Deleted OAuth user: ${user.name} (${user.email})`);
        
      } catch (error) {
        console.error(`❌ Error deleting user ${user.email}:`, error);
      }
    }
    
    console.log(`\n🎉 Successfully deleted ${deletedCount} OAuth users!`);
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
