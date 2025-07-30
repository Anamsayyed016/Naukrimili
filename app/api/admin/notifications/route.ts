import { handleApiError } from '@/lib/error-handler';

const notifications = [
  {
    id: 1,
    type: 'job_post',
    title: 'New Job Posted',
    message: 'Google posted: Senior Software Engineer',
    timestamp: new Date().toISOString(),
    read: false,
    priority: 'medium'
  },
  {
    id: 2,
    type: 'company_verification',
    title: 'Company Verification Request',
    message: 'Microsoft requested profile verification',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    priority: 'high'
  }
];

export async function GET() {
  try {
    return Response.json({
      success: true,
      notifications: notifications,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/admin/notifications',
      context: {
        timestamp: new Date().toISOString()
      }
    });
  }
}

export async function POST(request: Request) {
  const { notificationId, action } = await request.json();
  
  try {
    if (action === 'mark_read') {
      return Response.json({
        success: true,
        message: 'Notification marked as read'
      });
    }
    
    return Response.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'POST /api/admin/notifications',
      context: {
        action,
        notificationId,
        timestamp: new Date().toISOString()
      }
    });
  }
}