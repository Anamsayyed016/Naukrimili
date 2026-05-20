'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import PhoneNumberInput from '@/components/auth/PhoneNumberInput';
import OTPVerificationForm, { OTPResendButton } from '@/components/auth/OTPVerificationForm';
import { useOtpAuth, type OtpPurpose } from '@/hooks/useOtpAuth';
import { validateIndianMobile } from '@/lib/auth/phone-utils';

type Step = 'phone' | 'otp';

export default function SignInWithOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const purpose = (searchParams.get('purpose') as OtpPurpose) || 'login';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { loading, error, resendAfter, setResendAfter, maskedPhone, sendOtp, verifyOtp, clearError } =
    useOtpAuth();

  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '';

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/auth/role-selection');
    }
  }, [status, router, callbackUrl]);

  const handleSendOtp = useCallback(async () => {
    clearError();
    setPhoneError(null);

    const check = validateIndianMobile(phone);
    if (!check.valid) {
      setPhoneError(check.error || 'Invalid phone number');
      return;
    }

    if (purpose === 'register' && !name.trim()) {
      setPhoneError('Name is required for registration');
      return;
    }

    const result = await sendOtp(phone, purpose, name.trim() || undefined);
    if (result?.success) {
      setStep('otp');
    }
  }, [phone, purpose, name, sendOtp, clearError]);

  const handleVerifyOtp = useCallback(
    async (otp: string) => {
      clearError();
      setSubmitting(true);

      try {
        const result = await verifyOtp(phone, otp, purpose, name.trim() || undefined);
        if (!result?.success || !result.data?.sessionToken) return;

        const signInResult = await signIn('phone-otp', {
          phone,
          sessionToken: result.data.sessionToken,
          redirect: false,
        });

        if (signInResult?.error) {
          clearError();
          return;
        }

        if (result.data.isNewUser || !callbackUrl) {
          router.replace('/auth/role-selection');
        } else {
          router.replace(callbackUrl);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [phone, purpose, name, verifyOtp, clearError, router, callbackUrl]
  );

  const handleResend = useCallback(async () => {
    const result = await sendOtp(phone, purpose, name.trim() || undefined);
    if (result?.data?.resendAfter) {
      setResendAfter(result.data.resendAfter);
    }
  }, [phone, purpose, name, sendOtp, setResendAfter]);

  const isBusy = loading || submitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link
            href="/auth/signin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to sign in
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {purpose === 'register' ? 'Sign up with OTP' : 'Sign in with OTP'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'phone'
                ? 'We will send a verification code to your mobile'
                : `Code sent to ${maskedPhone || 'your phone'}`}
            </p>
          </div>

          {(error || phoneError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || phoneError}</AlertDescription>
            </Alert>
          )}

          {step === 'phone' ? (
            <div className="space-y-4">
              {purpose === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={isBusy}
                    maxLength={100}
                  />
                </div>
              )}

              <PhoneNumberInput
                value={phone}
                onChange={setPhone}
                disabled={isBusy}
                error={phoneError}
              />

              <Button
                type="button"
                className="w-full"
                disabled={isBusy || phone.length !== 10}
                onClick={handleSendOtp}
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

              <p className="text-center text-sm text-gray-600">
                {purpose === 'login' ? (
                  <>
                    New here?{' '}
                    <Link href="/auth/signin-with-otp?purpose=register" className="text-blue-600 hover:underline">
                      Register with OTP
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Link href="/auth/signin-with-otp" className="text-blue-600 hover:underline">
                      Sign in with OTP
                    </Link>
                  </>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <OTPVerificationForm
                onComplete={handleVerifyOtp}
                disabled={isBusy}
                error={error}
              />

              <div className="flex flex-col items-center gap-2">
                <OTPResendButton
                  resendAfter={resendAfter}
                  onResend={handleResend}
                  loading={loading}
                  disabled={isBusy}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => {
                    setStep('phone');
                    clearError();
                  }}
                >
                  Change number
                </Button>
              </div>

              {submitting && (
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing you in...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
