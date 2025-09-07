/**
 * Individual Notification API Endpoint
 * Handles operations on specific notifications (mark as read, delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

import { markNotificationAsRead } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notificationId = params.id;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'markRead':
        await markNotificationAsRead(notificationId, session.user.id);
        return NextResponse.json({
          success: true,
          message: 'Notification marked as read'
        });

      case 'markUnread':
        await prisma.notification.updateMany({
          where: {
            id: notificationId,
            userId: session.user.id
          },
          data: {
            isRead: false,
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Notification marked as unread'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notificationId = params.id;

    // Delete notification (only if it belongs to the user)
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
