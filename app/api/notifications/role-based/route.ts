/**
 * Role-based Notification API Endpoint
 * Triggers real-time notifications to specific user roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

// Lazy load socket service to avoid build-time errors
async function getSocketServiceLazy() {
  try {
    // Try to import the CommonJS socket server (works at runtime)
    const socketServer = await import('@/lib/socket-server.js');
    if (socketServer?.getSocketService) {
      return socketServer.getSocketService();
    }
  } catch (error) {
    // Socket service not available (e.g., during build or if not initialized)
    return null;
  }
  return null;
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
    const { role, notification } = body;

    // Validate required fields
    if (!role || !notification) {
      return NextResponse.json(
        { error: 'Missing required fields: role, notification' },
        { status: 400 }
      );
    }

    if (!notification.title || !notification.message) {
      return NextResponse.json(
        { error: 'Missing required notification fields: title, message' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['jobseeker', 'employer', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Get socket service (lazy load to avoid build-time errors)
    const socketService = await getSocketServiceLazy();
    
    // Check if socket service is available
    if (!socketService) {
      return NextResponse.json(
        { 
          error: 'Socket service not available',
          message: 'Real-time notifications are not currently active'
        },
        { status: 503 }
      );
    }

    // Send role-based notification
    let result;
    switch (role) {
      case 'jobseeker':
        if (socketService.sendNotificationToJobseekers) {
          result = await socketService.sendNotificationToJobseekers(notification);
        } else {
          throw new Error('sendNotificationToJobseekers method not available');
        }
        break;
      case 'employer':
        if (socketService.sendNotificationToEmployers) {
          result = await socketService.sendNotificationToEmployers(notification);
        } else {
          throw new Error('sendNotificationToEmployers method not available');
        }
        break;
      case 'admin':
        if (socketService.sendNotificationToAdmins) {
          result = await socketService.sendNotificationToAdmins(notification);
        } else {
          throw new Error('sendNotificationToAdmins method not available');
        }
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
    }

    console.log(`✅ Role-based notification sent to ${role}s:`, notification.title);

    return NextResponse.json({
      success: true,
      message: `Notification sent to all ${role}s`,
      role,
      notification,
      result
    });

  } catch (error: any) {
    console.error('❌ Error sending role-based notification:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return available roles and example usage
    return NextResponse.json({
      success: true,
      message: 'Role-based notification API',
      availableRoles: ['jobseeker', 'employer', 'admin'],
      example: {
        method: 'POST',
        body: {
          role: 'jobseeker',
          notification: {
            type: 'JOB_ALERT',
            title: 'New Job Alert!',
            message: 'A new job matching your profile has been posted.',
            data: {
              jobId: '123',
              action: 'view_job'
            }
          }
        }
      },
      socketServiceAvailable: !!(await getSocketServiceLazy())
    });

  } catch (error: any) {
    console.error('❌ Error getting role-based notification info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get notification info',
        details: error.message
      },
      { status: 500 }
    );
  }
}
