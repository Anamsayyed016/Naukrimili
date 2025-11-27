'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Info } from 'lucide-react';
import AISuggestionBox from '@/components/resume-builder/form-inputs/AISuggestionBox';
import KeywordsDisplay from '@/components/resume-builder/form-inputs/KeywordsDisplay';
import { useState, useEffect } from 'react';

interface SummaryStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

export default function SummaryStep({ formData, updateFormData }: SummaryStepProps) {
  const summary = formData.summary || formData.bio || formData.objective || '';
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  // Extract keywords from AI suggestions
  useEffect(() => {
    if (formData.ats_keywords && Array.isArray(formData.ats_keywords)) {
      setKeywords(formData.ats_keywords);
    }
  }, [formData.ats_keywords]);

  const handleApplySuggestion = (suggestion: string) => {
    updateFormData({ summary: suggestion });
  };

  const handleKeywordSelect = (keyword: string) => {
    if (!selectedKeywords.includes(keyword)) {
      const updated = [...selectedKeywords, keyword];
      setSelectedKeywords(updated);
      // Optionally add keyword to summary if not already present
      if (!summary.toLowerCase().includes(keyword.toLowerCase())) {
        updateFormData({ 
          summary: summary ? `${summary} ${keyword}` : keyword,
          selectedKeywords: updated 
        });
      }
    }
  };

  const handleKeywordRemove = (keyword: string) => {
    setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Summary</h2>
        <p className="text-sm text-gray-600">
          Write a brief summary of your professional background and key strengths. 
          Use AI suggestions to get industry-standard, ATS-optimized content.
        </p>
      </div>

      {/* Guidance Tooltip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold text-blue-900">Writing Tips</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Keep it concise: 3-5 sentences (150-300 characters)</li>
              <li>Highlight your key strengths and years of experience</li>
              <li>Include relevant skills and achievements</li>
              <li>Use action verbs and industry-specific keywords</li>
              <li>Focus on value proposition and career highlights</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="summary" className="text-sm font-semibold text-gray-900">
            Summary <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="summary"
            placeholder="Experienced professional with a proven track record in..."
            value={summary}
            onChange={(e) => updateFormData({ summary: e.target.value })}
            rows={8}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {summary.length} characters (recommended: 150-300 characters)
            </p>
            {summary.length >= 150 && summary.length <= 300 && (
              <span className="text-xs text-green-600 font-medium">✓ Optimal length</span>
            )}
          </div>
        </div>

        {/* AI Suggestions */}
        <AISuggestionBox
          field="summary"
          currentValue={summary}
          formData={formData}
          onApply={handleApplySuggestion}
          autoTrigger={true}
          debounceMs={1500}
        />
      </div>

      {/* ATS Keywords Display */}
      {keywords.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <KeywordsDisplay
            keywords={keywords}
            selectedKeywords={selectedKeywords}
            onKeywordSelect={handleKeywordSelect}
            onKeywordRemove={handleKeywordRemove}
          />
        </div>
      )}
    </div>
  );
}

