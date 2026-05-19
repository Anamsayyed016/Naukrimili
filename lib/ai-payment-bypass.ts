/**
 * Opt-in bypass for AI credit/plan checks only (resume optimization, AI enhance).
 * Auth/session is unchanged. Download/PDF paywall is unchanged.
 *
 * Set on server .env for dev/staging:
 *   BYPASS_AI_PAYMENT_CHECKS=true
 *   or ENABLE_AI_DEV_MODE=true
 *
 * Never enable in production unless intentionally testing billing.
 */

function flagEnabled(name: string): boolean {
  const v = process.env[name];
  return v === 'true' || v === '1';
}

export function isAiPaymentBypassEnabled(): boolean {
  return flagEnabled('BYPASS_AI_PAYMENT_CHECKS') || flagEnabled('ENABLE_AI_DEV_MODE');
}

export function isAiResumePaymentAction(
  action: 'download' | 'aiResume' | 'aiCoverLetter'
): action is 'aiResume' | 'aiCoverLetter' {
  return action === 'aiResume' || action === 'aiCoverLetter';
}

export function logAiPaymentBypassIfActive(action: string): void {
  if (!isAiPaymentBypassEnabled()) return;
  const env = process.env.NODE_ENV ?? 'unknown';
  console.warn(
    `[AI Payment Bypass] Skipping plan/credit checks for "${action}" (NODE_ENV=${env}). ` +
      'Unset BYPASS_AI_PAYMENT_CHECKS and ENABLE_AI_DEV_MODE before monetized launch.'
  );
}
