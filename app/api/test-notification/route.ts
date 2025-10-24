import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

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
    const { type = 'TEST', title, message } = body;

    const notification = await createNotification({
      userId: session.user.id,
      type: type as any,
      title: title || 'Test Notification',
      message: message || 'This is a test notification to verify the system is working correctly.',
      data: {
        testId: Date.now(),
        timestamp: new Date().toISOString(),
        source: 'test-api'
      }
    });

    console.log(`✅ Test notification created for user ${session.user.id}: ${notification.title}`);

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Test notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
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

    // Create a simple test notification
    const notification = await createNotification({
      userId: session.user.id,
      type: 'SYSTEM',
      title: '🔔 Test Notification',
      message: `Hello ${session.user.name || 'User'}! This is a test notification sent at ${new Date().toLocaleString()}.`,
      data: {
        testId: Date.now(),
        timestamp: new Date().toISOString(),
        source: 'test-api-get'
      }
    });

    console.log(`✅ Test notification created via GET for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Test notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
