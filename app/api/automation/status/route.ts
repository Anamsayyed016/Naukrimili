/**
 * Automation System Status API
 * Provides status and control for the job automation system
 */

import { NextRequest, NextResponse } from 'next/server';
import { jobAutomationSystem } from '@/lib/automation/job-automation-system';

export async function GET(_request: NextRequest) {
  try {
    const status = await jobAutomationSystem.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        await jobAutomationSystem.start();
        return NextResponse.json({
          success: true,
          message: 'Automation system started'
        });

      case 'stop':
        await jobAutomationSystem.stop();
        return NextResponse.json({
          success: true,
          message: 'Automation system stopped'
        });

      case 'sync':
        const stats = await jobAutomationSystem.performFullSync();
        return NextResponse.json({
          success: true,
          message: 'Full sync completed',
          data: stats
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            details: 'Supported actions: start, stop, sync'
          },
          { status: 400 }
        );
    }
  } catch (_error) {
    console.error('❌ Failed to control automation system:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to control automation system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
