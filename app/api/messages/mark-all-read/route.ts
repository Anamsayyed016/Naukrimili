/**
 * Mark All Messages as Read API Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark all received messages as read
    const result = await prisma.message.updateMany({
      where: {
        receiverId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} messages marked as read`
    });

  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all messages as read' },
      { status: 500 }
    );
  }
}
