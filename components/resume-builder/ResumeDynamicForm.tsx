'use client';

import { useEffect } from 'react';
import TextInput from './form-inputs/TextInput';
import EmailInput from './form-inputs/EmailInput';
import TextareaInput from './form-inputs/TextareaInput';
import TagsInput from './form-inputs/TagsInput';
import MultiEntryInput from './form-inputs/MultiEntryInput';
import fieldTypesData from '@/lib/resume-builder/field-types.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResumeDynamicFormProps {
  fields: string[];
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
}

export default function ResumeDynamicForm({
  fields,
  formData,
  onFieldChange,
}: ResumeDynamicFormProps) {
  const getFieldType = (fieldName: string): string => {
    return fieldTypesData.fieldTypes[fieldName] || 'text';
  };

  const getMultiEntryConfig = (fieldName: string) => {
    return fieldTypesData.multiEntryFields[fieldName] || {
      subFields: ['Value'],
      required: [],
    };
  };

  const renderField = (fieldName: string) => {
    const fieldType = getFieldType(fieldName);
    const value = formData[fieldName] || '';

    switch (fieldType) {
      case 'email':
        return (
          <EmailInput
            key={fieldName}
            label={fieldName}
            value={value}
            onChange={(val) => onFieldChange(fieldName, val)}
            required={!fieldName.includes('(optional)')}
          />
        );

      case 'tel':
        return (
          <TextInput
            key={fieldName}
            label={fieldName}
            value={value}
            onChange={(val) => onFieldChange(fieldName, val)}
            type="tel"
            required={!fieldName.includes('(optional)')}
          />
        );

      case 'textarea':
        return (
          <TextareaInput
            key={fieldName}
            label={fieldName}
            value={value}
            onChange={(val) => onFieldChange(fieldName, val)}
            required={!fieldName.includes('(optional)')}
            rows={4}
          />
        );

      case 'tags':
        return (
          <TagsInput
            key={fieldName}
            label={fieldName}
            value={Array.isArray(value) ? value : []}
            onChange={(val) => onFieldChange(fieldName, val)}
            required={!fieldName.includes('(optional)')}
          />
        );

      case 'multi-entry':
        const config = getMultiEntryConfig(fieldName);
        return (
          <MultiEntryInput
            key={fieldName}
            label={fieldName.replace('(multi-entry)', '').replace('(optional)', '')}
            value={Array.isArray(value) ? value : []}
            onChange={(val) => onFieldChange(fieldName, val)}
            subFields={config.subFields}
            required={config.required}
          />
        );

      default:
        return (
          <TextInput
            key={fieldName}
            label={fieldName}
            value={value}
            onChange={(val) => onFieldChange(fieldName, val)}
            required={!fieldName.includes('(optional)')}
          />
        );
    }
  };

  // Group fields into sections
  const personalFields = fields.filter((f) =>
    ['Full Name', 'Email', 'Phone'].includes(f)
  );
  const summaryFields = fields.filter((f) =>
    f.toLowerCase().includes('objective') ||
    f.toLowerCase().includes('summary') ||
    f.toLowerCase().includes('executive')
  );
  const experienceFields = fields.filter((f) =>
    f.toLowerCase().includes('experience') ||
    f.toLowerCase().includes('work')
  );
  const educationFields = fields.filter((f) =>
    f.toLowerCase().includes('education') ||
    f.toLowerCase().includes('degree')
  );
  const skillsFields = fields.filter((f) =>
    f.toLowerCase().includes('skill')
  );
  const otherFields = fields.filter(
    (f) =>
      !personalFields.includes(f) &&
      !summaryFields.includes(f) &&
      !experienceFields.includes(f) &&
      !educationFields.includes(f) &&
      !skillsFields.includes(f)
  );

  const sections = [
    { title: 'Personal Information', fields: personalFields },
    { title: 'Summary', fields: summaryFields },
    { title: 'Experience', fields: experienceFields },
    { title: 'Education', fields: educationFields },
    { title: 'Skills', fields: skillsFields },
    { title: 'Additional Information', fields: otherFields },
  ].filter((section) => section.fields.length > 0);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => renderField(field))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

