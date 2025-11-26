'use client';

/**
 * Resume Builder Editor Page
 * 
 * Rebuilt with dynamic imports to avoid TDZ (Temporal Dead Zone) initialization errors.
 * All components are loaded dynamically inside useEffect hooks, not at module level.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, FileText, Download, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import { toast } from '@/hooks/use-toast';
import type { Template } from '@/lib/resume-builder/types';

// EditorStep type defined locally to avoid module-level imports
type EditorStep = 'personal' | 'experience' | 'skills' | 'education' | 'summary' | 'additional';

// Component types for dynamic loading
type StepComponent = React.ComponentType<{
  formData: Record<string, any>;
  onFieldChange: (field: string, value: any) => void;
  experienceLevel?: string;
}>;

type EditorComponents = {
  EditorStepper: React.ComponentType<{
    currentStep: EditorStep;
    completedSteps: EditorStep[];
    onStepClick: (step: EditorStep) => void;
    completeness?: number;
  }>;
  PersonalInfoStep: StepComponent;
  ExperienceStep: StepComponent;
  SkillsStep: StepComponent;
  EducationStep: StepComponent;
  SummaryStep: StepComponent;
  AdditionalStep: StepComponent;
  ColorPicker: React.ComponentType<{
    colors: Array<{ id: string; name: string; primary: string; accent: string; text: string }>;
    selectedColorId: string;
    onColorChange: (colorId: string) => void;
    className?: string;
  }>;
  LivePreview: React.ComponentType<{
    templateId: string;
    formData: Record<string, any>;
    selectedColorId?: string;
    className?: string;
  }>;
  ChangeTemplateModal: React.ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentTemplateId: string;
    currentColorId: string;
    formData: Record<string, any>;
    onTemplateChange: (templateId: string, colorId: string) => void;
  }>;
};

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();
  const templateId = searchParams.get('template');
  const typeId = searchParams.get('type');
  
  // Component loading state
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [components, setComponents] = useState<EditorComponents | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState<EditorStep>('personal');
  const [completedSteps, setCompletedSteps] = useState<EditorStep[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('experienced');
  const [showChangeTemplateModal, setShowChangeTemplateModal] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDOCX, setIsExportingDOCX] = useState(false);

  // Load all components dynamically to avoid TDZ issues
  useEffect(() => {
    let mounted = true;

    async function loadComponents() {
      try {
        // Load all components in parallel
        const [
          EditorStepperModule,
          PersonalInfoStepModule,
          ExperienceStepModule,
          SkillsStepModule,
          EducationStepModule,
          SummaryStepModule,
          AdditionalStepModule,
          ColorPickerModule,
          LivePreviewModule,
          ChangeTemplateModalModule,
        ] = await Promise.all([
          import('@/components/resume-builder/EditorStepper'),
          import('@/components/resume-builder/steps/PersonalInfoStep'),
          import('@/components/resume-builder/steps/ExperienceStep'),
          import('@/components/resume-builder/steps/SkillsStep'),
          import('@/components/resume-builder/steps/EducationStep'),
          import('@/components/resume-builder/steps/SummaryStep'),
          import('@/components/resume-builder/steps/AdditionalStep'),
          import('@/components/resume-builder/ColorPicker'),
          import('@/components/resume-builder/LivePreview'),
          import('@/components/resume-builder/ChangeTemplateModal'),
        ]);

        if (!mounted) return;

        setComponents({
          EditorStepper: EditorStepperModule.default,
          PersonalInfoStep: PersonalInfoStepModule.default,
          ExperienceStep: ExperienceStepModule.default,
          SkillsStep: SkillsStepModule.default,
          EducationStep: EducationStepModule.default,
          SummaryStep: SummaryStepModule.default,
          AdditionalStep: AdditionalStepModule.default,
          ColorPicker: ColorPickerModule.default,
          LivePreview: LivePreviewModule.default,
          ChangeTemplateModal: ChangeTemplateModalModule.default,
        });
        setComponentsLoaded(true);
      } catch (error) {
        if (!mounted) return;
        console.error('Error loading components:', error);
        setLoadingError(error instanceof Error ? error.message : 'Failed to load editor components');
      }
    }

    loadComponents();

    return () => {
      mounted = false;
    };
  }, []);

  // Load template metadata - reloads when templateId changes
  useEffect(() => {
    if (!templateId) return;
    let mounted = true;

    async function loadTemplate() {
      try {
        const { loadTemplateMetadata } = await import('@/lib/resume-builder/template-loader');
        const templateData = await loadTemplateMetadata(templateId);
        
        if (!mounted) return;

        if (templateData) {
          setTemplate(templateData);
          setSelectedColorId(templateData.defaultColor);
        } else {
          toast({
            title: '❌ Template Not Found',
            description: 'The selected template could not be loaded. Redirecting to template selection...',
            variant: 'destructive',
          });
          router.push(`/resume-builder/templates?type=${typeId || 'experienced'}`);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error loading template:', error);
        toast({
          title: '❌ Load Failed',
          description: 'Failed to load template. Please try again.',
          variant: 'destructive',
        });
      }
    }

    loadTemplate();

    return () => {
      mounted = false;
    };
  }, [templateId, typeId, router]);

  // Determine experience level from typeId
  useEffect(() => {
    if (!typeId) {
      setExperienceLevel('experienced');
      setFormData((prev) => ({ ...prev, experienceLevel: 'experienced' }));
      return;
    }

    let mounted = true;

    async function loadResumeType() {
      try {
        const resumeTypesData = await import('@/lib/resume-builder/resume-types.json');
        const resumeType = resumeTypesData.default.resumeTypes.find((type: any) => type.id === typeId);
        
        if (!mounted) return;

        if (resumeType) {
          let level = 'experienced';
          if (resumeType.id === 'fresher' || resumeType.id === 'student') {
            level = 'fresher';
          } else if (resumeType.id === 'senior') {
            level = 'senior';
          }
          setExperienceLevel(level);
          setFormData((prev) => ({ ...prev, experienceLevel: resumeType.id }));
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error loading resume type:', error);
        setExperienceLevel('experienced');
        setFormData((prev) => ({ ...prev, experienceLevel: 'experienced' }));
      }
    }

    loadResumeType();

    return () => {
      mounted = false;
    };
  }, [typeId]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!templateId) return;
    const resumeType = typeId || 'experienced';
    const saved = localStorage.getItem(`resume-builder-${templateId}-${resumeType}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || {});
        setCompletedSteps(parsed.completedSteps || []);
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [templateId, typeId]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!templateId || Object.keys(formData).length === 0) return;
    const resumeType = typeId || 'experienced';
    const saveData = {
      formData,
      completedSteps,
      currentStep,
    };
    localStorage.setItem(`resume-builder-${templateId}-${resumeType}`, JSON.stringify(saveData));
  }, [formData, completedSteps, currentStep, templateId, typeId]);

  // Field change handler
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      return updated;
    });

    // Mark current step as completed if required fields are filled
    const currentStepData = getStepCompletionStatus(currentStep, { ...formData, [field]: value });
    if (currentStepData.isComplete && !completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }
  };

  // Step completion checker
  const getStepCompletionStatus = (step: EditorStep, data: Record<string, any>) => {
    switch (step) {
      case 'personal':
        return {
          isComplete: !!(data.firstName || data['First Name']) && !!(data.email || data['Email']),
          completeness: 0,
        };
      case 'experience':
        const experience = data.experience || data['Work Experience'] || [];
        return {
          isComplete: Array.isArray(experience) && experience.length > 0,
          completeness: 0,
        };
      case 'skills':
        const skills = data.skills || data['Skills'] || [];
        return {
          isComplete: Array.isArray(skills) && skills.length > 0,
          completeness: 0,
        };
      case 'education':
        const education = data.education || data['Education'] || [];
        return {
          isComplete: Array.isArray(education) && education.length > 0,
          completeness: 0,
        };
      case 'summary':
        const summary = data.summary || data['Professional Summary'] || '';
        return {
          isComplete: !!summary && summary.trim().length > 0,
          completeness: 0,
        };
      case 'additional':
        return {
          isComplete: true, // Additional is optional
          completeness: 0,
        };
      default:
        return { isComplete: false, completeness: 0 };
    }
  };

  // Calculate overall completeness
  const calculateCompleteness = (): number => {
    const steps: EditorStep[] = ['personal', 'experience', 'skills', 'education', 'summary', 'additional'];
    const completed = steps.filter((step) => {
      const status = getStepCompletionStatus(step, formData);
      return status.isComplete;
    });
    return Math.round((completed.length / steps.length) * 100);
  };

  const completeness = calculateCompleteness();

  // Step navigation
  const steps: EditorStep[] = ['personal', 'experience', 'skills', 'education', 'summary', 'additional'];
  const currentStepIndex = steps.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      const nextStep = steps[currentStepIndex + 1];
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = steps[currentStepIndex - 1];
      setCurrentStep(prevStep);
    }
  };

  const handleStepClick = (step: EditorStep) => {
    const stepIndex = steps.indexOf(step);
    const lastCompletedIndex = completedSteps.length > 0 
      ? Math.max(...completedSteps.map(s => steps.indexOf(s)))
      : -1;
    
    if (stepIndex <= lastCompletedIndex + 1) {
      setCurrentStep(step);
    }
  };

  // Save resume
  const handleSave = async () => {
    if (!templateId) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/resume-builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          formData,
          colorId: selectedColorId,
        }),
      });

      if (!response.ok) throw new Error('Failed to save resume');

      toast({
        title: '✅ Resume Saved',
        description: 'Your resume has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: '❌ Save Failed',
        description: 'Failed to save resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export functions
  const handleExportPDF = async () => {
    if (!templateId) return;
    setIsExportingPDF(true);
    try {
      const response = await fetch(`/api/resume-builder/export?templateId=${templateId}&format=pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, colorId: selectedColorId }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${templateId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: '❌ Export Failed',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportDOCX = async () => {
    if (!templateId) return;
    setIsExportingDOCX(true);
    try {
      const response = await fetch(`/api/resume-builder/export?templateId=${templateId}&format=docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, colorId: selectedColorId }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${templateId}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      toast({
        title: '❌ Export Failed',
        description: 'Failed to export DOCX. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingDOCX(false);
    }
  };

  // Template change handler - navigates to new template, effect will reload
  const handleTemplateChange = (newTemplateId: string, newColorId: string) => {
    setShowChangeTemplateModal(false);
    // Update URL - this will trigger the template loading effect to reload
    router.push(`/resume-builder/editor?template=${newTemplateId}&type=${typeId || 'experienced'}`);
  };

  // Loading state
  if (!templateId || !template || !componentsLoaded || !components) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {loadingError ? (
            <>
              <div className="text-red-600 mb-4">⚠️ Error loading editor</div>
              <p className="text-sm text-gray-600 mb-4">{loadingError}</p>
              <Button onClick={() => router.push('/resume-builder/templates')}>
                Back to Templates
              </Button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading editor...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render current step content
  const renderStepContent = () => {
    if (!components) return null;

    const stepProps = {
      formData,
      onFieldChange: handleFieldChange,
      experienceLevel,
    };

    switch (currentStep) {
      case 'personal':
        return <components.PersonalInfoStep {...stepProps} />;
      case 'experience':
        return <components.ExperienceStep {...stepProps} />;
      case 'skills':
        return <components.SkillsStep {...stepProps} />;
      case 'education':
        return <components.EducationStep {...stepProps} />;
      case 'summary':
        return <components.SummaryStep {...stepProps} />;
      case 'additional':
        return <components.AdditionalStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/resume-builder/templates?type=${typeId || 'experienced'}`)}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Resume Editor</h1>
                <p className="text-sm text-gray-500">{template.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDOCX}
                disabled={isExportingDOCX}
              >
                <Download className="w-4 h-4 mr-2" />
                DOCX
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className={cn(
          "grid gap-6 lg:gap-8",
          isMobile ? "grid-cols-1" : "lg:grid-cols-[320px_1fr_400px]"
        )}>
          {/* Left Sidebar - Stepper */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {components.EditorStepper && (
                <components.EditorStepper
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                  completeness={completeness}
                />
              )}
            </div>
          </div>

          {/* Center - Form Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
            {renderStepContent()}
            
            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={isLastStep}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Preview & Color Picker */}
          <div className="space-y-6">
            {/* Color Picker */}
            {template.colors && template.colors.length > 0 && components.ColorPicker && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <components.ColorPicker
                  colors={template.colors}
                  selectedColorId={selectedColorId}
                  onColorChange={setSelectedColorId}
                />
              </div>
            )}

            {/* Live Preview */}
            {components.LivePreview && (
              <components.LivePreview
                templateId={templateId}
                formData={formData}
                selectedColorId={selectedColorId}
              />
            )}

            {/* Change Template Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowChangeTemplateModal(true)}
            >
              <Palette className="w-4 h-4 mr-2" />
              Change Template
            </Button>
          </div>
        </div>
      </div>

      {/* Change Template Modal */}
      {components.ChangeTemplateModal && (
        <components.ChangeTemplateModal
          open={showChangeTemplateModal}
          onOpenChange={setShowChangeTemplateModal}
          currentTemplateId={templateId}
          currentColorId={selectedColorId}
          formData={formData}
          onTemplateChange={handleTemplateChange}
        />
      )}
    </div>
  );
}
