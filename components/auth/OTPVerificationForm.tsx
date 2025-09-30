/**
 * OTP Verification Form Component
 * Handles OTP input and verification
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, ArrowLeft, RefreshCw, CheckCircle, XCircle, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OTPVerificationFormProps {
  phoneNumber: string;
  email?: string;
  otpType?: 'login' | 'signup' | 'password_reset' | 'verification';
  purpose?: string;
  onSuccess?: (data: any) => void;
  onBack?: () => void;
  onResend?: () => void;
  autoFocus?: boolean;
  className?: string;
  expiresAt?: Date;
}

export function OTPVerificationForm({
  phoneNumber,
  email,
  otpType = 'login',
  purpose = 'verification',
  onSuccess,
  onBack,
  onResend,
  autoFocus = true,
  className = '',
  expiresAt: propExpiresAt
}: OTPVerificationFormProps) {
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(propExpiresAt || null);

  // Debug logging
  console.log('OTPVerificationForm - propExpiresAt:', propExpiresAt);
  console.log('OTPVerificationForm - expiresAt state:', expiresAt);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const maskPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      const last4 = cleaned.slice(-4);
      return `+${cleaned.slice(0, -4).replace(/\d/g, '*')}${last4}`;
    }
    return phone;
  };

  const handleOTPChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(digits);
    setError('');
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otpCode,
          otpType
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('OTP verified successfully!');
        if (onSuccess) {
          onSuccess(data.data);
        }
      } else {
        setError(data.message || 'OTP verification failed');
        if (data.data?.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.data.attemptsRemaining);
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          email,
          otpType,
          purpose
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('New OTP sent successfully!');
        setCountdown(60); // Reset countdown
        setAttemptsRemaining(3); // Reset attempts
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // If verification was successful, show success message
  if (success && onSuccess) {
    return (
      <Card className={`w-full max-w-md mx-auto shadow-2xl border-0 rounded-3xl overflow-hidden modern-card ${className}`}>
        <CardContent className="px-8 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Successful!</h3>
          <p className="text-gray-600 mb-6">Your phone number has been verified successfully.</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto shadow-2xl border-0 rounded-3xl overflow-hidden modern-card ${className}`}>
      <CardHeader className="text-center pb-8 pt-8 px-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold font-heading text-gray-900 mb-2">Verify Your Phone Number</CardTitle>
        <CardDescription className="text-gray-600 text-base">
          We've sent a 6-digit verification code to
          <br />
          <span className="font-medium text-gray-900">
            {maskPhoneNumber(phoneNumber)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="otp" className="text-sm font-semibold text-gray-700">Enter Verification Code</Label>
            <Input
              ref={inputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otpCode}
              onChange={(e) => handleOTPChange(e.target.value)}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono h-16 rounded-xl border-2 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
              maxLength={6}
              disabled={isVerifying}
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {attemptsRemaining !== null && attemptsRemaining < 3 && (
                  <span className="block mt-1 text-sm">
                    {attemptsRemaining} attempts remaining
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="btn-primary w-full h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-green-600 hover:bg-green-700"
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Verifying...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Verify OTP
              </div>
            )}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            {countdown > 0 ? (
              <span>Resend OTP in {countdown}s</span>
            ) : (
              <span>Didn't receive the code?</span>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleResendOTP}
            disabled={isResending || countdown > 0}
            className="w-full h-12 text-base font-medium border-2 border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700 hover:text-green-800 transition-all duration-200 rounded-xl"
          >
            {isResending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                Sending...
              </div>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend OTP
              </>
            )}
          </Button>

          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-800 transition-all duration-200 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {expiresAt && expiresAt instanceof Date && !isNaN(expiresAt.getTime()) && (
          <div className="text-center text-xs text-gray-500">
            OTP expires at {expiresAt.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
