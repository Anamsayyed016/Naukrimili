/**
 * Socket.io Notification API Endpoint
 * Handles real-time notification triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { getSocketService } from '@/lib/socket-server';

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
    const { action, targetUserId, targetRole, notification } = body;

    const socketService = getSocketService();
    
    if (!socketService) {
      return NextResponse.json(
        { error: 'Socket service not available' },
        { status: 503 }
      );
    }

    switch (action) {
      case 'sendToUser':
        if (!targetUserId || !notification) {
          return NextResponse.json(
            { error: 'Missing targetUserId or notification' },
            { status: 400 }
          );
        }

        await socketService.sendNotificationToUser(targetUserId, notification);
        break;

      case 'sendToRole':
        if (!targetRole || !notification) {
          return NextResponse.json(
            { error: 'Missing targetRole or notification' },
            { status: 400 }
          );
        }

        await socketService.sendNotificationToRole(targetRole, notification);
        break;

      case 'sendBroadcast':
        if (!notification) {
          return NextResponse.json(
            { error: 'Missing notification' },
            { status: 400 }
          );
        }

        await socketService.sendBroadcastNotification(notification);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending socket notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const socketService = getSocketService();
    
    if (!socketService) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'Socket service not available'
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      connectedUsers: socketService.getConnectedUsersCount(),
      isUserOnline: socketService.isUserOnline(session.user.id),
      message: 'Socket service is running'
    });

  } catch (error) {
    console.error('Error checking socket status:', error);
    return NextResponse.json(
      { error: 'Failed to check socket status' },
      { status: 500 }
    );
  }
}
