/**
 * POST /api/auth/send-otp
 * Send SMS OTP via MSG91 with rate limiting and duplicate prevention.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/nextauth-config';
import { checkRateLimit, getRateLimitHeaders, isRateLimited } from '@/lib/rate-limit';
import { sendOtp, getResendCooldown } from '@/lib/services/otp-service';
import { validateIndianMobile } from '@/lib/auth/phone-utils';

const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  purpose: z.enum(['login', 'register', 'signup', 'verify']).optional().default('login'),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, 'otp-send');
    if (isRateLimited(rateLimit)) {
      const waitSec = rateLimit.retryAfter ?? 60;
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMITED',
          message: `Too many OTP requests. Please wait ${waitSec} seconds.`,
          resendAfter: waitSec,
          retryAfter: waitSec,
        },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    const { phone, purpose } = parsed.data;

    const phoneCheck = validateIndianMobile(phone);
    if (!phoneCheck.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone', message: phoneCheck.error },
        { status: 400 }
      );
    }

    let userId: string | undefined;
    if (purpose === 'verify') {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized', message: 'Sign in required to verify phone.' },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await sendOtp({ phone, purpose, userId, ipAddress, userAgent });

    if (!result.success) {
      const status =
        result.code === 'COOLDOWN' || result.code === 'DUPLICATE_REQUEST'
          ? 429
          : result.code === 'PHONE_EXISTS' || result.code === 'USER_NOT_FOUND'
            ? 404
            : result.code === 'SMS_FAILED'
              ? 502
              : 400;

      return NextResponse.json(
        {
          success: false,
          error: result.code || 'SEND_FAILED',
          message: result.message,
          resendAfter: result.resendAfter,
        },
        { status, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: {
          otpId: result.otpId,
          expiresIn: result.expiresIn,
          resendAfter: result.resendAfter,
          maskedPhone: result.maskedPhone,
        },
      },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('[send-otp] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to send OTP. Please try again.',
      },
      { status: 500 }
    );
  }
}

/** GET cooldown remaining for a phone (used by frontend timer) */
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Phone required' }, { status: 400 });
  }

  const resendAfter = await getResendCooldown(phone);
  return NextResponse.json({ success: true, data: { resendAfter } });
}
