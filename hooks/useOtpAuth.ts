'use client';

import { useCallback, useRef, useState } from 'react';

export type OtpPurpose = 'login' | 'register' | 'verify';

interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    otpId?: string;
    expiresIn?: number;
    resendAfter?: number;
    maskedPhone?: string;
  };
  resendAfter?: number;
}

interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    sessionToken?: string;
    isNewUser?: boolean;
    userId?: string;
  };
  attemptsRemaining?: number;
}

export function useOtpAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendAfter, setResendAfter] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const sendOtp = useCallback(
    async (phone: string, purpose: OtpPurpose = 'login', name?: string): Promise<SendOtpResponse | null> => {
      if (inFlightRef.current) return null;
      inFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, purpose, ...(name ? { name } : {}) }),
        });

        const data: SendOtpResponse = await res.json();

        if (!data.success) {
          setError(data.message || data.error || 'Failed to send OTP');
          if (data.resendAfter) setResendAfter(data.resendAfter);
          return data;
        }

        setResendAfter(data.data?.resendAfter ?? 60);
        setMaskedPhone(data.data?.maskedPhone ?? null);
        return data;
      } catch {
        setError('Network error. Please try again.');
        return null;
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    []
  );

  const verifyOtp = useCallback(
    async (
      phone: string,
      otp: string,
      purpose: OtpPurpose = 'login',
      name?: string
    ): Promise<VerifyOtpResponse | null> => {
      if (inFlightRef.current) return null;
      inFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp, purpose, ...(name ? { name } : {}) }),
        });

        const data: VerifyOtpResponse = await res.json();

        if (!data.success) {
          setError(data.message || data.error || 'Verification failed');
          return data;
        }

        return data;
      } catch {
        setError('Network error. Please try again.');
        return null;
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    resendAfter,
    setResendAfter,
    maskedPhone,
    sendOtp,
    verifyOtp,
    clearError,
  };
}
