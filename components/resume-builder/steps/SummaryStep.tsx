'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SummaryStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

export default function SummaryStep({ formData, updateFormData }: SummaryStepProps) {
  const summary = formData.summary || formData.bio || formData.objective || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Summary</h2>
        <p className="text-sm text-gray-600">
          Write a brief summary of your professional background and key strengths.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary" className="text-sm font-semibold text-gray-900">
          Summary
        </Label>
        <Textarea
          id="summary"
          placeholder="Experienced professional with a proven track record in..."
          value={summary}
          onChange={(e) => updateFormData({ summary: e.target.value })}
          rows={8}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          {summary.length} characters (recommended: 150-300 characters)
        </p>
      </div>
    </div>
  );
}

