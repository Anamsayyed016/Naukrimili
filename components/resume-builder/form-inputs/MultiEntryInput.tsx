'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextareaWithATS from './TextareaWithATS';

interface SubField {
  name: string;
  type?: 'text' | 'textarea' | 'textarea-ats' | 'select';
  placeholder?: string;
  enableATS?: boolean;
  formData?: Record<string, any>;
  experienceLevel?: string;
  options?: string[] | Array<{ value: string; label: string }>;
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
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div>
          <Label className="text-lg font-semibold text-gray-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {value.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{value.length} {value.length === 1 ? 'entry' : 'entries'}</p>
          )}
        </div>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={addEntry}
          className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Entry</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="space-y-5">
        {value.map((entry, index) => (
          <div
            key={index}
            className="group relative p-5 md:p-6 border border-gray-200 rounded-xl space-y-4 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-blue-300"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm shadow-md">
                  {index + 1}
                </div>
                <span className="text-base font-semibold text-gray-800">
                  {label} #{index + 1}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeEntry(index)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove entry"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subFields.map((subField) => (
                <div 
                  key={subField.name} 
                  className={cn(
                    subField.type === 'textarea' || subField.type === 'textarea-ats' ? 'md:col-span-2' : '',
                    'space-y-2'
                  )}
                >
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    {subField.name}
                    {subField.type === 'textarea-ats' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full border border-blue-200">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                        AI-powered
                      </span>
                    )}
                  </Label>
                  {subField.type === 'textarea-ats' && subField.enableATS ? (
                    <TextareaWithATS
                      label=""
                      value={entry[subField.name] || ''}
                      onChange={(val) => updateEntry(index, subField.name, val)}
                      placeholder={subField.placeholder}
                      rows={4}
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
                      rows={4}
                      className="resize-none border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  ) : subField.type === 'select' && subField.options ? (
                    <Select
                      value={entry[subField.name] || undefined}
                      onValueChange={(val) => updateEntry(index, subField.name, val)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                        <SelectValue placeholder={subField.placeholder || 'Select an option'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[60vh] sm:max-h-96">
                        {subField.options.map((option) => {
                          const optionValue = typeof option === 'string' ? option : option.value;
                          const optionLabel = typeof option === 'string' ? option : option.label;
                          return (
                            <SelectItem key={optionValue} value={optionValue}>
                              {optionLabel}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={entry[subField.name] || ''}
                      onChange={(e) => updateEntry(index, subField.name, e.target.value)}
                      placeholder={subField.placeholder}
                      className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white hover:border-gray-400"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {value.length === 0 && (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-base font-medium text-gray-700 mb-2">No {label.toLowerCase()} entries yet</p>
              <p className="text-sm text-gray-500 mb-4">Click the button below to add your first entry</p>
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={addEntry}
                className="flex items-center gap-2 mx-auto shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="w-5 h-5" />
                Add {label}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

