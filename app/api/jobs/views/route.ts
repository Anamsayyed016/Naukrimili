import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
import { trackJobView, getUserJobViews } from '@/lib/jobs/job-view-tracker';

/**
 * POST /api/jobs/views
 * Track a job view
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Login required to track views' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const clientUserAgent = request.headers.get('user-agent') || 'unknown';

    // Track the job view
    await trackJobView({
      userId: session.user.id,
      jobId: jobId,
      ipAddress: clientIP,
      userAgent: clientUserAgent
    });

    return NextResponse.json({
      success: true,
      message: 'Job view tracked successfully'
    });

  } catch (error: any) {
    console.error('❌ Error tracking job view:', error);
    return NextResponse.json(
      { error: 'Failed to track job view', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/views
 * Get user's job view history
 */
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = (searchParams.get('orderBy') || 'recent') as 'recent' | 'oldest';

    // Get user's job views
    const result = await getUserJobViews(session.user.id, {
      limit,
      offset,
      orderBy
    });

    return NextResponse.json({
      success: true,
      data: {
        views: result.views,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: offset + limit < result.total
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching job views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job views', details: error.message },
      { status: 500 }
    );
  }
}
