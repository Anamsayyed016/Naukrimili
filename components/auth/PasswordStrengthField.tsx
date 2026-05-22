'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  analyzePasswordStrength,
  getPasswordRules,
  type PasswordStrengthLabel,
} from '@/lib/auth/password-policy';

type Accent = 'blue' | 'emerald';

const accentRing: Record<Accent, string> = {
  blue: 'focus-visible:ring-blue-500/30 focus-visible:border-blue-500',
  emerald: 'focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500',
};

const strengthColors: Record<PasswordStrengthLabel, string> = {
  weak: 'bg-red-500',
  medium: 'bg-amber-500',
  strong: 'bg-emerald-500',
};

const strengthText: Record<PasswordStrengthLabel, string> = {
  weak: 'text-red-700',
  medium: 'text-amber-700',
  strong: 'text-emerald-700',
};

interface PasswordStrengthFieldProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  accent?: Accent;
  disabled?: boolean;
}

export default function PasswordStrengthField({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmChange,
  accent = 'blue',
  disabled,
}: PasswordStrengthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const analysis = useMemo(() => analyzePasswordStrength(password), [password]);
  const rules = useMemo(() => getPasswordRules(password), [password]);
  const showMeter = password.length > 0;
  const confirmMismatch =
    confirmPassword.length > 0 && password.length > 0 && password !== confirmPassword;

  const inputClass = cn(
    'auth-register-input pl-10 pr-10',
    accentRing[accent]
  );

  return (
    <div className="auth-register-password space-y-4">
      <div>
        <Label htmlFor="password" className="auth-register-label">
          Password <span className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1.5">
          <Lock className="auth-register-input-icon" aria-hidden />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            disabled={disabled}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className={inputClass}
            placeholder="e.g. StrongPass@123"
          />
          <button
            type="button"
            className="auth-register-eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Use 8+ characters with uppercase, lowercase, a number, and a symbol.
        </p>

        {showMeter && (
          <div className="mt-3 space-y-2 auth-register-strength-enter">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600">Password strength</span>
              <span className={cn('text-xs font-semibold capitalize', strengthText[analysis.label])}>
                {analysis.label}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300 ease-out',
                  strengthColors[analysis.label]
                )}
                style={{ width: `${analysis.percent}%` }}
              />
            </div>
            <ul className="grid gap-1 sm:grid-cols-2" aria-live="polite">
              {rules.map((rule) => (
                <li
                  key={rule.key}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors duration-200',
                    rule.met ? 'text-emerald-700' : 'text-slate-500'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      rule.met ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    )}
                    aria-hidden
                  >
                    {rule.met ? '✓' : '○'}
                  </span>
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="auth-register-label">
          Confirm password <span className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1.5">
          <Lock className="auth-register-input-icon" aria-hidden />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            disabled={disabled}
            value={confirmPassword}
            onChange={(e) => onConfirmChange(e.target.value)}
            className={cn(inputClass, confirmMismatch && 'border-red-300 focus-visible:ring-red-500/25')}
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            className="auth-register-eye"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmMismatch && (
          <p className="mt-1.5 text-xs text-red-600">Passwords do not match yet.</p>
        )}
      </div>
    </div>
  );
}
