'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactsStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

export default function ContactsStep({ formData, updateFormData }: ContactsStepProps) {
  const [focused, setFocused] = useState<string>('');

  const handleChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
  };

  const isFieldValid = (field: string): boolean => {
    const value = formData[field];
    return value !== undefined && value !== null && value !== '';
  };

  const fields = [
    {
      id: 'firstName',
      label: 'First Name',
      placeholder: 'John',
      required: true,
      value: formData.firstName || formData.name?.split(' ')[0] || '',
    },
    {
      id: 'lastName',
      label: 'Last Name',
      placeholder: 'Doe',
      required: true,
      value: formData.lastName || formData.name?.split(' ').slice(1).join(' ') || '',
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'john.doe@email.com',
      required: true,
      value: formData.email || '',
    },
    {
      id: 'phone',
      label: 'Phone',
      type: 'tel',
      placeholder: '+1 234 567 8900',
      value: formData.phone || '',
    },
    {
      id: 'location',
      label: 'Location',
      placeholder: 'City, State',
      value: formData.location || '',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      placeholder: 'linkedin.com/in/johndoe',
      value: formData.linkedin || '',
    },
    {
      id: 'portfolio',
      label: 'Portfolio/Website',
      placeholder: 'www.yourwebsite.com',
      value: formData.portfolio || formData.website || '',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
        <p className="text-sm text-gray-600">
          Add your contact details so employers can reach you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="text-sm font-semibold text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {isFieldValid(field.id) && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="relative">
              <Input
                id={field.id}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => handleChange(field.id, e.target.value)}
                onFocus={() => setFocused(field.id)}
                onBlur={() => setFocused('')}
                className={cn(
                  'w-full',
                  isFieldValid(field.id) && 'border-green-500 focus-visible:ring-green-500',
                  focused === field.id && 'ring-2 ring-blue-500'
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Job Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="jobTitle" className="text-sm font-semibold text-gray-900">
            Job Title / Professional Title
          </Label>
          {isFieldValid('jobTitle') && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>
        <Input
          id="jobTitle"
          placeholder="Software Engineer"
          value={formData.jobTitle || formData.title || ''}
          onChange={(e) => handleChange('jobTitle', e.target.value)}
          onFocus={() => setFocused('jobTitle')}
          onBlur={() => setFocused('')}
          className={cn(
            'w-full',
            isFieldValid('jobTitle') && 'border-green-500 focus-visible:ring-green-500',
            focused === 'jobTitle' && 'ring-2 ring-blue-500'
          )}
        />
      </div>
    </div>
  );
}

