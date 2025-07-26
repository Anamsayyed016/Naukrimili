import { NextRequest, NextResponse } from 'next/server';
import { unifiedJobService } from '@/lib/unified-job-service';

export async function POST(request: NextRequest) {
  try {
    let beforeStats, afterStats;
    
    try {
      // Get cache stats before clearing
      beforeStats = unifiedJobService.getCacheStats();
      
      // Clear the cache
      unifiedJobService.clearCache();
      
      // Get cache stats after clearing
      afterStats = unifiedJobService.getCacheStats();
    } catch (serviceError) {
      return NextResponse.json({
        success: false,
        error: 'Service unavailable - cache clearing failed',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      before: beforeStats,
      after: afterStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    let stats;
    
    try {
      stats = unifiedJobService.getCacheStats();
    } catch (serviceError) {
      return NextResponse.json({
        success: false,
        error: 'Service unavailable',
        cache: { size: 0, keys: [], status: 'unavailable' },
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
