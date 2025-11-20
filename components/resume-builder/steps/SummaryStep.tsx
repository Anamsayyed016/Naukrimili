'use client';

import TextareaWithATS from '../form-inputs/TextareaWithATS';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {summaryField}
        </h2>
        <p className="text-gray-600">
          Write a compelling summary that highlights your key qualifications
        </p>
      </div>

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

