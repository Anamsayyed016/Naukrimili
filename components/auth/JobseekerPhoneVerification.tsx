'use client';

import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import PhoneNumberInput from '@/components/auth/PhoneNumberInput';
import OTPVerificationForm, { OTPResendButton } from '@/components/auth/OTPVerificationForm';
import { useOtpAuth } from '@/hooks/useOtpAuth';
import { validateIndianMobile } from '@/lib/auth/phone-utils';

interface JobseekerPhoneVerificationProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  onVerified: (token: string, phone: string) => void;
  verified?: boolean;
  disabled?: boolean;
}

type Step = 'phone' | 'otp';

export default function JobseekerPhoneVerification({
  phone,
  onPhoneChange,
  onVerified,
  verified = false,
  disabled,
}: JobseekerPhoneVerificationProps) {
  const [step, setStep] = useState<Step>('phone');
  const [localError, setLocalError] = useState<string | null>(null);

  const { loading, error, resendAfter, setResendAfter, maskedPhone, sendOtp, verifyOtp, clearError } =
    useOtpAuth();

  const handleSendOtp = useCallback(async () => {
    setLocalError(null);
    clearError();

    const check = validateIndianMobile(phone);
    if (!check.valid) {
      setLocalError(check.error || 'Enter a valid mobile number');
      return;
    }

    const result = await sendOtp(phone, 'signup');
    if (result?.success) {
      setStep('otp');
    }
  }, [phone, sendOtp, clearError]);

  const handleVerify = useCallback(
    async (otp: string) => {
      clearError();
      const result = await verifyOtp(phone, otp, 'signup');
      if (result?.success && result.data?.phoneVerificationToken) {
        onVerified(result.data.phoneVerificationToken, phone);
        setStep('phone');
      }
    },
    [phone, verifyOtp, clearError, onVerified]
  );

  const handleResend = useCallback(async () => {
    const result = await sendOtp(phone, 'signup');
    if (result?.data?.resendAfter) {
      setResendAfter(result.data.resendAfter);
    }
  }, [phone, sendOtp, setResendAfter]);

  if (verified) {
    return (
      <div className="auth-otp-card border-green-200 bg-green-50/90 p-4 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-900">Mobile verified</p>
          <p className="text-xs text-green-700">+91 {phone}</p>
        </div>
        <Badge className="ml-auto bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
      </div>
    );
  }

  return (
    <div className="auth-otp-card space-y-3">
      <p className="text-sm font-medium text-gray-900">Verify your mobile number</p>
      <p className="text-xs text-gray-600">Required for secure account access and OTP login.</p>

      {(error || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}

      {step === 'phone' ? (
        <>
          <PhoneNumberInput
            value={phone}
            onChange={onPhoneChange}
            disabled={disabled || loading}
            error={localError}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleSendOtp}
            disabled={disabled || loading || phone.length !== 10}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending OTP...
              </>
            ) : (
              'Send OTP'
            )}
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-center text-gray-600">Code sent to {maskedPhone}</p>
          <OTPVerificationForm onComplete={handleVerify} disabled={loading} error={error} />
          <div className="flex flex-col items-center gap-1">
            <OTPResendButton resendAfter={resendAfter} onResend={handleResend} loading={loading} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep('phone')}
              disabled={loading}
            >
              Edit number
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
