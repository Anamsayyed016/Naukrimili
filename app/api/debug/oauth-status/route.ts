import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Get all users and accounts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true
          }
        }
      }
    });

    const accounts = await prisma.account.findMany({
      select: {
        provider: true,
        providerAccountId: true,
        userId: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      users,
      accounts,
      totalUsers: users.length,
      totalAccounts: accounts.length
    });
  } catch (_error) {
    console.error('Error getting OAuth status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get OAuth status'
    }, { status: 500 });
  }
}
