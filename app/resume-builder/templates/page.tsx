'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import TemplateFilters from '@/components/resume-builder/TemplateFilters';
import TemplateGrid from '@/components/resume-builder/TemplateGrid';
import PersonalInfoStep from '@/components/resume-builder/steps/PersonalInfoStep';
import ExperienceStep from '@/components/resume-builder/steps/ExperienceStep';
import SkillsStep from '@/components/resume-builder/steps/SkillsStep';
import EducationStep from '@/components/resume-builder/steps/EducationStep';
import SummaryStep from '@/components/resume-builder/steps/SummaryStep';
import AdditionalStep from '@/components/resume-builder/steps/AdditionalStep';
import LivePreview from '@/components/resume-builder/LivePreview';
import ColorPicker from '@/components/resume-builder/ColorPicker';
import EditorStepper, { type EditorStep } from '@/components/resume-builder/EditorStepper';
import { loadTemplateMetadata, type Template } from '@/lib/resume-builder/template-loader';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import templatesData from '@/lib/resume-builder/templates.json';
import resumeTypesData from '@/lib/resume-builder/resume-types.json';

// Prevent static generation
export const dynamic = 'force-dynamic';

interface Filters {
  category: string;
  layout: string;
  color: string | null;
}

const steps: EditorStep[] = ['personal', 'experience', 'skills', 'education', 'summary', 'additional'];

