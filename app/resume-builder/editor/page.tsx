'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { loadTemplateMetadata, type Template } from '@/lib/resume-builder/template-loader';
import { useState, useEffect } from 'react';

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId) {
      loadTemplateMetadata(templateId).then((templateData) => {
        setTemplate(templateData);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [templateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!templateId || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Template not found</p>
          <Button onClick={() => router.push('/resume-builder/templates')}>
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/resume-builder/templates')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resume Editor
          </h1>
          <p className="text-gray-600">
            Template: {template.name}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">
            Form Editor (Step 2) - To be implemented
          </p>
          <p className="text-sm text-gray-500">
            Selected Template: <strong>{template.name}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

