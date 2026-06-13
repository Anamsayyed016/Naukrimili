/**
 * GoAffPro affiliate conversion tracking — client-side only.
 * Loader is injected globally in app/layout.tsx when enabled.
 */

declare global {
  interface Window {
    goaffpro_order?: { number: string; total: number };
    goaffproTrackConversion?: (order: { number: string; total: number }) => void;
  }
}

export interface GoAffProOrder {
  number: string;
  total: number;
}

export interface GoAffProVerifyResult {
  success?: boolean;
  alreadyProcessed?: boolean;
  conversion?: GoAffProOrder;
}

const SESSION_PREFIX = 'goaffpro:converted:';
const LOCAL_PREFIX = 'goaffpro:lock:';
const MAX_LOADER_RETRIES = 12;
const LOADER_RETRY_MS = 500;

export function isGoAffProEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOAFFPRO_ENABLED === 'true';
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
    // Storage blocked — in-memory dedup still applies per page load via sessionStorage failure path
  }
}

function fireGoAffProConversion(order: GoAffProOrder): boolean {
  if (typeof window.goaffproTrackConversion !== 'function') {
    return false;
  }
  window.goaffpro_order = order;
  window.goaffproTrackConversion(order);
  console.log('[GoAffPro] Conversion tracked:', order.number);
  return true;
}

function scheduleConversionRetry(order: GoAffProOrder, attempt = 0): void {
  if (attempt >= MAX_LOADER_RETRIES) {
    console.warn('[GoAffPro] Loader not ready — conversion skipped after retries:', order.number);
    return;
  }
  window.setTimeout(() => {
    if (fireGoAffProConversion(order)) return;
    scheduleConversionRetry(order, attempt + 1);
  }, LOADER_RETRY_MS);
}

/** Fire GoAffPro conversion once per payment (refresh-safe, multi-tab safe). */
export function trackGoAffProConversion(order: GoAffProOrder): boolean {
  if (typeof window === 'undefined') return false;
  if (!isGoAffProEnabled()) return false;
  if (!order?.number || !Number.isFinite(order.total) || order.total <= 0) return false;
  if (isConversionAlreadyTracked(order.number)) return false;

  markConversionTracked(order.number);

  if (fireGoAffProConversion(order)) {
    return true;
  }

  scheduleConversionRetry(order);
  return true;
}

/** Track only on first verified capture (respects alreadyProcessed from verify API). */
export function trackGoAffProConversionFromVerifyResult(result: GoAffProVerifyResult): boolean {
  if (!result.success || result.alreadyProcessed || !result.conversion) {
    return false;
  }
  return trackGoAffProConversion(result.conversion);
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
        conversion?: GoAffProOrder;
      };

      if (data.alreadyReported) return false;
      if (data.ready && data.conversion) {
        return trackGoAffProConversion(data.conversion);
      }
    } catch (error) {
      console.warn('[GoAffPro] Subscription conversion poll error:', error);
    }

    await sleep(intervalMs);
  }

  console.warn('[GoAffPro] Subscription conversion poll timed out:', subscriptionId);
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
