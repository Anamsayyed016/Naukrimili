'use client';

/**
 * Resume Builder Editor Page
 * Modern multi-step resume creation flow with live preview
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import LivePreview from '@/components/resume-builder/LivePreview';
import ColorPicker from '@/components/resume-builder/ColorPicker';
import { useToast } from '@/hooks/use-toast';

// Import step components
import ContactsStep from '@/components/resume-builder/steps/ContactsStep';
import ExperienceStep from '@/components/resume-builder/steps/ExperienceStep';
import EducationStep from '@/components/resume-builder/steps/EducationStep';
import SkillsStep from '@/components/resume-builder/steps/SkillsStep';
import SummaryStep from '@/components/resume-builder/steps/SummaryStep';
import LanguagesStep from '@/components/resume-builder/steps/LanguagesStep';
import ProjectsStep from '@/components/resume-builder/steps/ProjectsStep';
import CertificationsStep from '@/components/resume-builder/steps/CertificationsStep';
import AchievementsStep from '@/components/resume-builder/steps/AchievementsStep';
import HobbiesStep from '@/components/resume-builder/steps/HobbiesStep';
import FinalizeStep from '@/components/resume-builder/steps/FinalizeStep';

import { loadTemplate } from '@/lib/resume-builder/template-loader';
import type { Template } from '@/lib/resume-builder/types';

export type StepId = 
  | 'contacts' 
  | 'experience' 
  | 'education' 
  | 'skills' 
  | 'summary' 
  | 'languages' 
  | 'projects' 
  | 'certifications' 
  | 'achievements' 
  | 'hobbies' 
  | 'finalize';

interface Step {
  id: StepId;
  label: string;
  icon?: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'summary', label: 'Summary' },
  { id: 'languages', label: 'Languages' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'hobbies', label: 'Hobbies' },
  { id: 'finalize', label: 'Finalize' },
];

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();

  const templateId = searchParams.get('template') || '';
  const typeId = searchParams.get('type') || '';

  // State
  const [currentStep, setCurrentStep] = useState<StepId>('contacts');
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Load template on mount
  useEffect(() => {
    async function loadTemplateData() {
      if (!templateId) {
        router.push('/resume-builder/templates');
        return;
      }

      try {
        setLoading(true);
        const loaded = await loadTemplate(templateId);
        
        if (!loaded) {
          toast({
            title: 'Template not found',
            description: 'The selected template could not be loaded.',
            variant: 'destructive',
          });
          router.push('/resume-builder/templates');
          return;
        }

        setTemplate(loaded.template);
        setSelectedColorId(loaded.template.defaultColor);
        
        // Load saved data if exists (from localStorage or API)
        const savedData = localStorage.getItem(`resume-${templateId}`);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setFormData(parsed);
          } catch (e) {
            console.error('Error parsing saved data:', e);
          }
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast({
          title: 'Error',
          description: 'Failed to load template. Please try again.',
          variant: 'destructive',
        });
        router.push('/resume-builder/templates');
      } finally {
        setLoading(false);
      }
    }

    loadTemplateData();
  }, [templateId, router, toast]);

  // Auto-save to localStorage
  useEffect(() => {
    if (templateId && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`resume-${templateId}`, JSON.stringify(formData));
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [formData, templateId]);

  // Calculate progress
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Navigation handlers
  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId);
    // Scroll to top on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      goToStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      goToStep(STEPS[currentIndex - 1].id);
    }
  };

  // Update form data
  const updateFormData = useCallback((updates: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Check if step is completed
  const isStepCompleted = (stepId: StepId): boolean => {
    switch (stepId) {
      case 'contacts':
        return !!(formData.firstName || formData.name || formData.email);
      case 'experience':
        return Array.isArray(formData.experience) && formData.experience.length > 0;
      case 'education':
        return Array.isArray(formData.education) && formData.education.length > 0;
      case 'skills':
        return Array.isArray(formData.skills) && formData.skills.length > 0;
      case 'summary':
        return !!(formData.summary || formData.bio);
      default:
        return true; // Optional steps
    }
  };

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

  if (!template) {
    return null;
  }

  // Render step content
  const renderStepContent = () => {
    const commonProps = {
      formData,
      updateFormData,
    };

    switch (currentStep) {
      case 'contacts':
        return <ContactsStep {...commonProps} />;
      case 'experience':
        return <ExperienceStep {...commonProps} />;
      case 'education':
        return <EducationStep {...commonProps} />;
      case 'skills':
        return <SkillsStep {...commonProps} />;
      case 'summary':
        return <SummaryStep {...commonProps} />;
      case 'languages':
        return <LanguagesStep {...commonProps} />;
      case 'projects':
        return <ProjectsStep {...commonProps} />;
      case 'certifications':
        return <CertificationsStep {...commonProps} />;
      case 'achievements':
        return <AchievementsStep {...commonProps} />;
      case 'hobbies':
        return <HobbiesStep {...commonProps} />;
      case 'finalize':
        return (
          <FinalizeStep
            {...commonProps}
            templateId={templateId}
            typeId={typeId}
            selectedColorId={selectedColorId}
            template={template}
            onSave={() => setSaving(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/resume-builder/templates${typeId ? `?type=${typeId}` : ''}`)}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{template.name}</h1>
                <p className="text-xs text-gray-500">Resume Builder</p>
              </div>
            </div>
            <div className="hidden lg:block">
              <Progress value={progress} className="w-64 h-2" />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Step {currentStepIndex + 1} of {STEPS.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6 lg:gap-8">
          {/* Left: Form Steps */}
          <div className="order-2 lg:order-1 min-w-0">
            {/* Mobile: Step Selector */}
            <div className="lg:hidden mb-6">
              <select
                value={currentStep}
                onChange={(e) => goToStep(e.target.value as StepId)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STEPS.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop: Step Navigation */}
            <div className="hidden lg:block mb-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {STEPS.map((step, index) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = isStepCompleted(step.id);
                  const isClickable = index <= currentStepIndex || isCompleted;

                  return (
                    <button
                      key={step.id}
                      onClick={() => isClickable && goToStep(step.id)}
                      disabled={!isClickable}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                        transition-all duration-200
                        ${isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : isCompleted
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                        ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {isCompleted && !isActive ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                      )}
                      {step.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="disabled:opacity-50"
              >
                Previous
              </Button>
              {currentStep !== 'finalize' && (
                <Button onClick={nextStep}>
                  Next
                </Button>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="order-1 lg:order-2 w-full lg:w-auto min-w-0">
            {/* Mobile: Preview Toggle */}
            <div className="lg:hidden mb-6">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>

            {/* Preview Container - Always visible on desktop, conditional on mobile */}
            <div className="sticky top-24 w-full">
              {/* Mobile: Conditional visibility */}
              <div className={`lg:hidden ${showPreview ? 'block' : 'hidden'} w-full`}>
                <LivePreview
                  templateId={templateId}
                  formData={formData}
                  selectedColorId={selectedColorId}
                  className="mb-6"
                />
                
                {/* Color Picker */}
                {template.colors && template.colors.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <ColorPicker
                      colors={template.colors}
                      selectedColorId={selectedColorId}
                      onColorChange={setSelectedColorId}
                    />
                  </div>
                )}
              </div>

              {/* Desktop: Always visible - Force display with inline style */}
              <div 
                className="hidden lg:block resume-editor-preview-desktop w-full"
              >
                <LivePreview
                  templateId={templateId}
                  formData={formData}
                  selectedColorId={selectedColorId}
                  className="mb-6"
                />
                
                {/* Color Picker */}
                {template.colors && template.colors.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <ColorPicker
                      colors={template.colors}
                      selectedColorId={selectedColorId}
                      onColorChange={setSelectedColorId}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
