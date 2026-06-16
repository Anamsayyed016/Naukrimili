/**
 * GoAffPro conversion payload helpers (official loader.js order schema).
 * Click attribution remains in loader.js; this module builds order payloads only.
 */

/** Official goaffpro_order shape + optional fields used in this project. */
export interface GoAffProConversionPayload {
  number: string;
  total: number;
  email?: string;
  coupons?: string[];
}

export interface PaymentGoAffProMetadata {
  goaffproReported?: boolean;
  goaffproReportedAt?: string;
  goaffproReportMethod?: 'client';
  goaffproEligible?: boolean;
  goaffproOrderNumber?: string;
  goaffproTotal?: number;
}

export function logGoAffPro(
  event: 'referral found' | 'conversion sent' | 'conversion skipped' | 'conversion failed' | 'conversion success',
  details?: Record<string, unknown>
): void {
  const suffix = details ? ` ${JSON.stringify(details)}` : '';
  if (event === 'conversion failed') {
    console.warn(`[GOAFFPRO] ${event}${suffix}`);
  } else {
    console.log(`[GOAFFPRO] ${event}${suffix}`);
  }
}

export function parsePaymentGoAffProMetadata(metadata: unknown): PaymentGoAffProMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  return metadata as PaymentGoAffProMetadata;
}

export function isGoAffProReported(metadata: unknown): boolean {
  return Boolean(parsePaymentGoAffProMetadata(metadata).goaffproReported);
}

/** Preserve existing payment metadata when storing Razorpay capture details. */
export function mergePaymentCaptureMetadata(
  existing: unknown,
  razorpayPayment: Record<string, unknown>
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return {
    ...base,
    razorpay: razorpayPayment,
  };
}

export function buildGoAffProConversionPayload(input: {
  orderNumber: string;
  amountPaise: number;
  customerEmail?: string | null;
  couponCode?: string | null;
}): GoAffProConversionPayload | null {
  const total = input.amountPaise / 100;
  if (!input.orderNumber || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  const payload: GoAffProConversionPayload = {
    number: input.orderNumber,
    total,
  };

  if (input.customerEmail?.trim()) {
    payload.email = input.customerEmail.trim();
  }

  if (input.couponCode?.trim()) {
    payload.coupons = [input.couponCode.trim().toUpperCase()];
  }

  return payload;
}
