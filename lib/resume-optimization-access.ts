/**
 * Resume Builder — AI Optimization panel access (scoped free tier).
 *
 * Does NOT disable global billing, PDF export paywall, or ai-enhance credits.
 * Only the POST /api/resume-builder/optimize flow uses this module by default.
 *
 * Set RESUME_OPTIMIZATION_FREE_ACCESS=false to require plan/credits for optimization again.
 */

import { checkResumeAccess } from '@/lib/middleware/payment-middleware';
import { isAiPaymentBypassEnabled } from '@/lib/ai-payment-bypass';

export type ResumeOptimizationAccessResult = {
  allowed: boolean;
  reason?: string;
  freeTier?: boolean;
  daysRemaining?: number;
  creditsRemaining?: number;
};

/**
 * Free tier for the editor optimization panel (on by default for onboarding).
 * Opt out with RESUME_OPTIMIZATION_FREE_ACCESS=false when monetizing this feature.
 */
export function isResumeOptimizationFreeAccessEnabled(): boolean {
  if (process.env.RESUME_OPTIMIZATION_FREE_ACCESS === 'false') {
    return false;
  }
  return true;
}

/** Whether to increment aiResume usage counters after a successful optimize call */
export function shouldBillResumeOptimizationUsage(access: ResumeOptimizationAccessResult): boolean {
  if (!access.allowed) return false;
  if (access.freeTier) return false;
  if (isAiPaymentBypassEnabled()) return false;
  return true;
}

/**
 * Access check used only by /api/resume-builder/optimize.
 * Paid plans and business subscriptions still work when free tier is off.
 */
export async function checkResumeOptimizationPanelAccess(
  userId: string
): Promise<ResumeOptimizationAccessResult> {
  if (isResumeOptimizationFreeAccessEnabled()) {
    return { allowed: true, freeTier: true };
  }

  const paid = await checkResumeAccess(userId, 'aiResume');
  return {
    allowed: paid.allowed,
    reason: paid.reason,
    daysRemaining: paid.daysRemaining,
    creditsRemaining: paid.creditsRemaining,
  };
}
