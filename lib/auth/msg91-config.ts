/**
 * Centralized MSG91 configuration — env vars only, no hardcoded secrets.
 */

export const MSG91_CONFIG = {
  authkey: process.env.MSG91_AUTHKEY || '',
  /** Flow / template ID from MSG91 SMS → Templates (alias: MSG91_TEMPLATE_ID) */
  flowId: process.env.MSG91_FLOW_ID || process.env.MSG91_TEMPLATE_ID || '',
  /** DLT-approved 6-char header (e.g. NAUKRM). Must match template + DLT portal — not a brand label like "India". */
  senderId: process.env.MSG91_SENDER_ID || '',
  /** Must match MSG91 template variable name (e.g. ##OTP## → OTP, not VAR1). */
  otpVarName: process.env.MSG91_OTP_VAR || 'OTP',
  apiUrl: process.env.MSG91_API_URL || 'https://control.msg91.com/api/v5/flow/',
} as const;

export function isMsg91Configured(): boolean {
  return Boolean(MSG91_CONFIG.authkey && MSG91_CONFIG.flowId);
}

export function assertMsg91ProductionReady(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.OTP_ENABLED === 'false') return;

  if (!isMsg91Configured()) {
    console.error('[MSG91] Production OTP enabled but MSG91_AUTHKEY or MSG91_FLOW_ID/MSG91_TEMPLATE_ID is missing');
  }

  const sender = MSG91_CONFIG.senderId.trim();
  if (!sender || sender.toLowerCase() === 'india') {
    console.error(
      '[MSG91] Set MSG91_SENDER_ID to your DLT-approved 6-character Header ID (from DLT portal / MSG91 template), not a display name.'
    );
  }
}
