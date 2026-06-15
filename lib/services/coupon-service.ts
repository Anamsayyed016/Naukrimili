/**
 * Coupon Service — validation, discount computation, and redemption.
 */
import { prisma } from '@/lib/prisma';
import {
  getListAmountPaise,
  getPlanType,
  type PlanKey,
} from '@/lib/services/razorpay-plans';

export const MIN_PAYABLE_PAISE = 100; // ₹1 minimum

export type DiscountType = 'percentage' | 'fixed';
export type PlanType = 'individual' | 'business';
export type DiscountScope = 'one_time' | 'all_cycles';

export interface CouponQuote {
  valid: true;
  couponId: string;
  code: string;
  name: string;
  planKey: PlanKey;
  planType: PlanType;
  discountScope: DiscountScope;
  discountType: DiscountType;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  applicablePlanNames: string[];
}

export interface CouponValidationError {
  valid: false;
  error: string;
}

export type CouponValidationResult = CouponQuote | CouponValidationError;

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function computeDiscountAmount(params: {
  discountType: DiscountType;
  discountValue: number;
  originalAmount: number;
  maxDiscountAmount?: number | null;
}): number {
  const { discountType, discountValue, originalAmount, maxDiscountAmount } = params;
  let discount = 0;

  if (discountType === 'percentage') {
    discount = Math.floor((originalAmount * discountValue) / 100);
    if (maxDiscountAmount != null && maxDiscountAmount > 0) {
      discount = Math.min(discount, maxDiscountAmount);
    }
  } else {
    discount = discountValue;
  }

  discount = Math.min(discount, originalAmount - MIN_PAYABLE_PAISE);
  discount = Math.max(0, discount);

  const finalAmount = originalAmount - discount;
  if (finalAmount < MIN_PAYABLE_PAISE) {
    return originalAmount - MIN_PAYABLE_PAISE;
  }
  return discount;
}

export function getDiscountScope(planType: PlanType): DiscountScope {
  return planType === 'business' ? 'all_cycles' : 'one_time';
}

function parseApplicablePlanKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((k): k is string => typeof k === 'string');
}

export async function validateCoupon(params: {
  code: string;
  planKey: string;
  userId?: string;
}): Promise<CouponValidationResult> {
  const normalizedCode = normalizeCouponCode(params.code);
  if (!normalizedCode) {
    return { valid: false, error: 'Coupon code is required' };
  }

  const planType = getPlanType(params.planKey);
  const originalAmount = getListAmountPaise(params.planKey);
  if (!planType || originalAmount == null) {
    return { valid: false, error: 'Invalid plan' };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  if (!coupon.isActive) {
    return { valid: false, error: 'This coupon is inactive' };
  }

  const now = new Date();
  if (now < coupon.validFrom) {
    return { valid: false, error: 'This coupon is not active yet' };
  }
  if (now > coupon.validUntil) {
    return { valid: false, error: 'This coupon has expired' };
  }

  const applicableKeys = parseApplicablePlanKeys(coupon.applicablePlanKeys);
  if (!applicableKeys.includes(params.planKey)) {
    return { valid: false, error: 'Coupon not valid for this plan' };
  }

  if (coupon.minOrderAmount != null && originalAmount < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum purchase of ₹${(coupon.minOrderAmount / 100).toFixed(0)} required`,
    };
  }

  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { valid: false, error: 'Coupon usage limit reached' };
  }

  if (params.userId && coupon.maxRedemptionsPerUser > 0) {
    const userRedemptions = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: params.userId },
    });
    if (userRedemptions >= coupon.maxRedemptionsPerUser) {
      return { valid: false, error: 'You have already used this coupon' };
    }
  }

  const discountAmount = computeDiscountAmount({
    discountType: coupon.discountType as DiscountType,
    discountValue: coupon.discountValue,
    originalAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
  });

  const finalAmount = originalAmount - discountAmount;
  if (finalAmount < MIN_PAYABLE_PAISE) {
    return { valid: false, error: 'Discount exceeds allowed limit' };
  }

  const { PLAN_DISPLAY_NAMES } = await import('@/lib/services/razorpay-plans');

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    name: coupon.name,
    planKey: params.planKey as PlanKey,
    planType,
    discountScope: getDiscountScope(planType),
    discountType: coupon.discountType as DiscountType,
    originalAmount,
    discountAmount,
    finalAmount,
    applicablePlanNames: applicableKeys.map((k) => PLAN_DISPLAY_NAMES[k as PlanKey] ?? k),
  };
}

export interface RedeemCouponParams {
  couponId: string;
  userId: string;
  paymentId: string;
  planType: PlanType;
  planKey: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  razorpayReference?: string;
}

/** Transactional redemption with row lock — idempotent per paymentId. */
export async function redeemCoupon(params: RedeemCouponParams): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.couponRedemption.findUnique({
      where: { paymentId: params.paymentId },
    });
    if (existing) return false;

    const coupons = await tx.$queryRaw<Array<{ id: string; redemptionCount: number; maxRedemptions: number | null }>>`
      SELECT id, "redemptionCount", "maxRedemptions" FROM "Coupon"
      WHERE id = ${params.couponId}
      FOR UPDATE
    `;
    const coupon = coupons[0];
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
      throw new Error('Coupon usage limit reached');
    }

    const updated = await tx.coupon.updateMany({
      where: {
        id: params.couponId,
        OR: [
          { maxRedemptions: null },
          { redemptionCount: { lt: coupon.maxRedemptions ?? 0 } },
        ],
      },
      data: { redemptionCount: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new Error('Coupon usage limit reached');
    }

    await tx.couponRedemption.create({
      data: {
        couponId: params.couponId,
        userId: params.userId,
        paymentId: params.paymentId,
        planType: params.planType,
        planKey: params.planKey,
        originalAmount: params.originalAmount,
        discountAmount: params.discountAmount,
        finalAmount: params.finalAmount,
        razorpayReference: params.razorpayReference,
      },
    });

    return true;
  });
}

export function assertPaymentAmountMatches(
  expectedPaise: number,
  actualPaise: number
): void {
  if (Number(actualPaise) !== Number(expectedPaise)) {
    throw new Error(
      `Payment amount mismatch: expected ${expectedPaise} paise, got ${actualPaise} paise`
    );
  }
}
