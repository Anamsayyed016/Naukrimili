/**
 * MSG91 Flow API — SMS OTP delivery.
 * Docs: https://docs.msg91.com/
 */

import { authDebug } from '@/lib/auth-debug';
import { isMsg91Configured } from '@/lib/auth/otp-config';

export interface Msg91SendResult {
  success: boolean;
  requestId?: string;
  error?: string;
  simulated?: boolean;
}

export async function sendOtpSms(mobile10: string, otp: string): Promise<Msg91SendResult> {
  const authkey = process.env.MSG91_AUTHKEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const sender = process.env.MSG91_SENDER_ID || 'India';

  if (!authkey || !templateId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[MSG91] Not configured — simulating SMS send', { mobile: mobile10.slice(-4) });
      authDebug('msg91', 'simulated send (missing config)', { mobileLast4: mobile10.slice(-4) });
      return { success: true, simulated: true, requestId: `dev-${Date.now()}` };
    }
    return { success: false, error: 'SMS service is not configured' };
  }

  const url = process.env.MSG91_API_URL || 'https://control.msg91.com/api/v5/flow/';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authkey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        sender,
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
    configured: isMsg91Configured(),
    sender: process.env.MSG91_SENDER_ID,
  };
}
