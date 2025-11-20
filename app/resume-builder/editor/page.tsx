'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import StepperNav, { type Step } from '@/components/resume-builder/StepperNav';
import ContactsStep from '@/components/resume-builder/steps/ContactsStep';
import ExperienceStep from '@/components/resume-builder/steps/ExperienceStep';
import EducationStep from '@/components/resume-builder/steps/EducationStep';
import SkillsStep from '@/components/resume-builder/steps/SkillsStep';
import SummaryStep from '@/components/resume-builder/steps/SummaryStep';
import FinalizeStep from '@/components/resume-builder/steps/FinalizeStep';
import LivePreview from '@/components/resume-builder/LivePreview';
import ColorVariantPicker from '@/components/resume-builder/ColorVariantPicker';
import { loadTemplateMetadata, type Template } from '@/lib/resume-builder/template-loader';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import { toast } from '@/hooks/use-toast';

const steps: Step[] = ['contacts', 'experience', 'education', 'skills', 'summary', 'finalize'];

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();
  const templateId = searchParams.get('template');
  const typeId = searchParams.get('type');
  
  const [currentStep, setCurrentStep] = useState<Step>('contacts');
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');

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
          const data = JSON.parse(saved);
          setFormData(data);
          // Determine completed steps
          const completed: Step[] = [];
          if (data.firstName || data.lastName || data.email) completed.push('contacts');
          if (data.experience?.length > 0) completed.push('experience');
          if (data.education?.length > 0) completed.push('education');
          if (data.skills?.length > 0) completed.push('skills');
          if (data.summary) completed.push('summary');
          setCompletedSteps(completed);
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

  // Update completed steps
  useEffect(() => {
    const completed: Step[] = [];
    if (formData.firstName || formData.lastName || formData.email) completed.push('contacts');
    if (formData.experience?.length > 0) completed.push('experience');
    if (formData.education?.length > 0) completed.push('education');
    if (formData.skills?.length > 0) completed.push('skills');
    if (formData.summary) completed.push('summary');
    setCompletedSteps(completed);
  }, [formData]);

  useEffect(() => {
    if (!templateId || !typeId) {
      router.push('/resume-builder/templates');
    }
  }, [templateId, typeId, router]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: Step) => {
    const currentIndex = steps.indexOf(currentStep);
    const targetIndex = steps.indexOf(step);
    
    // Allow navigation to completed steps or next step
    if (completedSteps.includes(step) || targetIndex <= currentIndex + 1) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        localStorage.removeItem(`resume-builder-${templateId}-${typeId}`);
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

  // Get experience level from typeId
  const getExperienceLevel = (typeId: string | null): string => {
    if (!typeId) return 'experienced';
    const normalized = typeId.toLowerCase();
    if (normalized.includes('fresher') || normalized.includes('fresh')) return 'fresher';
    if (normalized.includes('student') || normalized.includes('intern')) return 'student';
    if (normalized.includes('senior') || normalized.includes('executive')) return 'senior';
    return 'experienced';
  };

  const experienceLevel = getExperienceLevel(typeId);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contacts':
        return <ContactsStep formData={formData} onFieldChange={handleFieldChange} />;
      case 'experience':
        return <ExperienceStep formData={formData} onFieldChange={handleFieldChange} experienceLevel={experienceLevel} />;
      case 'education':
        return <EducationStep formData={formData} onFieldChange={handleFieldChange} />;
      case 'skills':
        return <SkillsStep formData={formData} onFieldChange={handleFieldChange} />;
      case 'summary':
        return <SummaryStep formData={formData} onFieldChange={handleFieldChange} experienceLevel={experienceLevel} />;
      case 'finalize':
        return <FinalizeStep formData={formData} onSave={handleSave} isSaving={isSaving} />;
      default:
        return null;
    }
  };

  if (!templateId || !typeId || !template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.indexOf(currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>

        {/* Main Layout */}
        <div className={cn(
          "grid gap-8",
          isMobile ? "grid-cols-1" : "lg:grid-cols-[250px_1fr_400px]"
        )}>
          {/* Left Sidebar - Stepper */}
          {!isMobile && (
            <div className="sticky top-24 h-fit">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <StepperNav
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                />
              </div>
            </div>
          )}

          {/* Center - Form Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            {/* Mobile Progress Bar */}
            {isMobile && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {renderStepContent()}

            {/* Navigation Buttons */}
            {currentStep !== 'finalize' && (
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  className={cn(
                    currentStepIndex === 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next: {steps[currentStepIndex + 1]?.charAt(0).toUpperCase() + steps[currentStepIndex + 1]?.slice(1)}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* Right Sidebar - Preview */}
          {!isMobile && template && (
            <div className="sticky top-24 h-fit space-y-4">
              <LivePreview
                templateId={templateId}
                formData={formData}
                selectedColorId={selectedColorId}
                resumeScore={0}
              />
              
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
