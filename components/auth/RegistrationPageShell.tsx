'use client';

import { Plus_Jakarta_Sans } from 'next/font/google';
import { cn } from '@/lib/utils';

const registerFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

type Variant = 'jobseeker' | 'employer';

interface RegistrationPageShellProps {
  variant: Variant;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function RegistrationPageShell({
  variant,
  title,
  subtitle,
  children,
}: RegistrationPageShellProps) {
  return (
    <div
      className={cn(
        registerFont.className,
        'auth-register-page min-h-screen flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8',
        variant === 'employer' ? 'auth-register-page--employer' : 'auth-register-page--jobseeker'
      )}
    >
      <div className="auth-register-glow auth-register-glow--left" aria-hidden />
      <div className="auth-register-glow auth-register-glow--right" aria-hidden />

      <div className="auth-register-card w-full max-w-4xl relative z-10">
        <div className="auth-register-card-inner p-6 sm:p-8 lg:p-10">
          <header className="auth-register-header text-center mb-8">
            <p className="auth-register-eyebrow mb-2">Secure onboarding</p>
            <h1 className="auth-register-title">{title}</h1>
            <p className="auth-register-subtitle">{subtitle}</p>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthFormSection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('auth-register-section space-y-4', className)}>
      <h2 className="auth-register-section-title">
        {Icon ? <Icon className="h-5 w-5 shrink-0" aria-hidden /> : null}
        {title}
      </h2>
      {children}
    </section>
  );
}
