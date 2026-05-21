/**
 * MSG91 Flow API v5 — SMS OTP delivery.
 * https://api.msg91.com/apidoc/textsms/send-sms-flow.php
 */

import { authDebug } from '@/lib/auth-debug';
import { MSG91_CONFIG, assertMsg91ProductionReady } from '@/lib/auth/msg91-config';

if (typeof window === 'undefined') {
  assertMsg91ProductionReady();
}

export interface Msg91SendResult {
  success: boolean;
  requestId?: string;
  error?: string;
  simulated?: boolean;
  rawResponse?: unknown;
}

type Msg91ResponseBody = {
  type?: string;
  message?: string;
  request_id?: string;
};

function buildFlowPayload(mobile10: string, otp: string): Record<string, unknown> {
  const flowId = MSG91_CONFIG.flowId;
  const useLegacy = process.env.MSG91_USE_LEGACY_BODY === 'true';

  if (useLegacy) {
    return {
      template_id: flowId,
      sender: MSG91_CONFIG.senderId,
      short_url: '0',
      mobiles: `91${mobile10}`,
      VAR1: otp,
    };
  }

  // Official v5 format — variables must be inside recipients[]
  return {
    flow_id: flowId,
    sender: MSG91_CONFIG.senderId,
    short_url: '0',
    recipients: [
      {
        mobiles: `91${mobile10}`,
        VAR1: otp,
      },
    ],
  };
}

function parseMsg91Success(body: Msg91ResponseBody, httpOk: boolean): { ok: boolean; requestId?: string; error?: string } {
  const type = (body.type || '').toLowerCase();
  const message = body.message || '';

  if (type === 'error') {
    return { ok: false, error: message || 'MSG91 rejected the request' };
  }

  if (type === 'success' && message) {
    return { ok: true, requestId: body.request_id || message };
  }

  // Some panels return 200 without type — treat non-error message as request id
  if (httpOk && message && type !== 'error') {
    return { ok: true, requestId: body.request_id || message };
  }

  if (!httpOk) {
    return { ok: false, error: message || `MSG91 HTTP error` };
  }

  return { ok: false, error: message || 'Unexpected MSG91 response' };
}

export async function sendOtpSms(mobile10: string, otp: string): Promise<Msg91SendResult> {
  const { authkey, flowId, senderId, apiUrl } = MSG91_CONFIG;

  if (!authkey || !flowId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[MSG91] Not configured — simulating SMS send', { mobile: mobile10.slice(-4) });
      authDebug('msg91', 'simulated send (missing config)', { mobileLast4: mobile10.slice(-4) });
      return { success: true, simulated: true, requestId: `dev-${Date.now()}` };
    }
    return { success: false, error: 'SMS service is not configured' };
  }

  const payload = buildFlowPayload(mobile10, otp);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        authkey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const body = (await response.json().catch(() => ({}))) as Msg91ResponseBody;
    const parsed = parseMsg91Success(body, response.ok);

    if (!parsed.ok) {
      console.error('[MSG91] Send rejected:', {
        status: response.status,
        body,
        payloadShape: 'recipients' in payload ? 'recipients' : 'legacy',
      });
      authDebug('msg91', 'send rejected', {
        status: response.status,
        type: body.type,
        message: body.message,
      });
      return {
        success: false,
        error: parsed.error || 'SMS delivery failed',
        rawResponse: body,
      };
    }

    authDebug('msg91', 'send success', {
      mobileLast4: mobile10.slice(-4),
      requestId: parsed.requestId,
    });

    return { success: true, requestId: parsed.requestId, rawResponse: body };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMS delivery failed';
    console.error('[MSG91] Network error:', message);
    authDebug('msg91', 'network error', { message });
    return { success: false, error: message };
  }
}

export function getMsg91Status(): { configured: boolean; sender?: string; flowId?: string } {
  return {
    configured: Boolean(MSG91_CONFIG.authkey && MSG91_CONFIG.flowId),
    sender: MSG91_CONFIG.senderId,
    flowId: MSG91_CONFIG.flowId ? '***configured***' : undefined,
  };
}
