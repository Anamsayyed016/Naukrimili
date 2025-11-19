'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiEntryField {
  [key: string]: string;
}

interface MultiEntryInputProps {
  label: string;
  value: MultiEntryField[];
  onChange: (value: MultiEntryField[]) => void;
  subFields: string[];
  required?: string[];
  className?: string;
}

export default function MultiEntryInput({
  label,
  value,
  onChange,
  subFields,
  required = [],
  className,
}: MultiEntryInputProps) {
  const addEntry = () => {
    const newEntry: MultiEntryField = {};
    subFields.forEach((field) => {
      newEntry[field] = '';
    });
    onChange([...value, newEntry]);
  };

  const removeEntry = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: string, fieldValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry}>
          <Plus className="w-4 h-4 mr-2" />
          Add {label}
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500 mb-4">No entries yet</p>
          <Button type="button" variant="outline" onClick={addEntry}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((entry, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium text-gray-900">
                    {label} #{index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {subFields.map((field) => {
                    const isTextarea = field.toLowerCase().includes('description') ||
                                      field.toLowerCase().includes('summary');
                    return (
                      <div key={field} className={isTextarea ? 'sm:col-span-2' : ''}>
                        <Label className="text-sm">
                          {field}
                          {required.includes(field) && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        {isTextarea ? (
                          <Textarea
                            value={entry[field] || ''}
                            onChange={(e) => updateEntry(index, field, e.target.value)}
                            placeholder={`Enter ${field.toLowerCase()}`}
                            rows={3}
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={entry[field] || ''}
                            onChange={(e) => updateEntry(index, field, e.target.value)}
                            placeholder={`Enter ${field.toLowerCase()}`}
                            className="mt-1"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

