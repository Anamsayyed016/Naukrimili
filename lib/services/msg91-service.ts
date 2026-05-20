/**
 * MSG91 Flow API — SMS OTP delivery.
 * Docs: https://docs.msg91.com/
 */

import { authDebug } from '@/lib/auth-debug';
import { MSG91_CONFIG, assertMsg91ProductionReady } from '@/lib/auth/msg91-config';
import { isOtpEnabled } from '@/lib/auth/otp-config';

if (typeof window === 'undefined') {
  assertMsg91ProductionReady();
}

export interface Msg91SendResult {
  success: boolean;
  requestId?: string;
  error?: string;
  simulated?: boolean;
}

export async function sendOtpSms(mobile10: string, otp: string): Promise<Msg91SendResult> {
  const { authkey, templateId, senderId, apiUrl } = MSG91_CONFIG;

  if (!authkey || !templateId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[MSG91] Not configured — simulating SMS send', { mobile: mobile10.slice(-4) });
      authDebug('msg91', 'simulated send (missing config)', { mobileLast4: mobile10.slice(-4) });
      return { success: true, simulated: true, requestId: `dev-${Date.now()}` };
    }
    return { success: false, error: 'SMS service is not configured' };
  }

  const url = apiUrl;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authkey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        sender: senderId,
        short_url: '0',
        mobiles: `91${mobile10}`,
        VAR1: otp,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (body as { message?: string }).message ||
        (body as { type?: string }).type ||
        `MSG91 HTTP ${response.status}`;
      console.error('[MSG91] Send failed:', message, body);
      authDebug('msg91', 'send failed', { status: response.status, message });
      return { success: false, error: message };
    }

    const requestId =
      (body as { request_id?: string }).request_id ||
      (body as { message?: string }).message ||
      String(Date.now());

    authDebug('msg91', 'send success', { mobileLast4: mobile10.slice(-4), requestId });
    return { success: true, requestId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMS delivery failed';
    console.error('[MSG91] Network error:', message);
    authDebug('msg91', 'network error', { message });
    return { success: false, error: message };
  }
}

export function getMsg91Status(): { configured: boolean; sender?: string } {
  return {
    configured: Boolean(MSG91_CONFIG.authkey && MSG91_CONFIG.templateId),
    sender: MSG91_CONFIG.senderId,
  };
}
