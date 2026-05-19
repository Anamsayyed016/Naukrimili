'use client';

/**
 * Resume Preview Wrapper — layout shell for the editor preview column.
 * Delegates rendering and scaling to LivePreview.
 */

import LivePreview from '@/components/resume-builder/LivePreview';
import { cn } from '@/lib/utils';

interface ResumePreviewWrapperProps {
  formData: Record<string, unknown>;
  templateId?: string;
  selectedColorId?: string;
  className?: string;
}

export default function ResumePreviewWrapper({
  formData,
  templateId,
  selectedColorId,
  className = '',
}: ResumePreviewWrapperProps) {
  if (!templateId) {
    return (
      <div
        className={cn(
          'flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500',
          className
        )}
      >
        Select a template to preview your resume
      </div>
    );
  }

  return (
    <LivePreview
      templateId={templateId}
      formData={formData}
      selectedColorId={selectedColorId}
      showZoomControls
      className={cn('h-full min-h-0', className)}
    />
  );
}
