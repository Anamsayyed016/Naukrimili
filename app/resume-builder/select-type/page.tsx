'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ResumeTypeSelector from '@/components/resume-builder/ResumeTypeSelector';
import resumeTypesData from '@/lib/resume-builder/resume-types.json';
import { cn } from '@/lib/utils';

export default function ResumeTypeSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) {
      router.push('/resume-builder/templates');
    }
  }, [templateId, router]);

  const handleContinue = () => {
    if (selectedType && templateId) {
      router.push(`/resume-builder/editor?template=${templateId}&type=${selectedType}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/resume-builder/templates')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Choose Resume Type
          </h1>
          <p className="text-gray-600">
            Select the type that best matches your experience level
          </p>
        </div>

        {/* Resume Type Cards */}
        <div className="mb-8">
          <ResumeTypeSelector
            types={resumeTypesData.resumeTypes}
            selectedType={selectedType}
            onSelectType={setSelectedType}
          />
        </div>

        {/* Continue Button */}
        {selectedType && (
          <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
              size="lg"
            >
              Continue to Editor
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

