'use client';

/**
 * Fires official GoAffPro conversion tracking after verified payment.
 * Use only from payment confirmation flows (e.g. FinalizeStep), never at checkout init.
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
