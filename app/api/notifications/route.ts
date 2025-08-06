import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_match' | 'application_update' | 'profile_reminder' | 'system' | 'recruiter';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

// Mock notifications data - replace with actual database calls
const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'New Job Match Found!',
    message: 'We found 3 new job opportunities that match your profile.',
    type: 'job_match',
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    actionUrl: '/jobs?match=true',
    priority: 'high'
  },
  {
    id: '2',
    userId: '1',
    title: 'Application Status Update',
    message: 'Your application for Software Developer at TechCorp has been viewed.',
    type: 'application_update',
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    actionUrl: '/applications/app_123',
    priority: 'medium'
  },
  {
    id: '3',
    userId: '1',
    title: 'Complete Your Profile',
    message: 'Your profile is 85% complete. Add skills to get better job matches.',
    type: 'profile_reminder',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    actionUrl: '/profile?section=skills',
    priority: 'low'
  },
  {
    id: '4',
    userId: '1',
    title: 'Weekly Job Digest',
    message: 'Check out this week\'s top job recommendations for you.',
    type: 'system',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    actionUrl: '/jobs/weekly-digest',
    priority: 'low'
  },
  {
    id: '5',
    userId: '1',
    title: 'Recruiter Interest',
    message: 'A recruiter from InnovateX showed interest in your profile.',
    type: 'recruiter',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    actionUrl: '/messages/recruiter_456',
    priority: 'high'
  }
];

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Filter notifications for the current user
    let userNotifications = mockNotifications.filter(n => n.userId === session.user.id);

    if (unreadOnly) {
      userNotifications = userNotifications.filter(n => !n.isRead);
    }

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = userNotifications.slice(startIndex, startIndex + limit);

    const totalCount = userNotifications.length;
    const unreadCount = mockNotifications.filter(n => n.userId === session.user.id && !n.isRead).length;

    return NextResponse.json({
      notifications: paginatedNotifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: startIndex + limit < totalCount
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications (mark as read)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      mockNotifications.forEach(notification => {
        if (notification.userId === session.user.id) {
          notification.isRead = true;
        }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      notificationIds.forEach(id => {
        const notification = mockNotifications.find(n => n.id === id && n.userId === session.user.id);
        if (notification) {
          notification.isRead = true;
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
