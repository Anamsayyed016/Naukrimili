/**
 * Shared GoAffPro conversion payload helpers (server + client safe).
 * Click attribution remains in loader.js; this module builds order payloads only.
 */

export interface GoAffProConversionCustomer {
  first_name?: string;
  last_name?: string;
  email?: string;
}

/** Extended order schema compatible with GoAffPro custom SDK integration. */
export interface GoAffProConversionPayload {
  number: string;
  total: number;
  id?: string;
  currency?: string;
  forceSDK?: boolean;
  customer?: GoAffProConversionCustomer;
  coupons?: string[];
  status?: string;
}

export interface PaymentGoAffProMetadata {
  goaffproReported?: boolean;
  goaffproReportedAt?: string;
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

export function splitCustomerName(fullName?: string | null): {
  first_name?: string;
  last_name?: string;
} {
  if (!fullName?.trim()) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0] };
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  };
}

export function buildGoAffProConversionPayload(input: {
  orderNumber: string;
  paymentId: string;
  amountPaise: number;
  currency?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  couponCode?: string | null;
  planName?: string | null;
}): GoAffProConversionPayload | null {
  const total = input.amountPaise / 100;
  if (!input.orderNumber || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  const nameParts = splitCustomerName(input.customerName);
  const payload: GoAffProConversionPayload = {
    id: input.paymentId,
    number: input.orderNumber,
    total,
    currency: input.currency || 'INR',
    forceSDK: true,
    status: 'approved',
    customer: {
      ...nameParts,
      ...(input.customerEmail ? { email: input.customerEmail } : {}),
    },
  };

  if (input.couponCode?.trim()) {
    payload.coupons = [input.couponCode.trim().toUpperCase()];
  }

  return payload;
}
