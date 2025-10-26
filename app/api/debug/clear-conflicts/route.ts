import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_request: NextRequest) {
  try {
    console.log('🧹 Starting OAuth conflict cleanup...');
    
    // Get all accounts and users
    const accounts = await prisma.account.findMany({
      include: {
        user: true
      }
    });
    
    const users = await prisma.user.findMany();
    
    console.log('📊 Current state:');
    console.log('- Users:', users.length);
    console.log('- Accounts:', accounts.length);
    
    // Clear all OAuth accounts to resolve conflicts
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        provider: {
          in: ['google', 'linkedin', 'github']
        }
      }
    });
    
    console.log('🗑️ Deleted OAuth accounts:', deletedAccounts.count);
    
    // Also clear any users without proper credentials (optional)
    const usersWithoutCredentials = await prisma.user.findMany({
      where: {
        AND: [
          { password: null },
          { accounts: { none: {} } }
        ]
      }
    });
    
    if (usersWithoutCredentials.length > 0) {
      const deletedUsers = await prisma.user.deleteMany({
        where: {
          AND: [
            { password: null },
            { accounts: { none: {} } }
          ]
        }
      });
      console.log('🗑️ Deleted orphaned users:', deletedUsers.count);
    }
    
    return NextResponse.json({
      success: true,
      message: 'OAuth conflicts cleared successfully',
      deletedAccounts: deletedAccounts.count,
      remainingUsers: users.length,
      remainingAccounts: accounts.length - deletedAccounts.count
    });
  } catch (_error) {
    console.error('❌ Error clearing OAuth conflicts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear OAuth conflicts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
