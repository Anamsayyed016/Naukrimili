'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, FileText, Download } from 'lucide-react';
import { loadTemplateMetadata, type Template } from '@/lib/resume-builder/template-loader';
import EditorStepper, { type EditorStep } from '@/components/resume-builder/EditorStepper';
import PersonalInfoStep from '@/components/resume-builder/steps/PersonalInfoStep';
import ExperienceStep from '@/components/resume-builder/steps/ExperienceStep';
import SkillsStep from '@/components/resume-builder/steps/SkillsStep';
import EducationStep from '@/components/resume-builder/steps/EducationStep';
import SummaryStep from '@/components/resume-builder/steps/SummaryStep';
import AdditionalStep from '@/components/resume-builder/steps/AdditionalStep';
import LivePreview from '@/components/resume-builder/LivePreview';
import ColorPicker from '@/components/resume-builder/ColorPicker';
import ChangeTemplateModal from '@/components/resume-builder/ChangeTemplateModal';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import resumeTypesData from '@/lib/resume-builder/resume-types.json';
import { Palette } from 'lucide-react';

const steps: EditorStep[] = ['personal', 'experience', 'skills', 'education', 'summary', 'additional'];

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();
  const [templateId, setTemplateId] = useState<string | null>(searchParams.get('template'));
  const typeId = searchParams.get('type');
  
  // Update templateId when URL changes
  useEffect(() => {
    const urlTemplateId = searchParams.get('template');
    if (urlTemplateId && urlTemplateId !== templateId) {
      setTemplateId(urlTemplateId);
    }
  }, [searchParams]);
  
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

  // Determine experience level from typeId
  useEffect(() => {
    if (typeId) {
      const resumeType = resumeTypesData.resumeTypes.find((type: any) => type.id === typeId);
      if (resumeType) {
        if (resumeType.id === 'fresher' || resumeType.id === 'student') {
          setExperienceLevel('fresher');
        } else if (resumeType.id === 'senior') {
          setExperienceLevel('senior');
        } else {
          setExperienceLevel('experienced');
        }
        // Set experience level in formData
        setFormData((prev) => ({ ...prev, experienceLevel: resumeType.id }));
      }
    } else {
      // Default to experienced if no type is provided
      setExperienceLevel('experienced');
      setFormData((prev) => ({ ...prev, experienceLevel: 'experienced' }));
    }
  }, [typeId]);

  // Load from localStorage on mount
  useEffect(() => {
    if (templateId) {
      const resumeType = typeId || 'experienced';
      const saved = localStorage.getItem(`resume-builder-${templateId}-${resumeType}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setFormData(data);
          // Determine completed steps
          const completed: EditorStep[] = [];
          if (data.firstName || data.lastName || data.email) completed.push('personal');
          if (data.experience?.length > 0 || data['Work Experience']?.length > 0) completed.push('experience');
          if (data.skills?.length > 0) completed.push('skills');
          if (data.education?.length > 0 || data['Education']?.length > 0) completed.push('education');
          if (data.summary || data['Professional Summary']) completed.push('summary');
          if (data.projects?.length > 0 || data.certifications?.length > 0) completed.push('additional');
          setCompletedSteps(completed);
        } catch (e) {
          console.error('Failed to load saved data:', e);
        }
      }
    }
  }, [templateId, typeId]);

  // Auto-save to localStorage
  useEffect(() => {
    if (templateId && Object.keys(formData).length > 0) {
      const resumeType = typeId || 'experienced';
      const saveKey = `resume-builder-${templateId}-${resumeType}`;
      localStorage.setItem(saveKey, JSON.stringify(formData));
    }
  }, [formData, templateId, typeId]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Update completed steps
      const completed: EditorStep[] = [];
      if (updated.firstName || updated.lastName || updated.email) completed.push('personal');
      if (updated.experience?.length > 0 || updated['Work Experience']?.length > 0) completed.push('experience');
      if (updated.skills?.length > 0) completed.push('skills');
      if (updated.education?.length > 0 || updated['Education']?.length > 0) completed.push('education');
      if (updated.summary || updated['Professional Summary'] || updated['Career Objective']) completed.push('summary');
      if (updated.projects?.length > 0 || updated.certifications?.length > 0) completed.push('additional');
      setCompletedSteps(completed);
      
      return updated;
    });
  };

  const handleStepClick = (step: EditorStep) => {
    setCurrentStep(step);
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleTemplateChange = (newTemplateId: string, newColorId: string) => {
    // Update URL without navigation to preserve state
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('template', newTemplateId);
    window.history.replaceState({}, '', newUrl.toString());
    
    // Update templateId state
    setTemplateId(newTemplateId);
    
    // Update template and color
    loadTemplateMetadata(newTemplateId).then((templateData) => {
      if (templateData) {
        setTemplate(templateData);
        // Use the new color if it exists in the new template, otherwise use default
        const colorExists = templateData.colors.some((c) => c.id === newColorId);
        setSelectedColorId(colorExists ? newColorId : templateData.defaultColor);
      }
    });
    
    // Save formData to new template's localStorage key
    if (Object.keys(formData).length > 0 && templateId) {
      const resumeType = typeId || 'experienced';
      const oldKey = `resume-builder-${templateId}-${resumeType}`;
      const newKey = `resume-builder-${newTemplateId}-${resumeType}`;
      const saved = localStorage.getItem(oldKey);
      if (saved) {
        localStorage.setItem(newKey, saved);
      }
    }
  };

  const handleSave = async () => {
    if (!templateId) {
      alert('Missing template');
      return;
    }
    
    // Use default type if not provided
    const resumeType = typeId || 'experienced';

    setIsSaving(true);
    try {
      const response = await fetch('/api/resume-builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          resumeType: resumeType,
          formData,
          colorScheme: selectedColorId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Resume saved successfully!');
      } else {
        alert('Failed to save resume: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!templateId) {
      alert('Missing template');
      return;
    }

    setIsExportingPDF(true);
    try {
      const response = await fetch('/api/resume-builder/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          formData,
          selectedColorId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${templateId}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportDOCX = async () => {
    if (!templateId) {
      alert('Missing template');
      return;
    }

    setIsExportingDOCX(true);
    try {
      const response = await fetch('/api/resume-builder/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          formData,
          selectedColorId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate DOCX');
      }

      // Get the DOCX blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${templateId}-${Date.now()}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Failed to export DOCX. Please try again.');
    } finally {
      setIsExportingDOCX(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'personal':
        return <PersonalInfoStep formData={formData} onFieldChange={handleFieldChange} />;
      case 'experience':
        return <ExperienceStep formData={formData} onFieldChange={handleFieldChange} experienceLevel={experienceLevel} />;
      case 'skills':
        return <SkillsStep formData={formData} onFieldChange={handleFieldChange} experienceLevel={experienceLevel} />;
      case 'education':
        return <EducationStep formData={formData} onFieldChange={handleFieldChange} />;
      case 'summary':
        return <SummaryStep formData={formData} onFieldChange={handleFieldChange} experienceLevel={experienceLevel} />;
      case 'additional':
        return <AdditionalStep formData={formData} onFieldChange={handleFieldChange} experienceLevel={experienceLevel} />;
      default:
        return null;
    }
  };

  if (!templateId || !template) {
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
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/resume-builder/templates')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Resume Editor
              </h1>
              <p className="text-gray-600">
                Template: {template.name}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setShowChangeTemplateModal(true)}
                className="flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Change Template
              </Button>
              <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || isExportingDOCX}
                  className="flex items-center gap-2"
                  title="Export as PDF"
                >
                  <FileText className="w-4 h-4" />
                  {isExportingPDF ? 'Exporting...' : 'PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportDOCX}
                  disabled={isExportingPDF || isExportingDOCX}
                  className="flex items-center gap-2"
                  title="Export as DOCX"
                >
                  <Download className="w-4 h-4" />
                  {isExportingDOCX ? 'Exporting...' : 'DOCX'}
                </Button>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Resume'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className={cn(
          "grid gap-8",
          isMobile ? "grid-cols-1" : "lg:grid-cols-[250px_1fr_400px]"
        )}>
          {/* Left Sidebar - Stepper */}
          {!isMobile && (
            <div className="sticky top-24 h-fit">
              <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
                <EditorStepper
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                />
              </div>
            </div>
          )}

          {/* Center - Form Content */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
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
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {!isLastStep ? (
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save & Finish'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Preview & Color Picker */}
          {!isMobile && (
            <div className="space-y-6">
              {/* Color Picker */}
              {template.colors && template.colors.length > 0 && (
                <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
                  <ColorPicker
                    colors={template.colors}
                    selectedColorId={selectedColorId}
                    onColorChange={setSelectedColorId}
                  />
                </div>
              )}

              {/* Live Preview */}
              <LivePreview
                templateId={templateId}
                formData={formData}
                selectedColorId={selectedColorId}
              />
            </div>
          )}
        </div>

        {/* Mobile Preview (below form) */}
        {isMobile && (
          <div className="mt-8 space-y-6">
            {template.colors && template.colors.length > 0 && (
              <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
                <ColorPicker
                  colors={template.colors}
                  selectedColorId={selectedColorId}
                  onColorChange={setSelectedColorId}
                />
              </div>
            )}
            <LivePreview
              templateId={templateId}
              formData={formData}
              selectedColorId={selectedColorId}
            />
          </div>
        )}

        {/* Change Template Modal */}
        {templateId && (
          <ChangeTemplateModal
            open={showChangeTemplateModal}
            onOpenChange={setShowChangeTemplateModal}
            currentTemplateId={templateId}
            currentColorId={selectedColorId}
            formData={formData}
            onTemplateChange={handleTemplateChange}
          />
        )}
      </div>
    </div>
  );
}
