'use client';

/**
 * Fires official GoAffPro conversion tracking after verified payment.
 * Use from post-verify payment confirmation flows (e.g. FinalizeStep, pricing page).
 */

import {
  pollAndTrackBusinessSubscriptionConversion,
  trackGoAffProConversionFromVerifyResult,
  type GoAffProVerifyResult,
} from '@/lib/goaffpro';

/** Individual plan — after /api/payments/verify returns success + conversion payload. */
export async function triggerGoAffProConversionAfterVerify(
  result: GoAffProVerifyResult
): Promise<boolean> {
  return trackGoAffProConversionFromVerifyResult(result);
}

/** Business subscription — after webhook marks subscription active. */
export async function triggerGoAffProConversionAfterSubscription(
  subscriptionId: string
): Promise<boolean> {
  return pollAndTrackBusinessSubscriptionConversion(subscriptionId);
}
