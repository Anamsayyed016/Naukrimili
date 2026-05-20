'use client';

import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, ShieldCheck, AlertCircle, Smartphone } from 'lucide-react';
import PhoneNumberInput from '@/components/auth/PhoneNumberInput';
import OTPVerificationForm, { OTPResendButton } from '@/components/auth/OTPVerificationForm';
import { useOtpAuth } from '@/hooks/useOtpAuth';
import { validateIndianMobile, formatIndianPhone } from '@/lib/auth/phone-utils';
import { cn } from '@/lib/utils';

interface LinkPhoneSectionProps {
  currentPhone?: string | null;
  phoneVerified?: boolean;
  onLinked?: (phone: string) => void;
  className?: string;
}

type Step = 'idle' | 'otp';

export default function LinkPhoneSection({
  currentPhone,
  phoneVerified = false,
  onLinked,
  className,
}: LinkPhoneSectionProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [linkedPhone, setLinkedPhone] = useState(currentPhone || '');
  const [isVerified, setIsVerified] = useState(phoneVerified);

  const { loading, error, resendAfter, setResendAfter, maskedPhone, sendOtp, verifyOtp, clearError } =
    useOtpAuth();

  const displayPhone = linkedPhone || currentPhone;
  const showVerified = isVerified && !!displayPhone;

  const handleSendOtp = useCallback(async () => {
    setLocalError(null);
    setSuccess(null);
    clearError();

    const check = validateIndianMobile(phone);
    if (!check.valid) {
      setLocalError(check.error || 'Invalid phone number');
      return;
    }

    const result = await sendOtp(phone, 'verify');
    if (result?.success) {
      setStep('otp');
    }
  }, [phone, sendOtp, clearError]);

  const handleVerify = useCallback(
    async (otp: string) => {
      setLocalError(null);
      setSuccess(null);
      clearError();

      const result = await verifyOtp(phone, otp, 'verify');
      if (result?.success && result.data?.phoneLinked) {
        const normalized = validateIndianMobile(phone);
        const formatted = normalized.mobile ? formatIndianPhone(normalized.mobile) : phone;
        setLinkedPhone(formatted);
        setIsVerified(true);
        setStep('idle');
        setPhone('');
        setSuccess('Mobile number verified and linked to your account.');
        onLinked?.(phone);
      }
    },
    [phone, verifyOtp, clearError, onLinked]
  );

  const handleResend = useCallback(async () => {
    const result = await sendOtp(phone, 'verify');
    if (result?.data?.resendAfter) {
      setResendAfter(result.data.resendAfter);
    }
  }, [phone, sendOtp, setResendAfter]);

  const handleChangeNumber = () => {
    setStep('idle');
    clearError();
    setLocalError(null);
  };

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5 space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-600" />
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Mobile Number</h3>
        </div>
        {showVerified ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 w-fit">
            Not verified
          </Badge>
        )}
      </div>

      {showVerified && displayPhone && (
        <p className="text-sm text-gray-700">
          Linked number: <span className="font-medium">{displayPhone}</span>
        </p>
      )}

      {(error || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {step === 'idle' ? (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-gray-600">
            {showVerified
              ? 'Change your mobile number. We will send an OTP to verify the new number.'
              : 'Link your mobile number for secure OTP login and account recovery.'}
          </p>
          <PhoneNumberInput value={phone} onChange={setPhone} disabled={loading} />
          <Button
            type="button"
            onClick={handleSendOtp}
            disabled={loading || phone.length !== 10}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {showVerified ? 'Verify New Number' : 'Send Verification OTP'}
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Enter the code sent to {maskedPhone || 'your phone'}
          </p>
          <OTPVerificationForm onComplete={handleVerify} disabled={loading} error={error} />
          <div className="flex flex-col items-center gap-2">
            <OTPResendButton
              resendAfter={resendAfter}
              onResend={handleResend}
              loading={loading}
              disabled={loading}
            />
            <Button type="button" variant="ghost" size="sm" onClick={handleChangeNumber} disabled={loading}>
              Change number
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
