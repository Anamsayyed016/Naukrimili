const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOAuthLinking() {
  try {
    console.log('🔍 Checking for OAuth linking issues...');
    
    // Check users without OAuth accounts
    const usersWithoutOAuth = await prisma.user.findMany({
      where: {
        accounts: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log('👥 Users without OAuth accounts:', usersWithoutOAuth);

    // Check OAuth accounts
    const oauthAccounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log('🔗 OAuth accounts:', oauthAccounts);

    // Check for duplicate users with same email
    const duplicateUsers = await prisma.user.groupBy({
      by: ['email'],
      where: {
        email: {
          not: null
        }
      },
      _count: {
        email: true
      },
      having: {
        email: {
          _count: {
            gt: 1
          }
        }
      }
    });

    console.log('🔄 Duplicate users by email:', duplicateUsers);

    if (duplicateUsers.length > 0) {
      console.log('⚠️ Found duplicate users. Cleaning up...');
      
      for (const duplicate of duplicateUsers) {
        const users = await prisma.user.findMany({
          where: { email: duplicate.email },
          orderBy: { createdAt: 'asc' }
        });

        // Keep the first user, delete the rest
        const usersToDelete = users.slice(1);
        
        for (const userToDelete of usersToDelete) {
          console.log(`🗑️ Deleting duplicate user: ${userToDelete.email} (${userToDelete.id})`);
          await prisma.user.delete({
            where: { id: userToDelete.id }
          });
        }
      }
    }

    console.log('✅ OAuth linking check completed');
    
  } catch (error) {
    console.error('❌ Error fixing OAuth linking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOAuthLinking();
