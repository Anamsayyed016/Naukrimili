/**
 * Debug Payment Configuration API
 * GET /api/debug/payment-config
 * 
 * Shows payment gateway configuration status
 * Available in both development and production for troubleshooting
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  // Detect if using test or live keys
  const isTestMode = keyId?.startsWith('rzp_test_');
  const isLiveMode = keyId?.startsWith('rzp_live_');
  const keyMode = isLiveMode ? 'LIVE' : (isTestMode ? 'TEST' : 'UNKNOWN');
  
  // Check if using fallback test keys from ecosystem.config.cjs
  const isUsingFallback = keyId === 'rzp_test_RmJIe9drDBjHeC';
  
  return NextResponse.json({
    razorpay: {
      keyIdConfigured: !!keyId,
      keySecretConfigured: !!keySecret,
      keyIdValue: keyId || 'NOT_SET',
      keyIdPrefix: keyId ? keyId.substring(0, 10) + '...' : 'NOT_SET',
      keyMode: keyMode, // 'LIVE', 'TEST', or 'UNKNOWN'
      isTestMode: isTestMode,
      isLiveMode: isLiveMode,
      isUsingFallback: isUsingFallback,
      warning: isUsingFallback 
        ? '⚠️ Using fallback test keys from ecosystem.config.cjs. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables with LIVE keys for production.'
        : (isTestMode 
          ? '⚠️ Using TEST keys. For production, use LIVE keys (rzp_live_...) from Razorpay dashboard.'
          : (isLiveMode 
            ? '✅ Using LIVE keys for production'
            : '❌ Invalid key format. Keys should start with rzp_test_ or rzp_live_')),
    },
    nodeEnv: process.env.NODE_ENV,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
    timestamp: new Date().toISOString(),
    message: isLiveMode 
      ? '✅ Payment gateway configured with LIVE keys'
      : '🔍 Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET. For production, use LIVE keys (rzp_live_...) from Razorpay dashboard.',
  });
}

