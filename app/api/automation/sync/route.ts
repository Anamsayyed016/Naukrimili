/**
 * Automation Sync API
 * Triggers manual synchronization of jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobAutomationSystem } from '@/lib/automation/job-automation-system';

export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 Manual sync triggered via API');
    
    const stats = await jobAutomationSystem.performFullSync();
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      data: {
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    
    if (source) {
      // Sync specific source
      const stats = await jobAutomationSystem.performFullSync();
      return NextResponse.json({
        success: true,
        message: `Sync completed for source: ${source}`,
        data: stats
      });
    } else {
      // Get sync status
      const status = await jobAutomationSystem.getStatus();
      return NextResponse.json({
        success: true,
        data: {
          isRunning: status.isRunning,
          lastSync: status.stats.lastSync,
          nextSync: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          sources: status.sources
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to get sync status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
