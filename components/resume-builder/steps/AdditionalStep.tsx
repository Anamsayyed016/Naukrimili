'use client';

import { useState, useEffect } from 'react';
import MultiEntryInput from '../form-inputs/MultiEntryInput';
import TagsInput from '../form-inputs/TagsInput';

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
            onChange={(val) => {
              // Update both the dynamic field name and the standard 'Projects' field for template compatibility
              onFieldChange(projectsField, val);
              onFieldChange('Projects', val);
            }}
            subFields={[
              { name: 'Name', type: 'text', placeholder: 'Project name' },
              { 
                name: 'Description', 
                type: 'textarea-ats', 
                placeholder: 'Project description',
                enableATS: true,
                formData: formData,
                experienceLevel: experienceLevel
              },
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
            onChange={(val) => {
              // Update both field name variations for template compatibility
              onFieldChange('Certifications', val);
              onFieldChange('certifications', val);
            }}
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
            onChange={(val) => {
              // Update both field name variations for template compatibility
              onFieldChange(achievementsField, val);
              onFieldChange('Achievements', val);
            }}
            subFields={experienceLevel === 'senior'
              ? [
                  { name: 'Title', type: 'text', placeholder: 'Achievement title' },
                  { 
                    name: 'Description', 
                    type: 'textarea-ats', 
                    placeholder: 'Detailed description',
                    enableATS: true,
                    formData: formData,
                    experienceLevel: experienceLevel
                  },
                  { name: 'Date', type: 'text', placeholder: 'MM/YYYY' },
                  { name: 'Impact', type: 'text', placeholder: 'Quantifiable impact' },
                ]
              : [
                  { name: 'Title', type: 'text', placeholder: 'Achievement title' },
                  { 
                    name: 'Description', 
                    type: 'textarea-ats', 
                    placeholder: 'Description',
                    enableATS: true,
                    formData: formData,
                    experienceLevel: experienceLevel
                  },
                  { name: 'Date', type: 'text', placeholder: 'MM/YYYY' },
                ]}
          />
        </div>
      )}

      {/* Languages */}
      <div>
        <MultiEntryInput
          label="Languages"
          value={formData.languages || formData['Languages'] || []}
          onChange={(val) => {
            // Update both field name variations for template compatibility
            onFieldChange('Languages', val);
            onFieldChange('languages', val);
          }}
          subFields={[
            { name: 'Language', type: 'text', placeholder: 'e.g., English, Spanish, Hindi' },
            { 
              name: 'Proficiency', 
              type: 'select', 
              placeholder: 'Select proficiency level',
              options: [
                'Basic',
                'Conversational',
                'Intermediate',
                'Proficient',
                'Fluent',
                'Native / Bilingual'
              ]
            },
          ]}
        />
      </div>

      {/* Volunteer Work */}
      {(experienceLevel === 'experienced' || experienceLevel === 'senior') && (
        <div>
          <MultiEntryInput
            label="Volunteer Work (optional)"
            value={formData.volunteerWork || formData['Volunteer Work'] || []}
            onChange={(val) => {
              // Update both field name variations for template compatibility
              onFieldChange('Volunteer Work', val);
              onFieldChange('volunteerWork', val);
            }}
            subFields={[
              { name: 'Organization', type: 'text', placeholder: 'Organization name' },
              { name: 'Role', type: 'text', placeholder: 'Volunteer role' },
              { name: 'Duration', type: 'text', placeholder: 'MM/YYYY - MM/YYYY' },
              { 
                name: 'Description', 
                type: 'textarea-ats', 
                placeholder: 'Describe your volunteer work...',
                enableATS: true,
                formData: formData,
                experienceLevel: experienceLevel
              },
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