export default function TemplateSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();
  const typeId = searchParams.get('type') || 'experienced';
  
  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    category: 'All Templates',
    layout: 'All',
    color: null,
  });

  // Form state (reused from editor logic)
  const [currentStep, setCurrentStep] = useState<EditorStep>('personal');
  const [completedSteps, setCompletedSteps] = useState<EditorStep[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [experienceLevel, setExperienceLevel] = useState<string>('experienced');

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
        setFormData((prev) => ({ ...prev, experienceLevel: resumeType.id }));
      }
    } else {
      setExperienceLevel('experienced');
      setFormData((prev) => ({ ...prev, experienceLevel: 'experienced' }));
    }
  }, [typeId]);

  // Load template metadata when selected
  useEffect(() => {
    if (selectedTemplateId) {
      loadTemplateMetadata(selectedTemplateId).then((templateData) => {
        if (templateData) {
          setSelectedTemplate(templateData);
          setSelectedColorId(templateData.defaultColor);
          
          // Load saved form data for this template
          const resumeType = typeId || 'experienced';
          const saved = localStorage.getItem(`resume-builder-${selectedTemplateId}-${resumeType}`);
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
      });
    }
  }, [selectedTemplateId, typeId]);

  // Auto-save to localStorage (reused from editor)
  useEffect(() => {
    if (selectedTemplateId && Object.keys(formData).length > 0) {
      const resumeType = typeId || 'experienced';
      const saveKey = `resume-builder-${selectedTemplateId}-${resumeType}`;
      localStorage.setItem(saveKey, JSON.stringify(formData));
    }
  }, [formData, selectedTemplateId, typeId]);

  // Calculate resume completeness (reused from editor)
  const calculateCompleteness = (data: Record<string, any>): number => {
    let totalFields = 0;
    let filledFields = 0;

    const personalFields = ['firstName', 'lastName', 'email', 'phone', 'jobTitle', 'location'];
    personalFields.forEach(field => {
      totalFields++;
      if (data[field] && String(data[field]).trim()) filledFields++;
    });

    const hasExperience = (data.experience?.length > 0 || data['Work Experience']?.length > 0);
    totalFields += 5;
    if (hasExperience) filledFields += 5;

    const hasSkills = Array.isArray(data.skills) && data.skills.length > 0;
    totalFields += 3;
    if (hasSkills) filledFields += 3;

    const hasEducation = (data.education?.length > 0 || data['Education']?.length > 0);
    totalFields += 3;
    if (hasEducation) filledFields += 3;

    const hasSummary = !!(data.summary || data['Professional Summary'] || data['Career Objective'] || data['Executive Summary']);
    totalFields += 3;
    if (hasSummary) filledFields += 3;

    const hasAdditional = !!(data.projects?.length > 0 || data.certifications?.length > 0 || data.achievements?.length > 0);
    totalFields += 2;
    if (hasAdditional) filledFields += 2;

    return Math.round((filledFields / totalFields) * 100);
  };

  const completeness = calculateCompleteness(formData);

  const handleFilterChange = (key: keyof Filters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filter templates based on active filters
  const filteredTemplates = useMemo(() => {
    const templates = (templatesData.templates || []) as Template[];
    
    if (!Array.isArray(templates) || templates.length === 0) {
      return [];
    }
    
    return templates.filter((template) => {
      const categoryMatch =
        filters.category === 'All Templates' ||
        (Array.isArray(template.categories) && template.categories.includes(filters.category));
      
      const layoutMatch =
        filters.layout === 'All' ||
        template.layout === filters.layout;
      
      const colorMatch =
        filters.color === null ||
        (Array.isArray(template.colors) && template.colors.some((c) => c.id === filters.color || c.primary === filters.color));
      
      return categoryMatch && layoutMatch && colorMatch;
    });
  }, [filters]);

  const handleTemplateSelect = (templateId: string) => {
    // Update selected template without navigating
    setSelectedTemplateId(templateId);
  };

  const handleContinueToEditor = () => {
    if (!selectedTemplateId) return;
    // Navigate to editor with selected template
    router.push(`/resume-builder/editor?template=${selectedTemplateId}&type=${typeId}`);
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

  // Get filter options from templates.json
  const filterOptions = useMemo(() => {
    const templates = (templatesData.templates || []) as Template[];
    const categories = new Set<string>();
    const layouts = new Set<string>();
    const colors = new Set<string>();
    
    templates.forEach((template) => {
      if (Array.isArray(template.categories)) {
        template.categories.forEach((cat) => categories.add(cat));
      }
      if (template.layout) {
        layouts.add(template.layout);
      }
      if (Array.isArray(template.colors)) {
        template.colors.forEach((color) => {
          colors.add(color.id);
        });
      }
    });

    return {
      categories: Array.from(categories).sort(),
      layouts: Array.from(layouts).sort(),
      colors: Array.from(colors).sort(),
    };
  }, []);

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
            onClick={() => router.push('/resume-builder/start')}
            className="mb-4 hover:bg-white/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-1">
                Choose a Template & Build Your Resume
              </h1>
              <p className="text-sm text-gray-600">
                Select a template and start filling your information. See live preview as you type.
              </p>
            </div>
            {selectedTemplateId && (
              <Button
                onClick={handleContinueToEditor}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 transition-all"
              >
                Continue to Full Editor
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Layout: Templates + Form + Preview */}
        <div className={cn(
          "grid gap-6 lg:gap-8",
          isMobile ? "grid-cols-1" : selectedTemplateId 
            ? "lg:grid-cols-[350px_1fr_420px]" 
            : "lg:grid-cols-[300px_1fr]"
        )}>
          {/* Left Sidebar - Filters & Templates */}
          <div className={cn(
            "space-y-6",
            isMobile && "order-1"
          )}>
            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <TemplateFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={templatesData.filters?.categories || filterOptions.categories}
                layouts={templatesData.filters?.layouts || filterOptions.layouts}
                colors={filterOptions.colors}
                templates={templatesData.templates as Template[]}
              />
            </div>

            {/* Templates Grid */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Templates</h3>
                <p className="text-sm text-gray-600">
                  {filteredTemplates.length} found
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <TemplateGrid
                  templates={filteredTemplates}
                  selectedTemplate={selectedTemplateId}
                  onSelectTemplate={handleTemplateSelect}
                />
              </div>
            </div>
          </div>

          {/* Center - Form Content (only show when template is selected) */}
          {selectedTemplateId && selectedTemplate ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 md:p-8 lg:p-10">
              {/* Step Navigation */}
              {!isMobile && (
                <div className="mb-6 pb-6 border-b border-gray-200/50">
                  <EditorStepper
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    onStepClick={handleStepClick}
                    completeness={completeness}
                  />
                </div>
              )}

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
                      onClick={handleContinueToEditor}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 transition-all"
                    >
                      Continue to Editor
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder when no template selected */
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-12 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Select a Template</h3>
                <p className="text-sm text-gray-600 max-w-md">
                  Choose a template from the left to start building your resume. The form will appear here once you select a template.
                </p>
              </div>
            </div>
          )}

          {/* Right Sidebar - Preview & Color Picker (only show when template is selected) */}
          {selectedTemplateId && selectedTemplate && !isMobile && (
            <div className="space-y-6">
              {/* Color Picker */}
              {selectedTemplate.colors && selectedTemplate.colors.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
                  <ColorPicker
                    colors={selectedTemplate.colors}
                    selectedColorId={selectedColorId}
                    onColorChange={setSelectedColorId}
                  />
                </div>
              )}

              {/* Live Preview */}
              <div className="sticky top-6">
                <LivePreview
                  templateId={selectedTemplateId}
                  formData={formData}
                  selectedColorId={selectedColorId}
                />
              </div>
            </div>
          )}

          {/* Mobile Preview (below form) */}
          {selectedTemplateId && selectedTemplate && isMobile && (
            <div className="mt-6 space-y-6 order-3">
              {selectedTemplate.colors && selectedTemplate.colors.length > 0 && (
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
                  <ColorPicker
                    colors={selectedTemplate.colors}
                    selectedColorId={selectedColorId}
                    onColorChange={setSelectedColorId}
                  />
                </div>
              )}
              <LivePreview
                templateId={selectedTemplateId}
                formData={formData}
                selectedColorId={selectedColorId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

