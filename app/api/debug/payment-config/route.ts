/**
 * Debug Payment Configuration API
 * GET /api/debug/payment-config
 * 
 * Shows payment gateway configuration status
 * ONLY AVAILABLE IN DEVELOPMENT
 */

import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    razorpay: {
      keyIdConfigured: !!process.env.RAZORPAY_KEY_ID,
      keySecretConfigured: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdValue: process.env.RAZORPAY_KEY_ID || 'NOT_SET',
      keyIdPrefix: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 10) + '...' : 'NOT_SET',
    },
    nodeEnv: process.env.NODE_ENV,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    timestamp: new Date().toISOString(),
    message: '🔍 Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env.local file',
  });
}

