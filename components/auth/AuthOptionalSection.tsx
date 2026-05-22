'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthOptionalSectionProps {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function AuthOptionalSection({
  title,
  hint = 'Optional — add later to improve matches',
  icon: Icon,
  children,
  defaultOpen = false,
}: AuthOptionalSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="auth-register-optional">
      <button
        type="button"
        className="auth-register-optional-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          {Icon ? <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden /> : null}
          <span className="truncate">
            <span className="font-medium text-slate-800">{title}</span>
            <span className="hidden sm:inline text-slate-500 font-normal"> · {hint}</span>
          </span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? <div className="auth-register-optional-body">{children}</div> : null}
    </section>
  );
}
