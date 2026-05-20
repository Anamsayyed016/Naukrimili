/**
 * POST /api/auth/verify-otp
 * Verify SMS OTP and return a one-time session token for NextAuth sign-in.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getRateLimitHeaders, isRateLimited } from '@/lib/rate-limit';
import { verifyOtp } from '@/lib/services/otp-service';

const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  otp: z.string().min(4, 'OTP is required').max(8, 'Invalid OTP'),
  purpose: z.enum(['login', 'register', 'verify']).optional().default('login'),
  name: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(request, 'auth');
    if (isRateLimited(rateLimit)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: 'Too many verification attempts. Please wait.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

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

    const { phone, otp, purpose, name } = parsed.data;

    const result = await verifyOtp({ phone, otp, purpose, name });

    if (!result.success) {
      const status =
        result.code === 'MAX_ATTEMPTS' ? 429 : result.code === 'OTP_EXPIRED' ? 410 : 400;

      return NextResponse.json(
        {
          success: false,
          error: result.code || 'VERIFY_FAILED',
          message: result.message,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        data: {
          sessionToken: result.sessionToken,
          isNewUser: result.isNewUser,
          userId: result.userId,
        },
      },
      { status: 200, headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error('[verify-otp] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Verification failed. Please try again.',
      },
      { status: 500 }
    );
  }
}
