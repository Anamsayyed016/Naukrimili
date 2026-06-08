'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  EDITOR_SECTION_TOGGLES,
  type ResumeSectionKey,
} from '@/lib/resume-builder/section-visibility';

interface SectionVisibilityPanelProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
  className?: string;
}

export default function SectionVisibilityPanel({
  formData,
  updateFormData,
  className = '',
}: SectionVisibilityPanelProps) {
  const visibility =
    formData.sectionVisibility && typeof formData.sectionVisibility === 'object'
      ? (formData.sectionVisibility as Record<string, boolean>)
      : {};

  const isVisible = (key: ResumeSectionKey) => visibility[key] !== false;

  const setSectionVisible = (key: ResumeSectionKey, visible: boolean) => {
    updateFormData({
      sectionVisibility: {
        ...visibility,
        [key]: visible,
      },
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 text-blue-600 shrink-0" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">Resume sections</h3>
          <p className="text-xs text-slate-500">
            Empty sections hide automatically. Turn off a section to keep it out of your resume.
          </p>
        </div>
      </div>

      <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
        {EDITOR_SECTION_TOGGLES.map(({ key, label, hint }) => {
          const visible = isVisible(key);
          const statusId = `section-status-${key}`;
          return (
            <div
              key={key}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-all duration-200 ease-out',
                visible
                  ? 'border-emerald-300 bg-emerald-50/80 shadow-sm ring-1 ring-emerald-100'
                  : 'border-slate-200 bg-slate-100/90 opacity-80'
              )}
            >
              <div className="min-w-0 flex-1">
                <Label
                  htmlFor={`section-${key}`}
                  className={cn(
                    'text-xs font-semibold',
                    visible ? 'text-slate-900' : 'text-slate-600'
                  )}
                >
                  {label}
                </Label>
                <p className="text-[11px] text-slate-500 truncate">{hint}</p>
                <p
                  id={statusId}
                  className={cn(
                    'mt-1 text-[11px] font-semibold tracking-wide',
                    visible ? 'text-emerald-700' : 'text-slate-500'
                  )}
                  aria-live="polite"
                >
                  {visible ? 'Visible' : 'Hidden'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {visible ? (
                  <Eye className="w-4 h-4 text-emerald-600" aria-hidden />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-500" aria-hidden />
                )}
                <Switch
                  id={`section-${key}`}
                  checked={visible}
                  onCheckedChange={(checked) => setSectionVisible(key, checked)}
                  aria-label={`${visible ? 'Hide' : 'Show'} ${label} section`}
                  aria-describedby={statusId}
                  className={cn(
                    'h-6 w-11 transition-colors duration-200 ease-out',
                    'data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-300',
                    '[&>span]:bg-white [&>span]:shadow-md [&>span]:transition-transform [&>span]:duration-200'
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
