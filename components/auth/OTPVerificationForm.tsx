'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const DEFAULT_OTP_LENGTH = 6;

interface OTPVerificationFormProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  error?: string | null;
  autoFocus?: boolean;
}

export default function OTPVerificationForm({
  length = DEFAULT_OTP_LENGTH,
  onComplete,
  disabled,
  error,
  autoFocus = true,
}: OTPVerificationFormProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (error) {
      submittedRef.current = false;
    }
  }, [error]);

  const tryComplete = useCallback(
    (next: string[]) => {
      if (next.every((d) => d !== '') && !submittedRef.current) {
        submittedRef.current = true;
        onComplete(next.join(''));
      }
    },
    [onComplete]
  );

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    tryComplete(next);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const next = Array(length).fill('');
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i];
    }
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    tryComplete(next);
  };

  const reset = () => {
    setDigits(Array(length).fill(''));
    submittedRef.current = false;
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">Enter verification code</Label>
      <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={cn(
              'h-12 w-10 sm:h-14 sm:w-12 text-center text-lg font-semibold p-0',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-600 text-center" role="alert">
          {error}
        </p>
      )}
      <div className="flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={disabled}>
          Clear
        </Button>
      </div>
    </div>
  );
}

export function OTPResendButton({
  resendAfter,
  onResend,
  loading,
  disabled,
}: {
  resendAfter: number;
  onResend: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [countdown, setCountdown] = useState(resendAfter);

  useEffect(() => {
    setCountdown(resendAfter);
  }, [resendAfter]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const canResend = countdown <= 0 && !loading && !disabled;

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      disabled={!canResend}
      onClick={onResend}
      className="text-sm"
    >
      {loading ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Sending...
        </>
      ) : countdown > 0 ? (
        `Resend OTP in ${countdown}s`
      ) : (
        'Resend OTP'
      )}
    </Button>
  );
}
