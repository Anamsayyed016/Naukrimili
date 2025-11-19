'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactsStepProps {
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function ContactsStep({ formData, onFieldChange }: ContactsStepProps) {
  const fields = [
    { key: 'firstName', label: 'First name', placeholder: 'Enter your first name' },
    { key: 'lastName', label: 'Last name', placeholder: 'Enter your last name' },
    { key: 'jobTitle', label: 'Desired job title', placeholder: 'e.g. Accountant' },
    { key: 'phone', label: 'Phone', placeholder: 'e.g. 305-123-44444', type: 'tel' },
    { key: 'email', label: 'Email', placeholder: 'e.g.mail@example.com', type: 'email' },
  ];

  const isFieldValid = (key: string) => {
    const value = formData[key];
    return value && value.toString().trim().length > 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contacts</h2>
        <p className="text-gray-600">
          Add your up-to-date contact information so employers and recruiters can easily reach you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => {
          const value = formData[field.key] || '';
          const isValid = isFieldValid(field.key);

          return (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="text-sm font-medium text-gray-700">
                {field.label}
              </Label>
              <div className="relative">
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  value={value}
                  onChange={(e) => onFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={cn(
                    'pr-10',
                    isValid && 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  )}
                />
                {isValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Information (Collapsible) */}
      <div className="pt-4">
        <details className="group">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 flex items-center gap-2 text-sm font-medium">
            Additional information
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => onFieldChange('location', e.target.value)}
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700">
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                value={formData.linkedin || ''}
                onChange={(e) => onFieldChange('linkedin', e.target.value)}
                placeholder="linkedin.com/in/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                Website/Portfolio
              </Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => onFieldChange('website', e.target.value)}
                placeholder="yourwebsite.com"
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

