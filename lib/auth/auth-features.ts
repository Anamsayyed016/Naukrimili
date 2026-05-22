/**
 * Central auth feature flags — toggle without removing OTP architecture.
 *
 * Set ENABLE_OTP_AUTH=true (server) and NEXT_PUBLIC_ENABLE_OTP_AUTH=true (client)
 * when DLT / MSG91 production OTP is ready.
 */

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/** Server-side: registration APIs, send-otp, verify-otp */
export function isOtpAuthEnabled(): boolean {
  return (
    isTruthyEnv(process.env.ENABLE_OTP_AUTH) ||
    isTruthyEnv(process.env.NEXT_PUBLIC_ENABLE_OTP_AUTH)
  );
}

/**
 * Client bundles — must match server intent via NEXT_PUBLIC_ENABLE_OTP_AUTH.
 * Inlined at build time; defaults to false when unset.
 */
export const OTP_AUTH_ENABLED_CLIENT = isTruthyEnv(process.env.NEXT_PUBLIC_ENABLE_OTP_AUTH);
