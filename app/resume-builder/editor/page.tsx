'use client';

/**
 * Resume Builder Editor Page
 * Modern multi-step resume creation flow with live preview
 * Enhanced with Framer Motion animations and modern UI/UX
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Circle, Sparkles, Eye, EyeOff } from 'lucide-react';
import LivePreview from '@/components/resume-builder/LivePreview';
import ChangeTemplateModal from '@/components/resume-builder/ChangeTemplateModal';
import { useToast } from '@/hooks/use-toast';
import './preview-override.css'; // CSS-only preview overrides

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
  const shouldPrefill = searchParams.get('prefill') === 'true';

  // State
  const [currentStep, setCurrentStep] = useState<StepId>('contacts');
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showChangeTemplate, setShowChangeTemplate] = useState(false);

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
        
        // Priority 1: Load imported resume data (if prefill=true)
        if (shouldPrefill) {
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
        else {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/95 backdrop-blur-lg border-b border-gray-200/60 sticky top-0 z-40 shadow-md"
        style={{
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/resume-builder/templates${typeId ? `?type=${typeId}` : ''}`)}
                className="hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  {template?.name || 'Resume Builder'}
                </h1>
                <p className="text-xs text-gray-500">Resume Builder</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block"
            >
              <Progress value={progress} className="w-64 h-2" />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Step {currentStepIndex + 1} of {STEPS.length}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[minmax(400px,1fr)_850px] gap-4 md:gap-6 lg:gap-8">
          {/* Left: Form Steps */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="order-1 lg:order-1 min-w-0"
          >
            {/* Mobile: Step Selector */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:hidden mb-6"
            >
              <select
                value={currentStep}
                onChange={(e) => goToStep(e.target.value as StepId)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white/90 backdrop-blur-sm px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
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
              className="hidden lg:block mb-6"
            >
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {STEPS.map((step, index) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = isStepCompleted(step.id);
                  const isClickable = index <= currentStepIndex || isCompleted;

                  return (
                    <motion.button
                      key={step.id}
                      onClick={() => isClickable && goToStep(step.id)}
                      disabled={!isClickable}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={isClickable ? { scale: 1.05, y: -2 } : {}}
                      whileTap={isClickable ? { scale: 0.95 } : {}}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap
                        transition-all duration-300 shadow-sm
                        ${isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                          : isCompleted
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 border border-green-200'
                          : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white border border-gray-200'
                        }
                        ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <motion.div
                        animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {isCompleted && !isActive ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
                        )}
                      </motion.div>
                      {step.label}
                    </motion.button>
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
              className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-6 lg:p-8 backdrop-blur-sm"
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
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
              className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200/60"
            >
              <motion.div 
                whileHover={{ scale: 1.02, x: -2 }} 
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="disabled:opacity-50 transition-all duration-200 border-2 hover:bg-gray-50 hover:border-gray-300 px-6"
                >
                  Previous
                </Button>
              </motion.div>
              {currentStep !== 'finalize' && (
                <motion.div 
                  whileHover={{ scale: 1.02, x: 2 }} 
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all duration-200 px-6 font-semibold"
                  >
                    Next
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Right: Live Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="order-1 lg:order-2 w-full"
          >
            {/* Mobile: Preview Toggle */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:hidden mb-6"
            >
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full border-2 transition-all duration-200 hover:shadow-md"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show Preview
                  </>
                )}
              </Button>
            </motion.div>

            {/* Desktop: Always visible preview with change template button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:flex lg:flex-col resume-editor-preview-desktop w-full sticky top-0"
              style={{
                height: 'auto',
                minHeight: '650px',
                maxHeight: '100vh',
                overflow: 'auto'
              }}
            >
              <div 
                className="flex-1 overflow-auto min-h-0 resume-preview-wrapper flex flex-col"
                style={{
                  minHeight: '0'
                }}
              >
                <LivePreview
                  templateId={templateId}
                  formData={formData}
                  selectedColorId={selectedColorId}
                  className="h-full"
                />
              </div>
              
              {/* Change Template Button - Desktop only */}
              <div className="mt-4 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setShowChangeTemplate(true)}
                  className="w-full border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Change Template
                </Button>
              </div>
            </motion.div>

            {/* Mobile: Preview shown/hidden by toggle */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="lg:hidden flex flex-col w-full min-h-[900px]"
              >
                <div className="flex-1 overflow-y-auto overflow-x-auto resume-preview-wrapper flex flex-col min-h-0">
                  <LivePreview
                    templateId={templateId}
                    formData={formData}
                    selectedColorId={selectedColorId}
                    className="h-full"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
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
    </div>
  );
}
