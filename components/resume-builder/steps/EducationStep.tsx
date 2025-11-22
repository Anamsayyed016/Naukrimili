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
      { name: 'Degree', type: 'text', placeholder: 'Degree name (e.g., B.Tech, MBA)' },
      { name: 'Field of Study', type: 'text', placeholder: 'Field of study (e.g., Computer Science)' },
      { name: 'Location', type: 'text', placeholder: 'City, State/Country (optional)' },
      { name: 'Year', type: 'text', placeholder: 'Graduation year' },
      { name: 'CGPA', type: 'text', placeholder: 'CGPA/GPA (optional)' },
      { name: 'Honors/Awards', type: 'text', placeholder: 'Honors, Dean\'s List, etc. (optional)' },
    ],
    required: ['Institution', 'Degree'],
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">4</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Education</h2>
            <p className="text-sm text-gray-600 mt-1">Add your educational background</p>
          </div>
        </div>
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

