'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextareaWithATS from './TextareaWithATS';

interface SubField {
  name: string;
  type?: 'text' | 'textarea' | 'textarea-ats';
  placeholder?: string;
  enableATS?: boolean;
  formData?: Record<string, any>;
  experienceLevel?: string;
}

interface MultiEntryInputProps {
  label: string;
  value: Array<Record<string, string>>;
  onChange: (value: Array<Record<string, string>>) => void;
  subFields: SubField[];
  required?: boolean;
  className?: string;
}

export default function MultiEntryInput({
  label,
  value,
  onChange,
  subFields,
  required = false,
  className,
}: MultiEntryInputProps) {
  const addEntry = () => {
    const newEntry: Record<string, string> = {};
    subFields.forEach((field) => {
      newEntry[field.name] = '';
    });
    onChange([...value, newEntry]);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, fieldName: string, fieldValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [fieldName]: fieldValue };
    onChange(updated);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEntry}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      <div className="space-y-4">
        {value.map((entry, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {label} #{index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEntry(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subFields.map((subField) => (
                <div key={subField.name} className={subField.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <Label className="text-xs text-gray-600 mb-1">
                    {subField.name}
                  </Label>
                  {subField.type === 'textarea-ats' && subField.enableATS ? (
                    <TextareaWithATS
                      label=""
                      value={entry[subField.name] || ''}
                      onChange={(val) => updateEntry(index, subField.name, val)}
                      placeholder={subField.placeholder}
                      rows={3}
                      fieldType="description"
                      formData={subField.formData || {}}
                      experienceLevel={subField.experienceLevel || 'experienced'}
                      className="resize-none"
                    />
                  ) : subField.type === 'textarea' ? (
                    <Textarea
                      value={entry[subField.name] || ''}
                      onChange={(e) => updateEntry(index, subField.name, e.target.value)}
                      placeholder={subField.placeholder}
                      rows={3}
                      className="resize-none"
                    />
                  ) : (
                    <Input
                      value={entry[subField.name] || ''}
                      onChange={(e) => updateEntry(index, subField.name, e.target.value)}
                      placeholder={subField.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {value.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">No entries yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEntry}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add {label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

