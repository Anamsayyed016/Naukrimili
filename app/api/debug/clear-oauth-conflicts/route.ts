import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Clear any existing OAuth accounts that might be causing conflicts
    const result = await prisma.account.deleteMany({
      where: {
        provider: 'google'
      }
    });

    console.log('Cleared Google OAuth accounts:', result);

    return NextResponse.json({
      success: true,
      message: 'OAuth conflicts cleared',
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error clearing OAuth conflicts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear OAuth conflicts'
    }, { status: 500 });
  }
}
