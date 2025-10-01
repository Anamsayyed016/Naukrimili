/**
 * Analytics Dashboard API
 * Provides dashboard metrics and real-time data for different user roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { analyticsProcessor } from '@/lib/analytics/analytics-processor';
import { realTimeDashboard } from '@/lib/analytics/real-time-dashboard';

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
    const dashboardType = searchParams.get('type') || 'default';
    const includeRealTime = searchParams.get('realtime') === 'true';

    // Get dashboard metrics
    const metrics = await analyticsProcessor.getDashboardMetrics(
      session.user.id,
      session.user.role || 'jobseeker'
    );

    // Get real-time data if requested
    let realTimeData = null;
    if (includeRealTime) {
      realTimeData = await analyticsProcessor.getRealTimeMetrics();
    }

    // Track dashboard view
    await realTimeDashboard.trackDashboardView(
      session.user.id,
      session.user.role || 'jobseeker',
      dashboardType
    );

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        realTime: realTimeData,
        user: {
          id: session.user.id,
          role: session.user.role,
          name: session.user.name
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'refresh_metrics':
        // Clear cache and refresh metrics
        analyticsProcessor.clearCache();
        const metrics = await analyticsProcessor.getDashboardMetrics(
          session.user.id,
          session.user.role || 'jobseeker'
        );
        
        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'get_activity_feed':
        const activityFeed = await realTimeDashboard.getActivityFeed(
          session.user.id,
          session.user.role || 'jobseeker',
          data?.limit || 20
        );
        
        return NextResponse.json({
          success: true,
          data: activityFeed
        });

      case 'get_system_health':
        if (session.user.role !== 'admin') {
          return NextResponse.json(
            { success: false, error: 'Admin access required' },
            { status: 403 }
          );
        }
        
        const systemHealth = await realTimeDashboard.getSystemHealth();
        
        return NextResponse.json({
          success: true,
          data: systemHealth
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('❌ Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
