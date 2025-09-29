/**
 * Phone Number Input Component
 * Handles phone number input with validation and OTP sending
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { OTPVerificationForm } from './OTPVerificationForm';

interface PhoneNumberInputProps {
  onSuccess?: (data: any) => void;
  onBack?: () => void;
  otpType?: 'login' | 'signup' | 'password_reset' | 'verification';
  purpose?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function PhoneNumberInput({
  onSuccess,
  onBack,
  otpType = 'login',
  purpose = 'verification',
  title = 'Enter Your Phone Number',
  description = 'We\'ll send you a verification code via WhatsApp',
  className = ''
}: PhoneNumberInputProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);

  // Handle phone number input change
  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters except + at the beginning
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure + is only at the beginning
    if (cleaned.includes('+') && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned.replace(/\+/g, '');
    }
    
    setPhoneNumber(cleaned);
    setError(null);
  };

  // Handle email input change
  const handleEmailChange = (value: string) => {
    setEmail(value);
  };

  // Validate phone number
  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      // Indian format: +91 98765 43210
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // Indian format with country code: +91 98765 43210
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      // Indian format with leading 0: +91 98765 43210
      return `+91 ${cleaned.slice(1, 6)} ${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  // Handle send OTP
  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (10-15 digits)');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          email: email || undefined,
          otpType,
          purpose
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpData(data.data);
        setOtpSent(true);
        setError(null);
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle OTP verification success
  const handleOTPSuccess = (data: any) => {
    if (onSuccess) {
      onSuccess({
        phoneNumber,
        email,
        otpData: data,
        otpType,
        purpose
      });
    }
  };

  // Handle resend OTP
  const handleResendOTP = () => {
    setOtpSent(false);
    setOtpData(null);
  };

  // Handle back button
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // If OTP has been sent, show verification form
  if (otpSent && otpData) {
    return (
      <OTPVerificationForm
        phoneNumber={phoneNumber}
        email={email}
        otpType={otpType}
        purpose={purpose}
        onSuccess={handleOTPSuccess}
        onBack={handleBack}
        onResend={handleResendOTP}
        className={className}
      />
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Phone className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+91 98765 43210"
              className="text-center"
              disabled={isSending}
              required
            />
            <p className="text-xs text-gray-500 text-center">
              Enter your phone number with country code
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="your@email.com"
              className="text-center"
              disabled={isSending}
            />
            <p className="text-xs text-gray-500 text-center">
              We'll also send verification to your email
            </p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSending || !validatePhoneNumber(phoneNumber)}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Send OTP via WhatsApp
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="w-full"
            disabled={isSending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>We'll send a 6-digit verification code to your WhatsApp</p>
          <p className="mt-1">
            {phoneNumber && validatePhoneNumber(phoneNumber) && (
              <span className="text-blue-600 font-medium">
                {formatPhoneNumber(phoneNumber)}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
