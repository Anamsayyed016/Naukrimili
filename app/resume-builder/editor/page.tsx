'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, FileText, Download } from 'lucide-react';
import { loadTemplateMetadata, type Template } from '@/lib/resume-builder/template-loader';
import EditorStepper, { type EditorStep } from '@/components/resume-builder/EditorStepper';
import PersonalInfoStep from '@/components/resume-builder/steps/PersonalInfoStep';
import ExperienceStep from '@/components/resume-builder/steps/ExperienceStep';
import SkillsStep from '@/components/resume-builder/steps/SkillsStep';
import SummaryStep from '@/components/resume-builder/steps/SummaryStep';
import AdditionalStep from '@/components/resume-builder/steps/AdditionalStep';
import LivePreview from '@/components/resume-builder/LivePreview';
import ColorPicker from '@/components/resume-builder/ColorPicker';
import ChangeTemplateModal from '@/components/resume-builder/ChangeTemplateModal';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import resumeTypesData from '@/lib/resume-builder/resume-types.json';
import { Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Lazy load EducationStep to avoid module initialization issues
const EducationStep = lazy(() => import('@/components/resume-builder/steps/EducationStep'));

export default function ResumeEditorPage() {
  // Define steps inside component to avoid module-level initialization issues
  const steps: EditorStep[] = ['personal', 'experience', 'skills', 'education', 'summary', 'additional'];
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

  // Calculate resume completeness percentage
  const calculateCompleteness = (data: Record<string, any>): number => {
    let totalFields = 0;
    let filledFields = 0;

    // Personal Info (20%)
    const personalFields = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'location'];
    personalFields.forEach(field => {
      totalFields++;
      if (data[field] && String(data[field]).trim()) filledFields++;
    });

    // Experience (25%)
    const hasExperience = (data.experience?.length > 0 || data['Work Experience']?.length > 0);
    totalFields += 5;
    if (hasExperience) filledFields += 5;

    // Skills (15%)
    const hasSkills = Array.isArray(data.skills) && data.skills.length > 0;
    totalFields += 3;
    if (hasSkills) filledFields += 3;

    // Education (15%)
    const hasEducation = (data.education?.length > 0 || data['Education']?.length > 0);
    totalFields += 3;
    if (hasEducation) filledFields += 3;

    // Summary (15%)
    const hasSummary = !!(data.summary || data['Professional Summary'] || data['Career Objective'] || data['Executive Summary']);
    totalFields += 3;
    if (hasSummary) filledFields += 3;

    // Additional (10%)
    const hasAdditional = !!(data.projects?.length > 0 || data.certifications?.length > 0 || data.achievements?.length > 0);
    totalFields += 2;
    if (hasAdditional) filledFields += 2;

    return Math.round((filledFields / totalFields) * 100);
  };

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

  const completeness = calculateCompleteness(formData);

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
      toast({
        title: 'Missing Template',
        description: 'Please select a template first.',
        variant: 'destructive',
      });
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
        toast({
          title: 'Resume Saved',
          description: 'Your resume has been saved successfully!',
        });
      } else {
        toast({
          title: 'Save Failed',
          description: data.error || 'Failed to save resume. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Save Failed',
        description: 'An error occurred while saving. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!templateId) {
      toast({
        title: 'Missing Template',
        description: 'Please select a template first.',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingPDF(true);
    try {
      // Try server-side PDF generation first
      const response = await fetch('/api/resume-builder/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          formData,
          selectedColorId,
        }),
      });

      if (response.ok) {
        // Server-side generation succeeded
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${templateId}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'PDF Exported',
          description: 'Your resume has been exported as PDF successfully!',
        });
        return;
      }

      // Check if server indicated fallback should be used
      const errorData = await response.json().catch(() => ({}));
      if (errorData.fallback || response.status === 503) {
        console.warn('Server-side PDF generation unavailable, using client-side fallback');
      } else {
        console.warn('Server-side PDF generation failed, using client-side fallback');
      }
      
      // Fetch HTML from server for client-side export
      const htmlResponse = await fetch('/api/resume-builder/export/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          formData,
          selectedColorId,
        }),
      });

      if (!htmlResponse.ok) {
        throw new Error('Failed to generate HTML for export');
      }

      const html = await htmlResponse.text();

      // Create a new window with the resume HTML
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow popups to export PDF');
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          toast({
            title: 'PDF Export Ready',
            description: 'Use your browser\'s print dialog to save as PDF.',
          });
        }, 500);
      };

      // Fallback: if onload doesn't fire, try after a delay
      setTimeout(() => {
        if (printWindow && printWindow.document.readyState === 'complete') {
          printWindow.print();
          toast({
            title: 'PDF Export Ready',
            description: 'Use your browser\'s print dialog to save as PDF.',
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportDOCX = async () => {
    if (!templateId) {
      toast({
        title: 'Missing Template',
        description: 'Please select a template first.',
        variant: 'destructive',
      });
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate DOCX');
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
      
      toast({
        title: 'DOCX Exported',
        description: 'Your resume has been exported as DOCX successfully!',
      });
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export DOCX. Please try again.',
        variant: 'destructive',
      });
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
        return (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <EducationStep formData={formData} onFieldChange={handleFieldChange} />
          </Suspense>
        );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/resume-builder/templates')}
            className="mb-4 hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-1">
                Resume Editor
              </h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Template: <span className="font-medium">{template.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() => setShowChangeTemplateModal(true)}
                className="flex items-center gap-2 border-gray-300 hover:bg-white hover:border-blue-400 hover:text-blue-700 transition-all"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Change Template</span>
                <span className="sm:hidden">Template</span>
              </Button>
              <div className="flex items-center gap-2 border-l border-gray-300 pl-2 sm:pl-3">
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || isExportingDOCX || !templateId}
                  className={cn(
                    "flex items-center gap-2 transition-all shadow-sm",
                    "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title="Export as PDF"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">{isExportingPDF ? 'Exporting...' : 'PDF'}</span>
                  <span className="sm:hidden">{isExportingPDF ? '...' : 'PDF'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportDOCX}
                  disabled={isExportingPDF || isExportingDOCX || !templateId}
                  className={cn(
                    "flex items-center gap-2 transition-all shadow-sm",
                    "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  title="Export as DOCX"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{isExportingDOCX ? 'Exporting...' : 'DOCX'}</span>
                  <span className="sm:hidden">{isExportingDOCX ? '...' : 'DOCX'}</span>
                </Button>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving || !templateId}
                className={cn(
                  "flex items-center gap-2 transition-all shadow-lg",
                  "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                  "text-white font-semibold",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Resume'}</span>
                <span className="sm:hidden">{isSaving ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className={cn(
          "grid gap-6 lg:gap-8",
          isMobile ? "grid-cols-1" : "lg:grid-cols-[280px_1fr_420px]"
        )}>
          {/* Left Sidebar - Stepper */}
          {!isMobile && (
            <div className="sticky top-6 h-fit">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200/50">
                <EditorStepper
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  onStepClick={handleStepClick}
                  completeness={completeness}
                />
              </div>
            </div>
          )}

          {/* Center - Form Content */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 md:p-8 lg:p-10">
            {/* Mobile Progress Bar */}
            {isMobile && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{completeness}%</span>
                </div>
                <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <div className="mt-4">
                  <EditorStepper
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                    completeness={completeness}
                  />
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200/50">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              
              <div className="flex items-center gap-2">
                {!isLastStep ? (
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all"
                  >
                    <span className="hidden sm:inline">Next Step</span>
                    <span className="sm:hidden">Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 transition-all"
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
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
                  <ColorPicker
                    colors={template.colors}
                    selectedColorId={selectedColorId}
                    onColorChange={setSelectedColorId}
                  />
                </div>
              )}

              {/* Live Preview */}
              <div className="sticky top-6">
                <LivePreview
                  templateId={templateId}
                  formData={formData}
                  selectedColorId={selectedColorId}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Preview (below form) */}
        {isMobile && (
          <div className="mt-6 space-y-6">
            {template.colors && template.colors.length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
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
