/**
 * GET /api/auth/otp-debug — MSG91 config + direct send test (production diagnostics).
 * Disabled unless AUTH_DEBUG=true or OTP_DEBUG=true.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMsg91Status, sendOtpSms } from '@/lib/services/msg91-service';
import { isRedisAvailable } from '@/lib/redis';
import { isMsg91Configured } from '@/lib/auth/msg91-config';

export async function GET(request: NextRequest) {
  const debugEnabled =
    process.env.AUTH_DEBUG === 'true' || process.env.OTP_DEBUG === 'true';

  if (!debugEnabled) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const phone = request.nextUrl.searchParams.get('phone');
  const testSend = request.nextUrl.searchParams.get('send') === '1';

  const redisOk = await isRedisAvailable();

  if (!testSend || !phone) {
    return NextResponse.json({
      success: true,
      msg91: getMsg91Status(),
      msg91Configured: isMsg91Configured(),
      redis: redisOk,
      hint: 'Add ?phone=10digit&send=1 to test MSG91 (AUTH_DEBUG or OTP_DEBUG must be true)',
    });
  }

  const result = await sendOtpSms(phone.replace(/\D/g, '').slice(-10), '000000');

  return NextResponse.json({
    success: result.success,
    msg91: getMsg91Status(),
    redis: redisOk,
    result,
  });
}
