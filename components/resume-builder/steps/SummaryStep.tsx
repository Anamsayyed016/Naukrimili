'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SummaryStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function SummaryStep({ formData, onFieldChange }: SummaryStepProps) {
  const summary =
    formData.summary ||
    formData['Professional Summary'] ||
    formData['Career Objective'] ||
    formData['Objective'] ||
    formData['Executive Summary'] ||
    '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Summary</h2>
        <p className="text-gray-600">
          Write a brief professional summary that highlights your background, education, and main skills.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Professional Summary</Label>
        <Textarea
          value={summary}
          onChange={(e) => onFieldChange('summary', e.target.value)}
          placeholder="Use this section to give recruiters a quick glimpse of your professional profile. In just 3-4 lines, highlight your background, education and main skills."
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-gray-500">
          {summary.length} characters
        </p>
      </div>
    </div>
  );
}

