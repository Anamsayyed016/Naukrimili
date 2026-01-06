/**
 * Payment Gateway Debug Endpoint
 * GET /api/payments/debug
 * 
 * Returns diagnostic information about payment gateway configuration
 * (Only in development mode for security)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint not available in production' },
      { status: 403 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  const diagnostics = {
    environment: process.env.NODE_ENV,
    razorpay: {
      keyId: {
        set: !!keyId,
        prefix: keyId ? keyId.substring(0, 10) + '...' : null,
        length: keyId?.length || 0,
        mode: keyId?.startsWith('rzp_test_') ? 'TEST' : keyId?.startsWith('rzp_live_') ? 'LIVE' : 'UNKNOWN',
      },
      keySecret: {
        set: !!keySecret,
        length: keySecret?.length || 0,
      },
    },
    recommendations: [] as string[],
  };

  // Add recommendations
  if (!keyId) {
    diagnostics.recommendations.push('Set RAZORPAY_KEY_ID in environment variables');
  }
  if (!keySecret) {
    diagnostics.recommendations.push('Set RAZORPAY_KEY_SECRET in environment variables');
  }
  if (keyId && !keyId.startsWith('rzp_test_') && !keyId.startsWith('rzp_live_')) {
    diagnostics.recommendations.push('RAZORPAY_KEY_ID format is invalid (should start with rzp_test_ or rzp_live_)');
  }
  if (keyId && keyId.startsWith('rzp_test_') && process.env.NODE_ENV === 'production') {
    diagnostics.recommendations.push('Using TEST keys in production - switch to LIVE keys');
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

