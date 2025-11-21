'use client';

import { useState } from 'react';
import MultiEntryInput from '../form-inputs/MultiEntryInput';
import InputWithATS from '../form-inputs/InputWithATS';
import TextareaWithATS from '../form-inputs/TextareaWithATS';
import KeywordSuggestionPanel from '../KeywordSuggestionPanel';
import fieldTypesData from '@/lib/resume-builder/field-types.json';

interface ExperienceStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  experienceLevel?: string;
}

export default function ExperienceStep({
  formData,
  onFieldChange,
  experienceLevel = 'experienced',
}: ExperienceStepProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const handleKeywordsSelect = (keywords: string[]) => {
    setSelectedKeywords(keywords);
    // Add keywords to the first experience entry's description if it exists
    const experienceField = formData.experienceLevel === 'senior' 
      ? 'Experience(8–20 years)'
      : formData.experienceLevel === 'fresher' || formData.experienceLevel === 'student'
      ? 'Internships(optional)'
      : 'Work Experience';
    
    const experienceData = formData[experienceField] || 
                           formData.experience || 
                           formData['Work Experience'] || 
                           [];
    
    if (experienceData.length > 0) {
      const updated = [...experienceData];
      const firstEntry = { ...updated[0] };
      const currentDesc = firstEntry.Description || firstEntry.description || '';
      const keywordsText = keywords.join(', ');
      firstEntry.Description = currentDesc 
        ? `${currentDesc} ${keywordsText}` 
        : keywordsText;
      updated[0] = firstEntry;
      onFieldChange(experienceField, updated);
    }
  };
  // Determine which experience field to use based on resume type
  const experienceField = formData.experienceLevel === 'senior' 
    ? 'Experience(8–20 years)'
    : formData.experienceLevel === 'fresher' || formData.experienceLevel === 'student'
    ? 'Internships(optional)'
    : 'Work Experience';

  const experienceData = formData[experienceField] || 
                         formData.experience || 
                         formData['Work Experience'] || 
                         [];

  const multiEntryConfig = fieldTypesData.multiEntryFields[experienceField] || {
    subFields: [
      { name: 'Company', type: 'text', placeholder: 'Company name' },
      { name: 'Position', type: 'text', placeholder: 'Job title' },
      { name: 'Duration', type: 'text', placeholder: 'MM/YYYY - MM/YYYY' },
      { name: 'Description', type: 'textarea', placeholder: 'Describe your responsibilities and achievements...' },
    ],
    required: ['Company', 'Position'],
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">2</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
            <p className="text-sm text-gray-600 mt-1">Add your professional work experience and achievements</p>
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

      <MultiEntryInput
        label={experienceField}
        value={experienceData}
        onChange={(val) => onFieldChange(experienceField, val)}
        subFields={multiEntryConfig.subFields.map((field: any) => {
          const fieldName = typeof field === 'string' ? field : field.name;
          const fieldConfig = typeof field === 'object' ? field : multiEntryConfig.subFields.find((f: any) => 
            typeof f === 'object' && f.name === fieldName
          );
          
          const isDescription = fieldName === 'Description' || fieldName === 'description';
          
          if (typeof field === 'string') {
            return { 
              name: field, 
              type: isDescription ? ('textarea-ats' as const) : ('text' as const),
              enableATS: isDescription,
              formData: formData,
              experienceLevel: experienceLevel,
            };
          }
          
          return {
            ...fieldConfig,
            name: fieldName,
            type: isDescription ? ('textarea-ats' as const) : ((fieldConfig?.type || 'text') as 'text' | 'textarea' | 'textarea-ats'),
            enableATS: isDescription,
            formData: formData,
            experienceLevel: experienceLevel,
          };
        })}
        required={experienceLevel !== 'fresher' && experienceLevel !== 'student'}
      />
    </div>
  );
}

