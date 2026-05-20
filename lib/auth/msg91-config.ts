/**
 * Centralized MSG91 configuration — env vars only, no hardcoded secrets.
 */

export const MSG91_CONFIG = {
  authkey: process.env.MSG91_AUTHKEY || '',
  templateId: process.env.MSG91_TEMPLATE_ID || '',
  senderId: process.env.MSG91_SENDER_ID || 'India',
  apiUrl: process.env.MSG91_API_URL || 'https://control.msg91.com/api/v5/flow/',
} as const;

export function isMsg91Configured(): boolean {
  return Boolean(MSG91_CONFIG.authkey && MSG91_CONFIG.templateId);
}

export function assertMsg91ProductionReady(): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.OTP_ENABLED === 'false') return;

  if (!isMsg91Configured()) {
    console.error('[MSG91] Production OTP enabled but MSG91_AUTHKEY or MSG91_TEMPLATE_ID is missing');
  }
}
