'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FinalizeStepProps {
  formData: Record<string, any>;
  onSave: () => void;
  onExport?: () => void;
  isSaving?: boolean;
}

export default function FinalizeStep({
  formData,
  onSave,
  onExport,
  isSaving = false,
}: FinalizeStepProps) {
  const sections = [
    { label: 'Contact Information', key: 'contacts', fields: ['firstName', 'lastName', 'email', 'phone'] },
    { label: 'Experience', key: 'experience', fields: ['experience'] },
    { label: 'Education', key: 'education', fields: ['education'] },
    { label: 'Skills', key: 'skills', fields: ['skills'] },
    { label: 'Summary', key: 'summary', fields: ['summary'] },
  ];

  const getSectionStatus = (section: typeof sections[0]) => {
    const hasData = section.fields.some((field) => {
      const value = formData[field];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim().length > 0;
    });
    return hasData;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalize</h2>
        <p className="text-gray-600">
          Review your resume and save it when you're ready.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const isComplete = getSectionStatus(section);
          return (
            <Card key={section.key} className={isComplete ? 'border-green-200 bg-green-50' : ''}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={cn('font-medium', isComplete ? 'text-green-700' : 'text-gray-600')}>
                    {section.label}
                  </span>
                </div>
                <span className={cn('text-sm', isComplete ? 'text-green-600' : 'text-gray-400')}>
                  {isComplete ? 'Complete' : 'Incomplete'}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-4 pt-6">
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1"
          size="lg"
        >
          <FileText className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Resume'}
        </Button>
        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            className="flex-1"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        )}
      </div>
    </div>
  );
}

