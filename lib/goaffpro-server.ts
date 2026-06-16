/**
 * Server-side GoAffPro sale reporting.
 * Uses the same endpoint as loader.js: POST https://api2.goaffpro.com/order_complete
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  logGoAffPro,
  parsePaymentGoAffProMetadata,
  type GoAffProConversionPayload,
} from '@/lib/goaffpro-conversion';

const ORDER_COMPLETE_URL = 'https://api2.goaffpro.com/order_complete';

function isGoAffProServerEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_GOAFFPRO_ENABLED === 'true' &&
    Boolean(process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID?.trim())
  );
}

function getShopId(): string {
  return process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID?.trim() || '';
}

function readCookie(request: NextRequest, name: string): string | null {
  const value = request.cookies.get(name)?.value?.trim();
  return value || null;
}

/** Read affiliate ref from GoAffPro cookies set by loader.js. */
export function readGoAffProRefFromRequest(request: NextRequest): string | null {
  return readCookie(request, 'ref') || readCookie(request, 'gfp_ref');
}

/** Read visit id cookie set by loader.js trackVisit. */
export function readGoAffProVisitIdFromRequest(request: NextRequest): string | null {
  return readCookie(request, 'gfp_v_id');
}

async function mergePaymentMetadata(
  paymentId: string,
  patch: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { metadata: true },
  });

  const existing =
    payment?.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
      ? { ...(payment.metadata as Record<string, unknown>) }
      : {};

  const merged = { ...existing, ...patch };

  await prisma.payment.update({
    where: { id: paymentId },
    data: { metadata: merged },
  });

  return merged;
}

/** Persist affiliate ref / visit id from checkout request into payment metadata. */
export async function captureGoAffProRefForPayment(
  paymentId: string,
  request: NextRequest
): Promise<void> {
  if (!isGoAffProServerEnabled()) return;

  const ref = readGoAffProRefFromRequest(request);
  const visitId = readGoAffProVisitIdFromRequest(request);
  if (!ref && !visitId) return;

  const patch: Record<string, unknown> = {};
  if (ref) patch.goaffproRef = ref;
  if (visitId) patch.goaffproVisitId = visitId;

  await mergePaymentMetadata(paymentId, patch);

  logGoAffPro('referral found', { paymentId, ref: ref || undefined, visitId: visitId || undefined });
}

interface OrderCompleteData {
  number: string;
  total: number;
  forceSDK: boolean;
  email?: string;
  currency: string;
  status: string;
  coupons?: string[];
}

interface OrderCompletePayload {
  sub_id: string | null;
  ref: string | null;
  shop: string;
  location: string;
  navigator: string;
  referrer: string;
  discount_code: string | null;
  order_id: string;
  visit_id: string | null;
  data: OrderCompleteData;
}

function buildOrderCompletePayload(input: {
  orderNumber: string;
  total: number;
  email?: string | null;
  couponCode?: string | null;
  affiliateRef?: string | null;
  visitId?: string | null;
  location?: string;
}): OrderCompletePayload {
  const data: OrderCompleteData = {
    number: input.orderNumber,
    total: input.total,
    forceSDK: true,
    currency: 'INR',
    status: 'approved',
  };

  if (input.email?.trim()) {
    data.email = input.email.trim();
  }
  if (input.couponCode?.trim()) {
    data.coupons = [input.couponCode.trim().toUpperCase()];
  }

  return {
    sub_id: null,
    ref: input.affiliateRef?.trim() || null,
    shop: getShopId(),
    location: input.location || 'https://naukrimili.com',
    navigator: 'naukrimili-server/1.0',
    referrer: '',
    discount_code: input.couponCode?.trim().toUpperCase() || null,
    order_id: input.orderNumber,
    visit_id: input.visitId?.trim() || null,
    data,
  };
}

export interface ReportGoAffProSaleResult {
  reported: boolean;
  alreadyReported: boolean;
  conversion?: GoAffProConversionPayload;
}

/**
 * Report a captured payment to GoAffPro (idempotent via metadata.goaffproReported).
 * Primary server path — matches loader.js order_complete contract.
 */
export async function reportGoAffProSaleForPayment(
  paymentId: string,
  orderNumber: string,
  options?: {
    affiliateRef?: string | null;
    visitId?: string | null;
    location?: string;
  }
): Promise<ReportGoAffProSaleResult> {
  if (!isGoAffProServerEnabled()) {
    return { reported: false, alreadyReported: false };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: { select: { email: true } },
    },
  });

  if (!payment || payment.status !== 'captured') {
    return { reported: false, alreadyReported: false };
  }

  const meta = parsePaymentGoAffProMetadata(payment.metadata);
  if (meta.goaffproReported) {
    logGoAffPro('conversion skipped', { reason: 'duplicate-server', paymentId, orderNumber });
    return { reported: false, alreadyReported: true };
  }

  const total = payment.amount / 100;
  if (!orderNumber || !Number.isFinite(total) || total <= 0) {
    logGoAffPro('conversion skipped', { reason: 'invalid-amount', paymentId, orderNumber });
    return { reported: false, alreadyReported: false };
  }

  let couponCode: string | null = null;
  if (payment.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: payment.couponId },
      select: { code: true },
    });
    couponCode = coupon?.code ?? null;
  }

  const affiliateRef = options?.affiliateRef?.trim() || meta.goaffproRef?.trim() || null;
  const visitId =
    options?.visitId?.trim() ||
    (typeof meta.goaffproVisitId === 'string' ? meta.goaffproVisitId : null) ||
    null;

  const payload = buildOrderCompletePayload({
    orderNumber,
    total,
    email: payment.user?.email,
    couponCode,
    affiliateRef,
    visitId,
    location: options?.location,
  });

  logGoAffPro('conversion sent', {
    paymentId,
    orderNumber,
    ref: affiliateRef || undefined,
    total,
    coupon: couponCode || undefined,
  });

  try {
    const response = await fetch(ORDER_COMPLETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify(payload),
    });

    const bodyText = await response.text();

    if (!response.ok) {
      logGoAffPro('conversion failed', {
        paymentId,
        orderNumber,
        status: response.status,
        body: bodyText.slice(0, 200),
      });
      return { reported: false, alreadyReported: false };
    }

    await mergePaymentMetadata(paymentId, {
      goaffproReported: true,
      goaffproReportedAt: new Date().toISOString(),
      goaffproReportMethod: 'order_complete',
      goaffproOrderNumber: orderNumber,
      goaffproTotal: total,
      ...(affiliateRef ? { goaffproRef: affiliateRef } : {}),
      ...(visitId ? { goaffproVisitId: visitId } : {}),
    });

    logGoAffPro('conversion success', {
      paymentId,
      orderNumber,
      method: 'order_complete',
      response: bodyText.slice(0, 50),
    });

    const conversion: GoAffProConversionPayload = {
      number: orderNumber,
      total,
      ...(payment.user?.email ? { email: payment.user.email } : {}),
      ...(couponCode ? { coupons: [couponCode.toUpperCase()] } : {}),
    };

    return { reported: true, alreadyReported: false, conversion };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'order_complete request failed';
    logGoAffPro('conversion failed', { paymentId, orderNumber, error: message });
    return { reported: false, alreadyReported: false };
  }
}
