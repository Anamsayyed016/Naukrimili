'use client';

import MultiEntryInput from '../form-inputs/MultiEntryInput';
import TagsInput from '../form-inputs/TagsInput';
import fieldTypesData from '@/lib/resume-builder/field-types.json';

interface AdditionalStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  experienceLevel?: string;
}

export default function AdditionalStep({
  formData,
  onFieldChange,
  experienceLevel = 'experienced',
}: AdditionalStepProps) {
  // Determine which additional fields to show based on resume type
  const showProjects = experienceLevel === 'fresher' || experienceLevel === 'student' || experienceLevel === 'experienced';
  const showCertifications = true;
  const showAchievements = experienceLevel === 'experienced' || experienceLevel === 'senior';
  const showHobbies = experienceLevel === 'student' || experienceLevel === 'fresher';

  const projectsField = experienceLevel === 'student' || experienceLevel === 'fresher'
    ? 'Academic Projects'
    : 'Projects(optional)';

  const achievementsField = experienceLevel === 'senior'
    ? 'Key Achievements'
    : 'Achievements';

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">6</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Additional Sections</h2>
            <p className="text-sm text-gray-600 mt-1">Add projects, certifications, and other achievements</p>
          </div>
        </div>
      </div>

      {/* Projects */}
      {showProjects && (
        <div>
          <MultiEntryInput
            label={projectsField}
            value={formData[projectsField] || formData.projects || formData['Projects'] || []}
            onChange={(val) => onFieldChange(projectsField, val)}
            subFields={[
              { name: 'Name', type: 'text', placeholder: 'Project name' },
              { name: 'Description', type: 'textarea', placeholder: 'Project description' },
              { name: 'Technologies', type: 'text', placeholder: 'Technologies used' },
              { name: 'Link', type: 'text', placeholder: 'Project URL (optional)' },
            ]}
            required={experienceLevel === 'fresher' || experienceLevel === 'student'}
          />
        </div>
      )}

      {/* Certifications */}
      {showCertifications && (
        <div>
          <MultiEntryInput
            label="Certifications"
            value={formData.certifications || formData['Certifications'] || []}
            onChange={(val) => onFieldChange('Certifications', val)}
            subFields={[
              { name: 'Name', type: 'text', placeholder: 'Certification name' },
              { name: 'Issuer', type: 'text', placeholder: 'Issuing organization' },
              { name: 'Date', type: 'text', placeholder: 'MM/YYYY' },
              { name: 'Link', type: 'text', placeholder: 'Certificate URL (optional)' },
            ]}
          />
        </div>
      )}

      {/* Achievements */}
      {showAchievements && (
        <div>
          <MultiEntryInput
            label={achievementsField}
            value={formData[achievementsField] || formData.achievements || formData['Achievements'] || []}
            onChange={(val) => onFieldChange(achievementsField, val)}
            subFields={experienceLevel === 'senior'
              ? [
                  { name: 'Title', type: 'text', placeholder: 'Achievement title' },
                  { name: 'Description', type: 'textarea', placeholder: 'Detailed description' },
                  { name: 'Date', type: 'text', placeholder: 'MM/YYYY' },
                  { name: 'Impact', type: 'text', placeholder: 'Quantifiable impact' },
                ]
              : [
                  { name: 'Title', type: 'text', placeholder: 'Achievement title' },
                  { name: 'Description', type: 'textarea', placeholder: 'Description' },
                  { name: 'Date', type: 'text', placeholder: 'MM/YYYY' },
                ]}
          />
        </div>
      )}

      {/* Hobbies */}
      {showHobbies && (
        <div>
          <TagsInput
            label="Hobbies (optional)"
            value={formData.hobbies || formData['Hobbies(optional)'] || []}
            onChange={(val) => onFieldChange('Hobbies(optional)', val)}
            placeholder="Add hobbies or interests"
          />
        </div>
      )}
    </div>
  );
}

