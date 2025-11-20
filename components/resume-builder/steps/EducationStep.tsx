'use client';

import MultiEntryInput from '../form-inputs/MultiEntryInput';
import fieldTypesData from '@/lib/resume-builder/field-types.json';

interface EducationStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function EducationStep({
  formData,
  onFieldChange,
}: EducationStepProps) {
  // Determine which education field to use
  const educationField = formData.experienceLevel === 'student' || formData.experienceLevel === 'fresher'
    ? 'Education(with year)'
    : 'Education';

  const educationData = formData[educationField] || 
                        formData.education || 
                        formData['Education'] || 
                        [];

  const multiEntryConfig = fieldTypesData.multiEntryFields[educationField] || {
    subFields: [
      { name: 'Institution', type: 'text', placeholder: 'University/School name' },
      { name: 'Degree', type: 'text', placeholder: 'Degree name' },
      { name: 'Year', type: 'text', placeholder: 'Graduation year' },
      { name: 'CGPA', type: 'text', placeholder: 'CGPA/GPA (optional)' },
    ],
    required: ['Institution', 'Degree'],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Education</h2>
        <p className="text-gray-600">Add your educational background</p>
      </div>

      <MultiEntryInput
        label={educationField}
        value={educationData}
        onChange={(val) => onFieldChange(educationField, val)}
        subFields={multiEntryConfig.subFields.map((field: string) => {
          const fieldConfig = multiEntryConfig.subFields.find((f: any) => 
            typeof f === 'string' ? f === field : f.name === field
          );
          if (typeof fieldConfig === 'string') {
            return { name: fieldConfig, type: 'text' };
          }
          return fieldConfig || { name: field, type: 'text' };
        })}
        required
      />
    </div>
  );
}

