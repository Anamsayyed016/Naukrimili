'use client';

import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <Label htmlFor={`section-${key}`} className="text-xs font-medium text-slate-800">
                  {label}
                </Label>
                <p className="text-[11px] text-slate-500 truncate">{hint}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {visible ? (
                  <Eye className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" aria-hidden />
                )}
                <Switch
                  id={`section-${key}`}
                  checked={visible}
                  onCheckedChange={(checked) => setSectionVisible(key, checked)}
                  aria-label={`${visible ? 'Hide' : 'Show'} ${label} section`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
