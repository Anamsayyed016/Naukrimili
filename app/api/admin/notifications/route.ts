import { NextResponse } from 'next/server';

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
  return NextResponse.json({
    success: true,
    notifications: notifications,
    unreadCount: notifications.filter(n => !n.read).length
  });
}

export async function POST(request: Request) {
  const { notificationId, action } = await request.json();
  
  if (action === 'mark_read') {
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });
  }
  
  return NextResponse.json(
    { success: false, message: 'Invalid action' },
    { status: 400 }
  );
}