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
    // Intelligently add keywords to the summary text
    const currentText = summaryValue || '';
    const keywordsText = keywords.join(', ');
    
    // If summary is empty, create a sentence with keywords
    // Otherwise, append keywords naturally
    const newText = currentText.trim()
      ? `${currentText.trim()} ${keywordsText}`
      : `Experienced professional with expertise in ${keywordsText}.`;
    
    onFieldChange(summaryField, newText);
  };

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-gray-200/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">5</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
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

      <div className="space-y-2">
        <TextareaWithATS
          label={summaryField}
          value={summaryValue}
          onChange={(val) => onFieldChange(summaryField, val)}
          placeholder="Write 3-5 sentences (80-120 words) about your professional background, key skills, achievements, and career goals..."
          rows={8}
          fieldType="summary"
          formData={formData}
          experienceLevel={experienceLevel}
        />
        {/* Word and character count */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span>
            {summaryValue ? summaryValue.split(/\s+/).filter(w => w.length > 0).length : 0} words
          </span>
          <span>
            {summaryValue ? summaryValue.length : 0} characters
          </span>
          <span className={summaryValue && summaryValue.split(/\s+/).filter(w => w.length > 0).length >= 80 && summaryValue.split(/\s+/).filter(w => w.length > 0).length <= 120 ? 'text-green-600 font-medium' : summaryValue && summaryValue.split(/\s+/).filter(w => w.length > 0).length > 0 ? 'text-amber-600' : ''}>
            {summaryValue && summaryValue.split(/\s+/).filter(w => w.length > 0).length >= 80 && summaryValue.split(/\s+/).filter(w => w.length > 0).length <= 120 
              ? '✓ Optimal length' 
              : summaryValue && summaryValue.split(/\s+/).filter(w => w.length > 0).length > 0
              ? `Target: 80-120 words`
              : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

