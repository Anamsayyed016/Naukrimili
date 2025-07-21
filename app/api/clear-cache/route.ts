import { NextRequest, NextResponse } from 'next/server';
import { unifiedJobService } from '@/lib/unified-job-service';

export async function POST(request: NextRequest) {
  try {
    // Get cache stats before clearing
    const beforeStats = unifiedJobService.getCacheStats();
    
    // Clear the cache
    unifiedJobService.clearCache();
    
    // Get cache stats after clearing
    const afterStats = unifiedJobService.getCacheStats();
    
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
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = unifiedJobService.getCacheStats();
    
    return NextResponse.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
