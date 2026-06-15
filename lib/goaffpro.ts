/**
 * GoAffPro affiliate conversion tracking — client-side only.
 * Loader is injected globally in app/layout.tsx when enabled.
 */

import {
  logGoAffPro,
  type GoAffProConversionPayload,
} from '@/lib/goaffpro-conversion';

declare global {
  interface Window {
    goaffpro_order?: GoAffProConversionPayload;
    goaffproTrackConversion?: (order: GoAffProConversionPayload) => void;
  }
}

export type GoAffProOrder = GoAffProConversionPayload;

export interface GoAffProVerifyResult {
  success?: boolean;
  alreadyProcessed?: boolean;
  paymentId?: string;
  conversion?: GoAffProConversionPayload;
}

const SESSION_PREFIX = 'goaffpro:converted:';
const LOCAL_PREFIX = 'goaffpro:lock:';
const MAX_LOADER_RETRIES = 12;
const LOADER_RETRY_MS = 500;

/** Default affiliate landing path — Resume Builder entry (not homepage). */
export const GOAFFPRO_AFFILIATE_LANDING_PATH = '/resume-builder/start';

/** Build affiliate landing URL for sharing (GoAffPro dashboard or docs). */
export function getGoAffProAffiliateLandingUrl(refCode?: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://naukrimili.com').replace(/\/$/, '');
  const path = GOAFFPRO_AFFILIATE_LANDING_PATH;
  if (refCode?.trim()) {
    return `${base}${path}?ref=${encodeURIComponent(refCode.trim())}`;
  }
  return `${base}${path}`;
}

export function isGoAffProEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOAFFPRO_ENABLED === 'true';
}

/** GoAffPro affiliate registration URL (env override or shop subdomain default). */
export function getGoAffProRegisterUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_GOAFFPRO_REGISTER_URL?.trim();
  if (explicit) return explicit;
  const shopId = process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID?.trim();
  if (shopId) return `https://${shopId}.goaffpro.com/create-account`;
  return '';
}

/** GoAffPro affiliate dashboard / portal login URL. */
export function getGoAffProDashboardUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_GOAFFPRO_DASHBOARD_URL?.trim();
  if (explicit) return explicit;
  const shopId = process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID?.trim();
  if (shopId) return `https://${shopId}.goaffpro.com/`;
  return '';
}

function storageKey(prefix: string, orderNumber: string): string {
  return `${prefix}${orderNumber}`;
}

function isConversionAlreadyTracked(orderNumber: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return (
      Boolean(sessionStorage.getItem(storageKey(SESSION_PREFIX, orderNumber))) ||
      Boolean(localStorage.getItem(storageKey(LOCAL_PREFIX, orderNumber)))
    );
  } catch {
    return false;
  }
}

function markConversionTracked(orderNumber: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(SESSION_PREFIX, orderNumber), '1');
    localStorage.setItem(storageKey(LOCAL_PREFIX, orderNumber), String(Date.now()));
  } catch {
    // Storage blocked — server ack remains source of truth
  }
}

function fireGoAffProConversion(order: GoAffProConversionPayload): boolean {
  if (typeof window.goaffproTrackConversion !== 'function') {
    return false;
  }
  window.goaffpro_order = order;
  window.goaffproTrackConversion(order);
  logGoAffPro('conversion sent', {
    orderNumber: order.number,
    total: order.total,
    currency: order.currency,
  });
  return true;
}

async function ackGoAffProConversion(paymentId: string): Promise<void> {
  try {
    await fetch('/api/payments/goaffpro-ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paymentId }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ack request failed';
    logGoAffPro('conversion failed', { stage: 'ack', paymentId, error: message });
  }
}

/** Fire GoAffPro conversion with retries; marks local dedup only after SDK accepts. */
export function trackGoAffProConversionAsync(
  order: GoAffProConversionPayload,
  paymentId?: string
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (!isGoAffProEnabled()) {
      logGoAffPro('conversion skipped', { reason: 'disabled' });
      resolve(false);
      return;
    }
    if (!order?.number || !Number.isFinite(order.total) || order.total <= 0) {
      logGoAffPro('conversion skipped', { reason: 'invalid payload' });
      resolve(false);
      return;
    }
    if (isConversionAlreadyTracked(order.number)) {
      logGoAffPro('conversion skipped', { reason: 'duplicate-client', orderNumber: order.number });
      resolve(false);
      return;
    }

    const attemptFire = (attempt: number) => {
      if (fireGoAffProConversion(order)) {
        markConversionTracked(order.number);
        logGoAffPro('conversion success', { orderNumber: order.number, attempt });
        if (paymentId) {
          void ackGoAffProConversion(paymentId);
        }
        resolve(true);
        return;
      }
      if (attempt >= MAX_LOADER_RETRIES) {
        logGoAffPro('conversion failed', {
          reason: 'loader not ready',
          orderNumber: order.number,
          attempts: attempt,
        });
        resolve(false);
        return;
      }
      window.setTimeout(() => attemptFire(attempt + 1), LOADER_RETRY_MS);
    };

    attemptFire(0);
  });
}

/** @deprecated Prefer trackGoAffProConversionAsync — sync wrapper without ack. */
export function trackGoAffProConversion(order: GoAffProConversionPayload): boolean {
  void trackGoAffProConversionAsync(order);
  return true;
}

/** Track only after verified payment; server omits payload when already reported. */
export async function trackGoAffProConversionFromVerifyResult(
  result: GoAffProVerifyResult
): Promise<boolean> {
  if (!result.success || !result.conversion) {
    logGoAffPro('conversion skipped', {
      reason: 'no verify payload',
      alreadyProcessed: result.alreadyProcessed,
    });
    return false;
  }
  return trackGoAffProConversionAsync(result.conversion, result.paymentId);
}

/** Poll until webhook confirms business subscription, then track conversion once. */
export async function pollAndTrackBusinessSubscriptionConversion(
  subscriptionId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isGoAffProEnabled() || !subscriptionId) return false;

  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `/api/payments/status?subscriptionConversion=${encodeURIComponent(subscriptionId)}`,
        { credentials: 'include', cache: 'no-store' }
      );

      if (!response.ok) {
        await sleep(intervalMs);
        continue;
      }

      const data = (await response.json()) as {
        ready?: boolean;
        alreadyReported?: boolean;
        paymentId?: string;
        conversion?: GoAffProConversionPayload;
      };

      if (data.alreadyReported) {
        logGoAffPro('conversion skipped', { reason: 'duplicate-server', subscriptionId });
        return false;
      }
      if (data.ready && data.conversion) {
        logGoAffPro('referral found', { subscriptionId, attempt });
        return trackGoAffProConversionAsync(data.conversion, data.paymentId);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Poll error';
      logGoAffPro('conversion failed', { stage: 'poll', subscriptionId, error: message });
    }

    await sleep(intervalMs);
  }

  logGoAffPro('conversion failed', { reason: 'poll timeout', subscriptionId });
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
