'use client';

/**
 * Resume Builder Editor Page
 * Modern multi-step resume creation flow with live preview
 * Enhanced with Framer Motion animations and modern UI/UX
 */

import './preview-override.css';
import './editor-layout.css';
import './form-panel.css';
import './optimization-panel.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Circle, Sparkles, Layout, Palette } from 'lucide-react';
import ChangeTemplateModal from '@/components/resume-builder/ChangeTemplateModal';
import ResumePreviewWrapper from '@/components/resume-builder/ResumePreviewWrapper';
import ColorPicker from '@/components/resume-builder/ColorPicker';
import SectionVisibilityPanel from '@/components/resume-builder/SectionVisibilityPanel';
import AIOptimizationPanel from '@/components/resume-builder/AIOptimizationPanel';
import { ResumeOptimizationProvider } from '@/components/resume-builder/ResumeOptimizationProvider';
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
import { cn } from '@/lib/utils';

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

const editorFormFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

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
  const shouldPrefill = searchParams.get('prefill') === 'true';

  // State
  const [currentStep, setCurrentStep] = useState<StepId>('contacts');
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChangeTemplate, setShowChangeTemplate] = useState(false);

  // Load template on mount
  useEffect(() => {
    async function loadTemplateData() {
      if (!templateId) {
        router.push('/resume-builder/templates');
        return;
      }

      // Store current URL for return after payment/login
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.pathname + window.location.search;
        sessionStorage.setItem('resume-builder-return-url', currentUrl);
        // Check if user came from jobseeker dashboard
        const source = sessionStorage.getItem('resume-builder-source');
        if (source === 'jobseeker-dashboard') {
          // Keep the source flag for payment redirect
        }
      }

      try {
        setLoading(true);
        const loaded = await loadTemplate(templateId);
        
        if (!loaded || !loaded.template) {
          toast({
            title: 'Template not found',
            description: 'The selected template could not be loaded.',
            variant: 'destructive',
          });
          router.push('/resume-builder/templates');
          return;
        }

        setTemplate(loaded.template);
        setSelectedColorId(loaded.template.defaultColor || loaded.template.colors?.[0]?.id || '');
        
        // Priority 0: Check for saved payment flow data (user returned after payment)
        // This takes highest priority to restore user's work
        const paymentFlowData = typeof window !== 'undefined' 
          ? sessionStorage.getItem('resume-builder-payment-flow') 
          : null;
        
        if (paymentFlowData) {
          try {
            const saved = JSON.parse(paymentFlowData);
            console.log('💾 [Resume Editor] Found saved payment flow data, restoring resume...');
            
            // If templateId doesn't match, redirect to correct template
            if (saved.templateId && saved.templateId !== templateId) {
              console.log(`🔄 [Resume Editor] Template mismatch (current: ${templateId}, saved: ${saved.templateId}), redirecting to correct template`);
              const correctUrl = `/resume-builder/editor?template=${saved.templateId}${saved.typeId ? `&type=${saved.typeId}` : ''}`;
              router.push(correctUrl);
              return; // Exit early, will reload with correct template
            }
            
            // Restore form data
            if (saved.formData && Object.keys(saved.formData).length > 0) {
              setFormData(saved.formData);
              console.log('✅ [Resume Editor] Restored form data from payment flow');
            }
            
            // Restore color selection
            if (saved.selectedColorId) {
              setSelectedColorId(saved.selectedColorId);
            }
            
            // Jump to finalize step (user was here before payment)
            if (saved.currentStep === 'finalize') {
              setCurrentStep('finalize');
              console.log('✅ [Resume Editor] Jumped to finalize step');
              
              toast({
                title: '✨ Resume Restored!',
                description: 'Your resume data has been restored. You can now download your resume.',
                duration: 5000,
              });
            }
            
            // Clear payment flow data after restoring
            sessionStorage.removeItem('resume-builder-payment-flow');
            sessionStorage.removeItem('resume-builder-needs-payment');
            console.log('🧹 [Resume Editor] Cleared payment flow data');
          } catch (e) {
            console.error('❌ [Resume Editor] Error restoring payment flow data:', e);
            sessionStorage.removeItem('resume-builder-payment-flow');
          }
        }
        
        // Priority 1: Load imported resume data (if prefill=true)
        // Only load if we didn't restore from payment flow
        if (shouldPrefill && !paymentFlowData) {
          const importData = sessionStorage.getItem('resume-import-data');
          if (importData) {
            try {
              const parsed = JSON.parse(importData);
              console.log('📥 Loaded imported resume data from sessionStorage');
              console.log('   - Has fullName?', !!parsed.fullName);
              console.log('   - Has name?', !!parsed.name);
              console.log('   - Has email?', !!parsed.email);
              console.log('   - Has skills?', Array.isArray(parsed.skills));
              console.log('   - Skills count:', parsed.skills?.length || 0);
              console.log('   - Experience count:', parsed.experience?.length || 0);
              console.log('   - Education count:', parsed.education?.length || 0);
              console.log('🔍 CRITICAL DEBUG - RAW DATA FROM API:');
              console.log('   - Full name value:', parsed.fullName || parsed.name || 'MISSING');
              console.log('   - Skills array:', parsed.skills);
              console.log('   - Experience array:', parsed.experience);
              console.log('   - Education array:', parsed.education);
              console.log('   - First experience:', parsed.experience?.[0]);
              console.log('   - First education:', parsed.education?.[0]);
              console.log('   - Full data:', parsed);
              
              // Transform AI data to builder format
              const { transformImportDataToBuilder, validateTransformedData } = await import('@/lib/resume-builder/import-transformer');
              const transformed = transformImportDataToBuilder(parsed);
              
              console.log('🔄 After transformation:');
              console.log('   - firstName:', transformed.firstName || 'MISSING');
              console.log('   - lastName:', transformed.lastName || 'MISSING');
              console.log('   - email:', transformed.email || 'MISSING');
              console.log('   - skills COUNT:', transformed.skills?.length || 0);
              console.log('   - skills:', transformed.skills);
              console.log('   - experience COUNT:', transformed.experience?.length || 0);
              console.log('   - experience:', transformed.experience);
              console.log('   - education COUNT:', transformed.education?.length || 0);
              console.log('   - education:', transformed.education);
              console.log('   - languages COUNT:', transformed.languages?.length || 0);
              console.log('   - achievements COUNT:', transformed.achievements?.length || 0);
              console.log('   - hobbies COUNT:', transformed.hobbies?.length || 0);
              
              // Validate transformation
              const validation = validateTransformedData(transformed);
              console.log('✅ Transformation validation:', validation);
              
              if (validation.valid) {
                setFormData(transformed);
                
                // Clear import data after loading
                sessionStorage.removeItem('resume-import-data');
                
                toast({
                  title: '✨ Resume Imported Successfully!',
                  description: `All fields pre-filled with your data. ${validation.warnings.length > 0 ? validation.warnings.length + ' minor warnings.' : 'Ready to review and export!'}`,
                  duration: 5000,
                });
                
                console.log('✅ Auto-fill complete:', {
                  contacts: !!transformed.firstName,
                  skills: transformed.skills?.length || 0,
                  experience: transformed.experience?.length || 0,
                  education: transformed.education?.length || 0,
                });
              } else {
                console.error('❌ Validation failed:', validation.issues);
                toast({
                  title: 'Import Warning',
                  description: `Some fields couldn't be imported: ${validation.issues.join(', ')}`,
                  variant: 'destructive',
                });
              }
            } catch (e) {
              console.error('Error loading imported data:', e);
              toast({
                title: 'Import Error',
                description: 'Failed to load imported data. You can fill the form manually.',
                variant: 'destructive',
              });
            }
          } else {
            console.warn('⚠️ Prefill=true but no import data found in sessionStorage');
          }
        }
        // Priority 2: Load saved draft (from localStorage)
        // Only load if we didn't restore from payment flow or import
        else if (!paymentFlowData) {
          const savedData = localStorage.getItem(`resume-${templateId}`);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              setFormData(parsed);
              console.log('📋 Loaded saved draft from localStorage');
            } catch (e) {
              console.error('Error parsing saved data:', e);
            }
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

  // Handle template change
  const handleTemplateChange = useCallback((newTemplateId: string, newColorId: string) => {
    router.push(`/resume-builder/editor?template=${newTemplateId}&type=${typeId}`);
    setSelectedColorId(newColorId);
    toast({
      title: 'Template changed',
      description: 'Your resume data has been preserved.',
    });
  }, [router, typeId, toast]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-700 font-medium"
          >
            Loading editor...
          </motion.p>
        </motion.div>
      </motion.div>
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
    <motion.div className="resume-editor-shell flex flex-col h-screen max-h-screen overflow-hidden bg-slate-100">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
      >
        <motion.div className="resume-editor-toolbar px-3 sm:px-5 min-[1200px]:px-6 py-3 min-w-0">
          <div className="resume-editor-toolbar-row flex items-center justify-between gap-2 min-w-0 min-[1200px]:contents">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="resume-editor-toolbar-brand flex items-center gap-2 sm:gap-4 min-w-0 flex-1"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/resume-builder/templates${typeId ? `?type=${typeId}` : ''}`)}
                className="shrink-0 hover:bg-gray-100 transition-all duration-200 px-2 sm:px-3"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base min-[1200px]:text-lg font-semibold text-gray-900 flex items-center gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{template?.name || 'Resume Builder'}</span>
                </h1>
                <p className="text-xs text-gray-500 hidden min-[1200px]:block">Resume Builder</p>
              </div>
              {/* Mobile: Change Template Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangeTemplate(true)}
                className="min-[1200px]:hidden shrink-0 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">Template</span>
              </Button>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 shrink-0"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangeTemplate(true)}
                className="hidden min-[1200px]:flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Layout className="w-4 h-4" />
                Change Template
              </Button>
              <div className="hidden min-[1200px]:block">
                <Progress value={progress} className="w-64 h-2" />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Step {currentStepIndex + 1} of {STEPS.length}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <div className="resume-editor-workspace flex-1 min-h-0 min-w-0">
          <ResumeOptimizationProvider formData={formData} templateId={templateId}>
          <aside className={cn('resume-editor-form-panel', editorFormFont.className)}>
            <div className="resume-editor-form-scroll">
            <div className="resume-editor-form-inner">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full min-w-0 max-w-full"
          >
            <AIOptimizationPanel formData={formData} updateFormData={updateFormData} />

            {/* Mobile: Step Selector */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:hidden mb-4 sm:mb-6 w-full max-w-full"
            >
              <select
                value={currentStep}
                onChange={(e) => goToStep(e.target.value as StepId)}
                className="resume-form-step-select max-w-full"
              >
                {STEPS.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.label}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Desktop: Step Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:block mb-4 lg:mb-6"
            >
              <div className="resume-form-tabs overflow-x-auto pb-1 scrollbar-hide w-full max-w-full">
                {STEPS.map((step, index) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = isStepCompleted(step.id);
                  const isClickable = index <= currentStepIndex || isCompleted;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => isClickable && goToStep(step.id)}
                      disabled={!isClickable}
                      className={cn(
                        'resume-form-tab',
                        isActive && 'resume-form-tab--active',
                        isCompleted && !isActive && 'resume-form-tab--done'
                      )}
                    >
                      {isCompleted && !isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      ) : (
                        <Circle
                          className={cn('h-3.5 w-3.5 shrink-0', isActive && 'fill-current')}
                          aria-hidden
                        />
                      )}
                      {step.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Step Content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="resume-form-step-surface p-4 sm:p-5 min-[1200px]:p-7 mb-5 w-full max-w-full min-w-0 box-border"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="resume-form-nav flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6"
            >
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="resume-form-btn-outline w-full sm:w-auto disabled:opacity-50 px-6 h-10 rounded-xl"
              >
                Previous
              </Button>
              {currentStep !== 'finalize' && (
                <Button
                  onClick={nextStep}
                  className="resume-form-btn-primary w-full sm:w-auto px-6 h-10 rounded-xl"
                >
                  Next
                </Button>
              )}
            </motion.div>

            {/* Section visibility — form column only (must not live in preview chrome) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="resume-form-aux-panel mt-6 p-4 sm:p-5"
            >
              <SectionVisibilityPanel
                formData={formData}
                updateFormData={updateFormData}
              />
            </motion.div>
          </motion.div>
            </div>
            </div>
          </aside>
          </ResumeOptimizationProvider>

          <section className="resume-editor-preview-panel">
            {template && template.colors && template.colors.length > 0 && (
              <div className="resume-editor-preview-chrome">
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Palette className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="text-sm font-semibold text-slate-900 truncate">Color theme</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChangeTemplate(true)}
                    className="text-xs text-slate-600 hover:text-blue-600 h-8"
                  >
                    More options
                  </Button>
                </div>
                <ColorPicker
                  colors={template.colors}
                  selectedColorId={selectedColorId}
                  onColorChange={setSelectedColorId}
                  className="space-y-0"
                />
              </div>
            )}
            <div className="resume-editor-preview-body p-3 sm:p-4">
              <ResumePreviewWrapper
                formData={formData}
                templateId={templateId}
                selectedColorId={selectedColorId}
                className="h-full"
              />
            </div>
          </section>
      </div>

      {/* Change Template Modal */}
      {template && (
        <ChangeTemplateModal
          open={showChangeTemplate}
          onOpenChange={setShowChangeTemplate}
          currentTemplateId={templateId}
          currentColorId={selectedColorId}
          formData={formData}
          onTemplateChange={handleTemplateChange}
        />
      )}
    </motion.div>
  );
}
