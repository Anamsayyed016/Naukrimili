/**
 * Start Automation System API
 * Initializes and starts the job automation system
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobAutomationSystem } from '@/lib/automation/job-automation-system';

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Starting automation system via API...');
    
    // Start the automation system
    await jobAutomationSystem.start();
    
    // Get initial status
    const status = await jobAutomationSystem.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Automation system started successfully',
      data: {
        isRunning: status.isRunning,
        stats: status.stats,
        sources: status.sources,
        timestamp: new Date().toISOString()
      }
    });
  } catch (_error) {
    console.error('❌ Failed to start automation system:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start automation system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const status = await jobAutomationSystem.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        isRunning: status.isRunning,
        canStart: !status.isRunning,
        stats: status.stats,
        sources: status.sources,
        timestamp: new Date().toISOString()
      }
    });
  } catch (_error) {
    console.error('❌ Failed to get automation status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get automation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

