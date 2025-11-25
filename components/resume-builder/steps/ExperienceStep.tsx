'use client';

import { useState, useEffect } from 'react';
import MultiEntryInput from '../form-inputs/MultiEntryInput';
import InputWithATS from '../form-inputs/InputWithATS';
import TextareaWithATS from '../form-inputs/TextareaWithATS';
import KeywordSuggestionPanel from '../KeywordSuggestionPanel';

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
  const [fieldTypesData, setFieldTypesData] = useState<any>(null);

  // Lazy load field types data to avoid module initialization issues
  useEffect(() => {
    import('@/lib/resume-builder/field-types.json').then((data) => {
      setFieldTypesData(data.default);
    });
  }, []);

  const handleKeywordsSelect = (keywords: string[]) => {
    setSelectedKeywords(keywords);
    // Intelligently add keywords to experience entries
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
      // Add keywords to all entries, not just the first one
      updated.forEach((entry, index) => {
        const currentDesc = entry.Description || entry.description || '';
        const keywordsText = keywords.join(', ');
        
        // Intelligently merge: if description exists, append keywords naturally
        // Otherwise, create a bullet point with keywords
        if (currentDesc.trim()) {
          // Check if description ends with punctuation
          const endsWithPunct = /[.!?]$/.test(currentDesc.trim());
          entry.Description = `${currentDesc.trim()}${endsWithPunct ? '' : '.'} Keywords: ${keywordsText}`;
        } else {
          // Create a bullet point format
          entry.Description = `• ${keywordsText}`;
        }
        updated[index] = entry;
      });
      onFieldChange(experienceField, updated);
    } else {
      // If no experience entries exist, create one with keywords
      const newEntry = {
        Company: '',
        Position: '',
        Description: `• ${keywords.join(', ')}`,
      };
      onFieldChange(experienceField, [newEntry]);
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

  const multiEntryConfig = fieldTypesData?.multiEntryFields?.[experienceField] || {
    subFields: [
      { name: 'Company', type: 'text', placeholder: 'Company name' },
      { name: 'Position', type: 'text', placeholder: 'Job title' },
      { name: 'Location', type: 'text', placeholder: 'City, State/Country (optional)' },
      { name: 'Duration', type: 'text', placeholder: 'MM/YYYY - MM/YYYY or Present' },
      { name: 'Description', type: 'textarea', placeholder: 'Describe your responsibilities and achievements...' },
    ],
    required: ['Company', 'Position'],
  };

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-gray-200/50">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-xl">2</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
              Work Experience
            </h2>
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

