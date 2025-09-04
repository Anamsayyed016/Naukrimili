import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOAuthFlow() {
  try {
    console.log('🧪 Testing OAuth flow...');
    
    // Check if there are any users in the database
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // Check if there are any OAuth accounts
    const accountCount = await prisma.account.count();
    console.log(`📊 Total OAuth accounts: ${accountCount}`);
    
    // Check for users without passwords (OAuth users)
    const oauthUsers = await prisma.user.findMany({
      where: { password: null },
      include: { accounts: true }
    });
    
    console.log(`📊 OAuth users (no password): ${oauthUsers.length}`);
    oauthUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.accounts.length} account(s)`);
    });
    
    // Check for users with passwords (credential users)
    const credentialUsers = await prisma.user.findMany({
      where: { password: { not: null } }
    });
    
    console.log(`📊 Credential users (with password): ${credentialUsers.length}`);
    credentialUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });
    
    console.log('✅ OAuth flow test completed!');
    
  } catch (error) {
    console.error('❌ Error testing OAuth flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOAuthFlow();
