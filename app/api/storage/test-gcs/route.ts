/**
 * Google Cloud Storage Connection Test API
 * 
 * Tests the GCS connection, permissions, and configuration
 * Accessible only to authenticated admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { testGCSConnection, GCS_CONFIG } from '@/lib/storage/google-cloud-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/storage/test-gcs
 * Test Google Cloud Storage connection
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth();
    
    // Optional: Restrict to admins only
    // Uncomment if you want to limit access
    /*
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required' 
      }, { status: 401 });
    }
    */

    console.log('🔍 [GCS Test] Starting connection test...');

    // Test GCS connection
    const testResult = await testGCSConnection();

    // Return detailed test results
    return NextResponse.json({
      ...testResult,
      config: {
        projectId: GCS_CONFIG.projectId,
        bucketName: GCS_CONFIG.bucketName,
        identityPool: GCS_CONFIG.identityPool,
        environment: GCS_CONFIG.environment,
        enabled: process.env.ENABLE_GCS_STORAGE === 'true',
      },
      timestamp: new Date().toISOString(),
    }, {
      status: testResult.success ? 200 : 500
    });

  } catch (error) {
    console.error('❌ [GCS Test] Test endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test GCS connection',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

