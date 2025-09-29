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
import { Loader2, Phone, ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
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
  className = ''
}: OTPVerificationFormProps) {
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [otpId, setOtpId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  // Start countdown when component mounts
  useEffect(() => {
    setCountdown(60); // 1 minute countdown
  }, []);

  // Handle OTP input change
  const handleOTPChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(numericValue);
    setError(null);

    // Auto-submit when 6 digits are entered
    if (numericValue.length === 6) {
      handleVerifyOTP(numericValue);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (code?: string) => {
    const codeToVerify = code || otpCode;
    
    if (codeToVerify.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otpCode: codeToVerify,
          otpType,
          purpose
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setOtpId(data.data.otpId);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(data.data);
        } else {
          // Default success behavior
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        setError(data.message || 'Invalid OTP');
        setAttemptsRemaining(data.data?.attemptsRemaining || null);
        
        // Clear OTP on error
        setOtpCode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) {
      setError(`Please wait ${countdown} seconds before requesting another OTP`);
      return;
    }

    setIsResending(true);
    setError(null);

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
        setOtpId(data.data.otpId);
        setExpiresAt(new Date(data.data.expiresAt));
        setCountdown(60); // Reset countdown
        setError(null);
        
        // Call resend callback
        if (onResend) {
          onResend();
        }
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Mask phone number for display
  const maskPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      const last4 = cleaned.slice(-4);
      return `+${cleaned.slice(0, -4).replace(/\d/g, '*')}${last4}`;
    }
    return phone;
  };

  if (success) {
    return (
      <Card className={`w-full max-w-md mx-auto ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              OTP Verified Successfully!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Your phone number has been verified.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-2">
              Redirecting...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Phone className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Verify Your Phone Number</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to
          <br />
          <span className="font-medium text-gray-900">
            {maskPhoneNumber(phoneNumber)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter Verification Code</Label>
            <Input
              ref={inputRef}
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otpCode}
              onChange={(e) => handleOTPChange(e.target.value)}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={6}
              disabled={isVerifying}
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {attemptsRemaining !== null && (
                  <span className="block mt-1 text-sm">
                    {attemptsRemaining} attempts remaining
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
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
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend OTP
              </>
            )}
          </Button>

          {onBack && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {expiresAt && (
          <div className="text-center text-xs text-gray-500">
            OTP expires at {expiresAt.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
