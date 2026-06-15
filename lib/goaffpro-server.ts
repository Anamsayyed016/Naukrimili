/**
 * Server-side GoAffPro conversion reporting (order_complete + optional API fallbacks).
 * Click/cookie attribution is set by loader.js; this records completed sales after payment capture.
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildGoAffProConversionPayload,
  isGoAffProReported,
  logGoAffPro,
  parsePaymentGoAffProMetadata,
  type GoAffProConversionPayload,
} from '@/lib/goaffpro-conversion';

export const GOAFFPRO_REF_COOKIE = 'ref';

export function isGoAffProServerEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_GOAFFPRO_ENABLED === 'true' &&
    Boolean(process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID?.trim())
  );
}

export function getGoAffProShopId(): string | null {
  return process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID?.trim() || null;
}

/** Read GoAffPro affiliate referral code from the browser cookie set by loader.js. */
export function readGoAffProRefFromRequest(request: NextRequest): string | null {
  const ref = request.cookies.get(GOAFFPRO_REF_COOKIE)?.value?.trim();
  return ref || null;
}

export function mergePaymentCaptureMetadata(
  existing: unknown,
  razorpayPayment: Record<string, unknown>,
  goaffproFields: Record<string, unknown> = {}
): Record<string, unknown> {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return {
    ...base,
    razorpay: razorpayPayment,
    ...goaffproFields,
  };
}

/** Persist affiliate ref from checkout request so webhook paths can report without browser cookies. */
export async function captureGoAffProRefForPayment(
  paymentId: string,
  request: NextRequest
): Promise<void> {
  if (!isGoAffProServerEnabled()) return;

  const ref = readGoAffProRefFromRequest(request);
  if (!ref) return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { metadata: true },
  });
  if (!payment) return;

  const meta = parsePaymentGoAffProMetadata(payment.metadata);
  if (meta.goaffproRef === ref) return;

  const existing =
    payment.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : {};

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      metadata: {
        ...existing,
        goaffproRef: ref,
      },
    },
  });

  logGoAffPro('referral found', { stage: 'checkout', paymentId, ref });
}

async function postOrderComplete(body: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch('https://api.goaffpro.com/order_complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    if (!response.ok) {
      logGoAffPro('conversion failed', {
        stage: 'order_complete',
        status: response.status,
        body: responseText.slice(0, 300),
      });
      return false;
    }

    logGoAffPro('conversion sent', {
      stage: 'order_complete',
      orderId: body.order_id,
      ref: body.ref,
    });
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'order_complete request failed';
    logGoAffPro('conversion failed', { stage: 'order_complete', error: message });
    return false;
  }
}

async function postSdkTrackConversion(payload: GoAffProConversionPayload): Promise<boolean> {
  const token = process.env.GOAFFPRO_PUBLIC_TOKEN?.trim();
  if (!token) return false;

  const body: Record<string, unknown> = {
    number: payload.number,
    total_price: payload.total,
    currency: payload.currency || 'INR',
    status: payload.status || 'approved',
  };
  if (payload.id) body.id = payload.id;
  if (payload.customer?.email) body.email = payload.customer.email;
  if (payload.coupons?.length) body.coupons = payload.coupons;

  try {
    const response = await fetch('https://api.goaffpro.com/v1/sdk/track/conversion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goaffpro-public-token': token,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    if (!response.ok) {
      logGoAffPro('conversion failed', {
        stage: 'sdk',
        status: response.status,
        body: responseText.slice(0, 300),
      });
      return false;
    }

    logGoAffPro('conversion sent', { stage: 'sdk', orderNumber: payload.number });
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'sdk track failed';
    logGoAffPro('conversion failed', { stage: 'sdk', error: message });
    return false;
  }
}

async function postAdminOrder(input: {
  orderNumber: string;
  total: number;
  email?: string | null;
  couponCode?: string | null;
  affiliateRef?: string | null;
}): Promise<boolean> {
  const token = process.env.GOAFFPRO_ACCESS_TOKEN?.trim();
  if (!token) return false;

  const body: Record<string, unknown> = {
    number: input.orderNumber,
    total: input.total,
    status: 'approved',
  };
  if (input.email) body.email = input.email;
  if (input.couponCode) body.coupons = [input.couponCode];
  if (input.affiliateRef) body.ref = input.affiliateRef;

  try {
    const response = await fetch('https://api.goaffpro.com/v1/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goaffpro-access-token': token,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    if (!response.ok) {
      logGoAffPro('conversion failed', {
        stage: 'admin',
        status: response.status,
        body: responseText.slice(0, 300),
      });
      return false;
    }

    logGoAffPro('conversion sent', { stage: 'admin', orderNumber: input.orderNumber });
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'admin order failed';
    logGoAffPro('conversion failed', { stage: 'admin', error: message });
    return false;
  }
}

async function markGoAffProReported(
  paymentId: string,
  method: 'order_complete' | 'sdk' | 'admin',
  extra: Record<string, unknown> = {}
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { metadata: true },
  });
  const existing =
    payment?.metadata && typeof payment.metadata === 'object' && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : {};

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      metadata: {
        ...existing,
        ...extra,
        goaffproReported: true,
        goaffproReportedAt: new Date().toISOString(),
        goaffproReportMethod: method,
      },
    },
  });
}

