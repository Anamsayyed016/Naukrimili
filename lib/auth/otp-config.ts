/**
 * OTP configuration — sourced from environment with safe defaults.
 */

export const OTP_CONFIG = {
  length: parseInt(process.env.OTP_LENGTH || '6', 10),
  expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
  resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
  sendLockSeconds: parseInt(process.env.OTP_SEND_LOCK_SECONDS || '10', 10),
  sessionTokenTtlSeconds: parseInt(process.env.OTP_SESSION_TOKEN_TTL_SECONDS || '120', 10),
} as const;

export function getOtpExpirySeconds(): number {
  return OTP_CONFIG.expiryMinutes * 60;
}

export function isOtpEnabled(): boolean {
  return process.env.OTP_ENABLED !== 'false';
}

export function isMsg91Configured(): boolean {
  return Boolean(process.env.MSG91_AUTHKEY && process.env.MSG91_TEMPLATE_ID);
}
