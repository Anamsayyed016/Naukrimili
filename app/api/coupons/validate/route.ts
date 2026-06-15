/**
 * POST /api/coupons/validate
 * Validate a coupon for a plan (no side effects).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { validateCoupon } from '@/lib/services/coupon-service';
import { PLAN_DISPLAY_NAMES } from '@/lib/services/razorpay-plans';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { couponCode, planKey } = body;

    if (!couponCode || !planKey) {
      return NextResponse.json(
        { valid: false, error: 'Coupon code and plan are required' },
        { status: 400 }
      );
    }

    const result = await validateCoupon({
      code: couponCode,
      planKey,
      userId: session.user.id,
    });

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      couponId: result.couponId,
      code: result.code,
      name: result.name,
      planKey: result.planKey,
      planType: result.planType,
      discountScope: result.discountScope,
      discountType: result.discountType,
      originalAmount: result.originalAmount,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      originalPrice: result.originalAmount / 100,
      discountPrice: result.discountAmount / 100,
      finalPrice: result.finalAmount / 100,
      planDisplayName: PLAN_DISPLAY_NAMES[result.planKey],
      applicablePlanNames: result.applicablePlanNames,
      quoteExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Validation failed';
    console.error('❌ [Coupon Validate]', message);
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
