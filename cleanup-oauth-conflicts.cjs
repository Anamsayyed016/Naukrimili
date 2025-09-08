const { PrismaClient } = require('@prisma/client');

async function cleanupConflicts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧹 Starting aggressive OAuth cleanup...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log('📊 Current users:', users.length);
    
    // Delete all users with Gmail addresses (anamsayyed*)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'anamsayyed'
        }
      }
    });
    
    console.log('🗑️ Deleted conflicting users:', deletedUsers.count);
    
    // Delete all OAuth accounts
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        provider: {
          in: ['google', 'linkedin', 'github']
        }
      }
    });
    
    console.log('🗑️ Deleted OAuth accounts:', deletedAccounts.count);
    
    // Get remaining users
    const remainingUsers = await prisma.user.findMany();
    console.log('✅ Remaining users:', remainingUsers.length);
    
    console.log('🎉 OAuth cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupConflicts();
