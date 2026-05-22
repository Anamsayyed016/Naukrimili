/**
 * OTP configuration — sourced from environment with safe defaults.
 */

export { isMsg91Configured } from '@/lib/auth/msg91-config';

export const OTP_CONFIG = {
  length: parseInt(process.env.OTP_LENGTH || '6', 10),
  expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
  resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
  sendLockSeconds: parseInt(process.env.OTP_SEND_LOCK_SECONDS || '10', 10),
  sessionTokenTtlSeconds: parseInt(process.env.OTP_SESSION_TOKEN_TTL_SECONDS || '120', 10),
  phoneVerificationTokenTtlSeconds: parseInt(process.env.OTP_PHONE_VERIFY_TOKEN_TTL_SECONDS || '900', 10),
} as const;

export function getOtpExpirySeconds(): number {
  return OTP_CONFIG.expiryMinutes * 60;
}

import { isOtpAuthEnabled } from '@/lib/auth/auth-features';

/** @deprecated Prefer isOtpAuthEnabled from auth-features */
export function isOtpEnabled(): boolean {
  if (process.env.OTP_ENABLED === 'false') return false;
  return isOtpAuthEnabled();
}

export function isRedisRequiredForOtp(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.REDIS_ENABLED !== 'false';
}
