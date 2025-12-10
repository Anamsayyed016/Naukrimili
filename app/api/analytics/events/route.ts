/**
 * Analytics Events API
 * Handles analytics event collection and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { eventCollector } from '@/lib/analytics/event-collector';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    
    const {
      eventType,
      entityType,
      entityId,
      metadata = {},
      ipAddress,
      userAgent
    } = body;

    if (!eventType) {
      return NextResponse.json(
        { success: false, error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Collect the event
    await eventCollector.collectEvent({
      userId: session?.user?.id,
      userRole: session?.user?.role,
      eventType,
      entityType,
      entityId,
      metadata,
      ipAddress: ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: userAgent || request.headers.get('user-agent'),
      sessionId: session?.user?.id // Use user ID as session ID for simplicity
    });

    return NextResponse.json({
      success: true,
      message: 'Event collected successfully'
    });

  } catch (error: unknown) {
    console.error('❌ Analytics Events API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect event',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') as 'hour' | 'day' | 'week' || 'day';
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get event statistics
    const stats = await eventCollector.getEventStats(timeRange);

    // Filter by event type if specified
    if (eventType && stats.eventsByType[eventType]) {
      stats.eventsByType = { [eventType]: stats.eventsByType[eventType] };
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        timeRange,
        eventType,
        limit,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: unknown) {
    console.error('❌ Analytics Events API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch event statistics',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