export interface ReportGoAffProSaleInput {
  paymentId: string;
  orderNumber: string;
  amountPaise: number;
  currency?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  couponCode?: string | null;
  affiliateRef?: string | null;
}

/**
 * Report a captured payment sale to GoAffPro (server-side).
 * Idempotent — skips when payment.metadata.goaffproReported is already true.
 */
export async function reportGoAffProSaleServer(
  input: ReportGoAffProSaleInput
): Promise<{ reported: boolean; alreadyReported: boolean }> {
  if (!isGoAffProServerEnabled()) {
    return { reported: false, alreadyReported: false };
  }

  const shop = getGoAffProShopId();
  if (!shop) {
    return { reported: false, alreadyReported: false };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    select: { metadata: true, status: true },
  });

  if (!payment || payment.status !== 'captured') {
    return { reported: false, alreadyReported: false };
  }

  const meta = parsePaymentGoAffProMetadata(payment.metadata);
  if (isGoAffProReported(meta)) {
    return { reported: false, alreadyReported: true };
  }

  const affiliateRef = input.affiliateRef || meta.goaffproRef || null;
  const total = input.amountPaise / 100;
  const conversion = buildGoAffProConversionPayload({
    orderNumber: input.orderNumber,
    paymentId: input.paymentId,
    amountPaise: input.amountPaise,
    currency: input.currency,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    couponCode: input.couponCode,
  });

  let reported = false;
  let method: 'order_complete' | 'sdk' | 'admin' | null = null;

  if (affiliateRef) {
    const orderCompleteOk = await postOrderComplete({
      ref: affiliateRef,
      shop,
      order_id: input.orderNumber,
      email: input.customerEmail || undefined,
      total,
      ...(input.couponCode ? { coupon: input.couponCode } : {}),
    });
    if (orderCompleteOk) {
      reported = true;
      method = 'order_complete';
    }
  }

  if (!reported && conversion) {
    const sdkOk = await postSdkTrackConversion(conversion);
    if (sdkOk) {
      reported = true;
      method = 'sdk';
    }
  }

  if (!reported) {
    const adminOk = await postAdminOrder({
      orderNumber: input.orderNumber,
      total,
      email: input.customerEmail,
      couponCode: input.couponCode,
      affiliateRef,
    });
    if (adminOk) {
      reported = true;
      method = 'admin';
    }
  }

  if (reported && method) {
    await markGoAffProReported(input.paymentId, method, {
      goaffproRef: affiliateRef || undefined,
      goaffproOrderNumber: input.orderNumber,
      goaffproTotal: total,
      goaffproEligible: true,
    });
    logGoAffPro('conversion success', {
      paymentId: input.paymentId,
      orderNumber: input.orderNumber,
      method,
      ref: affiliateRef || undefined,
      coupon: input.couponCode || undefined,
      email: input.customerEmail || undefined,
      total,
    });
    return { reported: true, alreadyReported: false };
  }

  if (!affiliateRef && !process.env.GOAFFPRO_PUBLIC_TOKEN && !process.env.GOAFFPRO_ACCESS_TOKEN) {
    logGoAffPro('conversion skipped', {
      reason: 'no server path (missing ref and API tokens)',
      paymentId: input.paymentId,
    });
  } else if (affiliateRef) {
    logGoAffPro('conversion failed', {
      reason: 'all server methods failed',
      paymentId: input.paymentId,
      ref: affiliateRef,
    });
  }

  return { reported: false, alreadyReported: false };
}

/** Load user/coupon context and report sale — used from verify/webhook/status routes. */
export async function reportGoAffProSaleForPayment(
  paymentId: string,
  orderNumber: string,
  options?: { affiliateRef?: string | null; userId?: string }
): Promise<{ reported: boolean; alreadyReported: boolean }> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: { select: { email: true, name: true } },
      coupon: { select: { code: true } },
    },
  });

  if (!payment) {
    return { reported: false, alreadyReported: false };
  }

  const meta = parsePaymentGoAffProMetadata(payment.metadata);
  let customerEmail = payment.user?.email ?? null;
  let customerName = payment.user?.name ?? null;

  if (options?.userId && !customerEmail) {
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      select: { email: true, name: true },
    });
    customerEmail = user?.email ?? null;
    customerName = user?.name ?? null;
  }

  return reportGoAffProSaleServer({
    paymentId,
    orderNumber,
    amountPaise: payment.amount,
    currency: payment.currency,
    customerEmail,
    customerName,
    couponCode: payment.coupon?.code ?? null,
    affiliateRef: options?.affiliateRef ?? meta.goaffproRef ?? null,
  });
}
