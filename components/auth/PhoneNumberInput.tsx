'use client';

import { forwardRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Smartphone } from 'lucide-react';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
  id?: string;
  className?: string;
}

const PhoneNumberInput = forwardRef<HTMLInputElement, PhoneNumberInputProps>(
  ({ value, onChange, disabled, error, id = 'phone', className }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        onChange(digits);
      },
      [onChange]
    );

    return (
      <div className={cn('space-y-2', className)}>
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          Mobile Number
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Smartphone className="h-4 w-4 text-gray-400" />
          </div>
          <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none">
            <span className="text-sm text-gray-500 font-medium pr-1 border-r border-gray-200 mr-2">
              +91
            </span>
          </div>
          <Input
            ref={ref}
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="9876543210"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            maxLength={10}
            className={cn(
              'pl-[4.5rem]',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
        {error && (
          <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-gray-500">Enter your 10-digit Indian mobile number</p>
      </div>
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';

export default PhoneNumberInput;
