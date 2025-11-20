'use client';

import TextInput from '../form-inputs/TextInput';
import InputWithATS from '../form-inputs/InputWithATS';

interface PersonalInfoStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function PersonalInfoStep({
  formData,
  onFieldChange,
}: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Add your contact details and basic information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextInput
          label="First Name"
          value={formData.firstName || ''}
          onChange={(val) => onFieldChange('firstName', val)}
          placeholder="Enter your first name"
          required
        />
        <TextInput
          label="Last Name"
          value={formData.lastName || ''}
          onChange={(val) => onFieldChange('lastName', val)}
          placeholder="Enter your last name"
          required
        />
        <TextInput
          label="Email"
          value={formData.email || ''}
          onChange={(val) => onFieldChange('email', val)}
          placeholder="your.email@example.com"
          type="email"
          required
        />
        <TextInput
          label="Phone"
          value={formData.phone || ''}
          onChange={(val) => onFieldChange('phone', val)}
          placeholder="+1 234 567 8900"
          type="tel"
        />
        <InputWithATS
          label="Job Title / Desired Position"
          value={formData.jobTitle || formData.desiredJobTitle || ''}
          onChange={(val) => onFieldChange('jobTitle', val)}
          placeholder="e.g. Software Engineer"
          fieldType="position"
          formData={formData}
          experienceLevel={formData.experienceLevel || 'experienced'}
        />
        <TextInput
          label="Location"
          value={formData.location || ''}
          onChange={(val) => onFieldChange('location', val)}
          placeholder="City, Country"
        />
        <TextInput
          label="LinkedIn (optional)"
          value={formData.linkedin || ''}
          onChange={(val) => onFieldChange('linkedin', val)}
          placeholder="linkedin.com/in/yourprofile"
        />
        <TextInput
          label="Portfolio/Website (optional)"
          value={formData.portfolio || formData.website || ''}
          onChange={(val) => onFieldChange('portfolio', val)}
          placeholder="yourwebsite.com"
        />
      </div>
    </div>
  );
}

