'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import ResumeDynamicForm from '@/components/resume-builder/ResumeDynamicForm';
import TemplateRenderer from '@/components/resume-builder/TemplateRenderer';
import ColorVariantPicker from '@/components/resume-builder/ColorVariantPicker';
import { loadTemplateMetadata, type Template } from '@/lib/resume-builder/template-loader';
import resumeTypesData from '@/lib/resume-builder/resume-types.json';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import { toast } from '@/hooks/use-toast';

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();
  const templateId = searchParams.get('template');
  const typeId = searchParams.get('type');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');

  // Get fields for selected resume type
  const resumeType = resumeTypesData.resumeTypes.find((t) => t.id === typeId);
  const fields = resumeType?.fields || [];

  // Load template metadata
  useEffect(() => {
    if (templateId) {
      loadTemplateMetadata(templateId).then((templateData) => {
        if (templateData) {
          setTemplate(templateData);
          setSelectedColorId(templateData.defaultColor);
        }
      });
    }
  }, [templateId]);

  // Load from localStorage on mount
  useEffect(() => {
    if (templateId && typeId) {
      const saved = localStorage.getItem(`resume-builder-${templateId}-${typeId}`);
      if (saved) {
        try {
          setFormData(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load saved data:', e);
        }
      }
    }
  }, [templateId, typeId]);

  // Auto-save to localStorage
  useEffect(() => {
    if (templateId && typeId && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        localStorage.setItem(
          `resume-builder-${templateId}-${typeId}`,
          JSON.stringify(formData)
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, templateId, typeId]);

  useEffect(() => {
    if (!templateId || !typeId) {
      router.push('/resume-builder/templates');
    }
  }, [templateId, typeId, router]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!templateId || !typeId) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/resume-builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          resumeType: typeId,
          formData,
          colorScheme: selectedColorId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Resume Saved',
          description: 'Your resume has been saved successfully.',
        });
        // Clear localStorage
        localStorage.removeItem(`resume-builder-${templateId}-${typeId}`);
        // Redirect to resumes page
        setTimeout(() => {
          router.push('/resumes');
        }, 1500);
      } else {
        throw new Error('Failed to save resume');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!templateId || !typeId || !resumeType) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/resume-builder/select-type?template=${templateId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Build Your Resume
              </h1>
              <p className="text-gray-600">
                Fill in your information to create a professional resume
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Resume'}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Layout */}
        <div className={cn(
          "grid gap-8",
          isMobile ? "grid-cols-1" : "lg:grid-cols-[1fr_400px]"
        )}>
          {/* Form Section */}
          <div>
            <ResumeDynamicForm
              fields={fields}
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          </div>

          {/* Preview Section - Desktop Only */}
          {!isMobile && template && (
            <div className="sticky top-24 h-fit space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>
                <TemplateRenderer
                  templateId={templateId!}
                  formData={formData}
                  selectedColorId={selectedColorId}
                  className="min-h-[600px]"
                />
              </div>
              
              {/* Color Picker */}
              <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                <ColorVariantPicker
                  colors={template.colors}
                  selectedColorId={selectedColorId}
                  onColorChange={setSelectedColorId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

