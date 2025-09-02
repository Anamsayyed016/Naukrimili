/**
 * OTP Verification Component
 * Handles OTP input, verification, and resend functionality
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  purpose: 'login' | 'registration' | 'verification';
  userName?: string;
  onVerificationSuccess: (data: any) => void;
  onBack: () => void;
  onResend?: () => void;
}

export default function OTPVerification({
  email,
  purpose,
  userName,
  onVerificationSuccess,
  onBack,
  onResend
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    setError('');
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpString,
          purpose
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('OTP verified successfully!');
        setTimeout(() => {
          onVerificationSuccess(data);
        }, 1000);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          purpose,
          userName
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('New OTP sent successfully!');
        setTimeLeft(600); // Reset timer
        setCanResend(false);
        setOtp(['', '', '', '', '', '']); // Clear OTP inputs
        inputRefs.current[0]?.focus(); // Focus first input
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('OTP resend error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPurposeText = () => {
    switch (purpose) {
      case 'login':
        return 'login to your account';
      case 'registration':
        return 'complete your registration';
      case 'verification':
        return 'verify your email address';
      default:
        return 'verify your account';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to
          <br />
          <span className="font-medium text-gray-900">{email}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Enter the code to {getPurposeText()}
            </p>
          </div>

          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                disabled={isLoading}
              />
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              {timeLeft > 0 ? (
                <>
                  Code expires in{' '}
                  <span className="font-medium text-red-600">
                    {formatTime(timeLeft)}
                  </span>
                </>
              ) : (
                <span className="text-red-600 font-medium">
                  Code has expired
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
              disabled={isLoading}
            >
              Back
            </Button>

            <Button
              variant="outline"
              onClick={handleResend}
              disabled={!canResend || isResending || isLoading}
              className="flex-1"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the code? Check your spam folder or{' '}
            <button
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
            >
              request a new one
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
