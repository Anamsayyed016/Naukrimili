/**
 * Phone Number Input Component
 * Handles phone number input with validation and OTP sending
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, ArrowLeft, XCircle, MessageSquare, Mail } from 'lucide-react';
import { OTPVerificationForm } from './OTPVerificationForm';

interface PhoneNumberInputProps {
  onSuccess?: (data: Record<string, unknown>) => void;
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
  description = 'We&apos;ll send you a verification code via WhatsApp',
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
    } catch (error: unknown) {
      console.error('Send OTP error:', error);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle OTP verification success
  const handleOTPSuccess = (data: Record<string, unknown>) => {
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
        expiresAt={otpData?.expiresAt ? new Date(otpData.expiresAt) : undefined}
      />
    );
  }

  return (
    <Card className={`w-full max-w-md mx-auto shadow-2xl border-0 rounded-3xl overflow-hidden modern-card ${className}`}>
      <CardHeader className="text-center pb-8 pt-8 px-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg">
          <MessageSquare className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold font-heading text-gray-900 mb-2">{title}</CardTitle>
        <CardDescription className="text-gray-600 text-base">{description}</CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
              Phone Number *
            </Label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+91 98765 43210"
                className="auth-input pl-12 h-14 text-base rounded-xl border-2 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                disabled={isSending}
                required
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Enter your phone number with country code
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email (Optional)
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="your@email.com"
                className="auth-input pl-12 h-14 text-base rounded-xl border-2 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300"
                disabled={isSending}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              We&apos;ll also send verification to your email
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
            className="btn-primary w-full h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-green-600 hover:bg-green-700"
            disabled={isSending || !validatePhoneNumber(phoneNumber)}
          >
            {isSending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Sending OTP...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Send OTP via WhatsApp
              </div>
            )}
          </Button>
        </form>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="w-full h-12 text-base font-medium border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-800 transition-all duration-200 rounded-xl"
            disabled={isSending}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>We&apos;ll send a 6-digit verification code to your WhatsApp</p>
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
