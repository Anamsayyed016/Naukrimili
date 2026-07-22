import type { CouponQuote } from '@/components/payments/CouponCheckoutBox';

export function getPayablePriceRupees(
  listPriceRupees: number,
  appliedQuote: CouponQuote | null | undefined
): number {
  if (appliedQuote && appliedQuote.discountPrice > 0) {
    return appliedQuote.finalPrice;
  }
  return listPriceRupees;
}

export function formatCouponRupee(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function mapValidateCouponResponse(
  data: Record<string, unknown>,
  expectedPlanKey: string
): { ok: true; quote: CouponQuote } | { ok: false; error: string } {
  if (data.valid !== true) {
    const message = typeof data.error === 'string' ? data.error : 'Invalid coupon';
    return { ok: false, error: message };
  }

  const originalPrice = Number(data.originalPrice);
  const discountPrice = Number(data.discountPrice);
  const finalPrice = Number(data.finalPrice);

  if (![originalPrice, discountPrice, finalPrice].every(Number.isFinite)) {
    return { ok: false, error: 'Invalid coupon quote received. Please try again.' };
  }

  const code = typeof data.code === 'string' ? data.code.trim() : '';
  if (!code) {
    return { ok: false, error: 'Invalid coupon code' };
  }

  const planKey =
    typeof data.planKey === 'string' && data.planKey.trim()
      ? data.planKey.trim()
      : expectedPlanKey;

  return {
    ok: true,
    quote: {
      code,
      name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : code,
      originalAmount:
        Number(data.originalAmount) || Math.round(originalPrice * 100),
      discountAmount:
        Number(data.discountAmount) || Math.round(discountPrice * 100),
      finalAmount: Number(data.finalAmount) || Math.round(finalPrice * 100),
      originalPrice,
      discountPrice,
      finalPrice,
      planKey,
    },
  };
}
