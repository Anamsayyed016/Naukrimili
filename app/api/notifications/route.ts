/**
 * Notifications API Endpoint
 * Handles GET (fetch notifications) and POST (mark as read) operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

import { 
  getUserNotifications, 
  markAllNotificationsAsRead,
  createNotification 
} from '@/lib/notification-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || undefined;

    const result = await getUserNotifications(session.user.id, {
      limit,
      offset,
      unreadOnly,
      type
    });

    return NextResponse.json({
      success: true,
      data: result.notifications,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notificationId, type, title, message, data } = body;

    switch (action) {
      case 'markAllRead':
        await markAllNotificationsAsRead(session.user.id);
        return NextResponse.json({
          success: true,
          message: 'All notifications marked as read'
        });

      case 'create':
        if (!type || !title || !message) {
          return NextResponse.json(
            { error: 'Missing required fields: type, title, message' },
            { status: 400 }
          );
        }

        const notification = await createNotification({
          userId: session.user.id,
          type,
          title,
          message,
          data
        });

        return NextResponse.json({
          success: true,
          data: notification,
          message: 'Notification created successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error handling notification request:', error);
    return NextResponse.json(
      { error: 'Failed to process notification request' },
      { status: 500 }
    );
  }
}
