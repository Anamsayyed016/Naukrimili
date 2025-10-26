import { NextRequest, NextResponse } from 'next/server';
import { dailyScheduler } from '@/lib/jobs/daily-scheduler';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual job sync triggered');
    
    // Check for admin authentication (you can implement your own auth logic)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.ADMIN_SYNC_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the daily sync
    const result = await dailyScheduler.runDailySync();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Job sync completed successfully',
        stats: result.stats
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Job sync failed',
        stats: result.stats
      }, { status: 500 });
    }

  } catch (_error) {
    console.error('❌ Job sync API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get current job statistics
    const stats = await dailyScheduler.getStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (_error) {
    console.error('❌ Job stats API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch job statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
