'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

export function SettingsSectionCard({
  title,
  description,
  children,
  className,
  action,
  tone = 'default',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  tone?: 'default' | 'danger' | 'accent';
}) {
  return (
    <section
      className={cn(
        'group/card relative overflow-hidden rounded-2xl border bg-white/90 backdrop-blur-sm',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]',
        tone === 'default' && 'border-slate-200/80',
        tone === 'accent' && 'border-indigo-200/80',
        tone === 'danger' && 'border-red-200/90 bg-gradient-to-br from-white to-red-50/40',
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-px',
          tone === 'danger'
            ? 'bg-gradient-to-r from-transparent via-red-300/70 to-transparent'
            : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'
        )}
      />
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0 space-y-1">
          <h2 className="text-[1.15rem] sm:text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-slate-500 max-w-2xl">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

export function PreferenceToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-xl border border-transparent px-3.5 py-3.5',
        'transition-all duration-200',
        'hover:border-slate-200 hover:bg-slate-50/80',
        checked && 'bg-indigo-50/40 hover:bg-indigo-50/60 hover:border-indigo-100'
      )}
    >
      <div className="min-w-0 space-y-1 pr-2">
        <Label
          htmlFor={id}
          className="text-sm font-medium text-slate-900 cursor-pointer"
        >
          {label}
        </Label>
        {description ? (
          <p className="text-[13px] leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}

export function ComingSoonCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <Badge
          variant="secondary"
          className="text-[10px] uppercase tracking-wide bg-slate-100 text-slate-600"
        >
          Coming soon
        </Badge>
      </div>
      <p className="text-[13px] leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

export function SettingsEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-6 py-10">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SettingsField({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={htmlFor}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-[12px] leading-relaxed text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function SettingsLoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-16 shadow-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export const settingsInputClassName =
  'h-11 rounded-xl border-slate-200 bg-white text-[15px] shadow-none transition-colors focus-visible:border-indigo-300 focus-visible:ring-indigo-200/60';

export const settingsTextareaClassName =
  'min-h-[96px] rounded-xl border-slate-200 bg-white text-[15px] shadow-none transition-colors focus-visible:border-indigo-300 focus-visible:ring-indigo-200/60';
