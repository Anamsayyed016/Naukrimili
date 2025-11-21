'use client';

import { useState } from 'react';
import TextareaWithATS from '../form-inputs/TextareaWithATS';
import KeywordSuggestionPanel from '../KeywordSuggestionPanel';

interface SummaryStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  experienceLevel?: string;
}

export default function SummaryStep({
  formData,
  onFieldChange,
  experienceLevel = 'experienced',
}: SummaryStepProps) {
  // Determine which summary field to use based on resume type
  const summaryField = experienceLevel === 'senior'
    ? 'Executive Summary'
    : experienceLevel === 'fresher' || experienceLevel === 'student'
    ? 'Career Objective'
    : 'Professional Summary';

  const summaryValue = formData[summaryField] || 
                       formData.summary || 
                       formData['Professional Summary'] || 
                       formData['Career Objective'] || 
                       formData['Executive Summary'] || 
                       '';

  const handleKeywordsSelect = (keywords: string[]) => {
    // Add keywords to the summary text
    const currentText = summaryValue || '';
    const keywordsText = keywords.join(', ');
    const newText = currentText 
      ? `${currentText} ${keywordsText}` 
      : keywordsText;
    onFieldChange(summaryField, newText);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">5</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {summaryField}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Write a compelling summary that highlights your key qualifications
            </p>
          </div>
        </div>
      </div>

      <KeywordSuggestionPanel
        jobTitle={formData.jobTitle || formData.position || ''}
        industry={formData.industry || ''}
        experienceLevel={experienceLevel}
        onKeywordsSelect={handleKeywordsSelect}
        className="mb-4"
      />

      <TextareaWithATS
        label={summaryField}
        value={summaryValue}
        onChange={(val) => onFieldChange(summaryField, val)}
        placeholder="Write 2-3 sentences about your professional background, key skills, and career goals..."
        rows={6}
        fieldType="summary"
        formData={formData}
        experienceLevel={experienceLevel}
      />
    </div>
  );
}

