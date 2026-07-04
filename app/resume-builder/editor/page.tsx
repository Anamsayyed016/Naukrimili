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
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle2, Circle, Sparkles, Wand2 } from 'lucide-react';
import ResumePreviewWrapper from '@/components/resume-builder/ResumePreviewWrapper';
import SectionVisibilityPanel from '@/components/resume-builder/SectionVisibilityPanel';
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
import DynamicSectionsStep from '@/components/resume-builder/steps/DynamicSectionsStep';
import FinalizeStep from '@/components/resume-builder/steps/FinalizeStep';

import { loadTemplate } from '@/lib/resume-builder/template-loader';
import { syncExperienceEntryAliases } from '@/lib/resume-builder/experience-entry-sync';
import { hasAnyDynamicSectionData } from '@/lib/resume-builder/dynamic-section-registry';
import { validateImportPipelineAlignment } from '@/lib/resume-builder/import-pipeline-validation';
import { saveResumeBuilderLastEditor } from '@/lib/resume-builder/jobseeker-entry-redirect';
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
  | 'additional-sections'
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

function syncProjectEntryAliases(entry: Record<string, unknown>): Record<string, unknown> {
  const pick = (keys: string[]): string => {
    for (const key of keys) {
      const value = entry[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    for (const key of keys) {
      const value = entry[key];
      if (typeof value === 'string') return value;
    }
    return '';
  };

  const name = pick(['name', 'Name', 'title', 'Title']);
  const description = pick(['description', 'Description', 'summary', 'Summary']);
  const technologies = pick(['technologies', 'Technologies', 'tech_stack']);
  const link = pick(['link', 'Link', 'url']);
  const existingId =
    typeof entry._id === 'string' && entry._id.trim() ? entry._id.trim() : '';
  const id =
    existingId ||
    (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`);

  return {
    ...entry,
    _id: id,
    name,
    Name: name,
    title: name,
    description,
    Description: description,
    technologies,
    Technologies: technologies,
    link,
    url: link,
    Link: link,
  };
}

function syncEducationEntryAliases(entry: Record<string, unknown>): Record<string, unknown> {
  const degree =
    'degree' in entry
      ? String(entry.degree ?? '')
      : String(entry.Degree ?? '');
  const school =
    'school' in entry
      ? String(entry.school ?? '')
      : String(entry.institution ?? entry.Institution ?? '');
  const field =
    'field' in entry
      ? String(entry.field ?? '')
      : String(entry.Field ?? '');
  return {
    ...entry,
    degree,
    Degree: degree,
    school,
    institution: school,
    Institution: school,
    field,
    Field: field,
  };
}

function devResumeImportLog(message: string, detail?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[resume-import:editor] ${message}`, detail ?? '');
  }
}

function importSectionCounts(data: Record<string, unknown>) {
  return {
    experience: Array.isArray(data.experience) ? data.experience.length : 0,
    education: Array.isArray(data.education) ? data.education.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
  };
}

/** Saved editor / upload payload already in ExperienceStep shape — do not re-transform. */
function isBuilderFormSnapshot(parsed: Record<string, unknown>): boolean {
  if (parsed._userEdited === true) return true;
  const experience = parsed.experience;
  if (!Array.isArray(experience) || experience.length === 0) return false;
  return experience.some(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      ('title' in entry || 'startDate' in entry || 'company' in entry)
  );
}

/** API / upload page already produced builder form data — skip second sanitize pass. */
function isBuilderReadyImportPayload(parsed: Record<string, unknown>): boolean {
  if (parsed._imported === true) return true;

  const hasContact =
    !!String(parsed.firstName || '').trim() ||
    !!String(parsed.lastName || '').trim() ||
    !!String(parsed.fullName || '').trim() ||
    !!String(parsed.name || '').trim() ||
    !!String(parsed.email || '').trim();

  const counts = importSectionCounts(parsed);
  const hasSections =
    counts.experience > 0 ||
    counts.education > 0 ||
    counts.skills > 0 ||
    counts.projects > 0;

  return hasContact && hasSections;
}

const BASE_STEPS: Step[] = [
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
  const { toast } = useToast();

  const templateId = searchParams.get('template') || '';
  const typeId = searchParams.get('type') || '';
  const colorParam = searchParams.get('color') || '';
  const shouldPrefill = searchParams.get('prefill') === 'true';

  // State
  const [currentStep, setCurrentStep] = useState<StepId>('contacts');
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  /** Prevents import/localStorage from overwriting in-memory edits on colorParam / URL changes. */
  const formHydratedForTemplateRef = useRef<string | null>(null);
  /** After first manual edit, autofill / re-import must never overwrite form state. */
  const userHasEditedRef = useRef(false);

  const activeSteps = useMemo(() => {
    const steps = [...BASE_STEPS];
    if (hasAnyDynamicSectionData(formData)) {
      const finalizeIdx = steps.findIndex((s) => s.id === 'finalize');
      steps.splice(finalizeIdx, 0, { id: 'additional-sections', label: 'More Sections' });
    }
    return steps;
  }, [formData]);

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
        // Honour ?color= passed back from Design Studio; otherwise fall back to
        // the template's default colour. Custom-color ids (custom:<hex>) are
        // accepted as-is without lookup.
        const colorFromUrl = colorParam.trim();
        const isKnownColor =
          colorFromUrl &&
          (colorFromUrl.startsWith('custom:') ||
            (loaded.template.colors || []).some((c) => c.id === colorFromUrl));
        setSelectedColorId(
          isKnownColor
            ? colorFromUrl
            : loaded.template.defaultColor || loaded.template.colors?.[0]?.id || ''
        );
        
        const skipFormHydration = formHydratedForTemplateRef.current === templateId;

        // Priority 0: Check for saved payment flow data (user returned after payment)
        // This takes highest priority to restore user's work
        const paymentFlowData =
          !skipFormHydration && typeof window !== 'undefined'
            ? sessionStorage.getItem('resume-builder-payment-flow')
            : null;
        let formLoaded = skipFormHydration;

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
              formLoaded = true;
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
        
        // Priority 1: Load imported resume data (prefill=true OR pending session import) — once per template
        if (!skipFormHydration && !formLoaded && !paymentFlowData) {
          const importData = sessionStorage.getItem('resume-import-data');
          if (importData) {
            try {
              const parsed = JSON.parse(importData) as Record<string, unknown>;

              devResumeImportLog('before import', {
                payloadBytes: importData.length,
                ...importSectionCounts(parsed),
              });

              console.log('SESSION STORAGE PROJECTS', parsed.projects);
              console.log('📥 Loaded imported resume data from sessionStorage');
              console.log('   - Has fullName?', !!parsed.fullName);
              console.log('   - Has name?', !!parsed.name);
              console.log('   - Has email?', !!parsed.email);
              console.log('   - Has rawText?', typeof parsed.rawText === 'string' && parsed.rawText.length > 0);
              const parsedCounts = importSectionCounts(parsed);
              console.log('   - Skills count:', parsedCounts.skills);
              console.log('   - Experience count:', parsedCounts.experience);
              console.log('   - Education count:', parsedCounts.education);

              const {
                transformImportDataToBuilder,
                coalesceBuilderImportPayload,
                validateTransformedData,
                hasImportableContent,
              } = await import('@/lib/resume-builder/import-transformer');

              const builderReady = isBuilderReadyImportPayload(parsed);
              let formPayload: Record<string, unknown>;

              if (builderReady) {
                formPayload = coalesceBuilderImportPayload(parsed);
                devResumeImportLog('using builder-ready payload (coalesced)', {
                  ...importSectionCounts(formPayload),
                });
              } else {
                const { builderFormData: _nestedBuilder, ...profileForTransform } = parsed;
                formPayload = transformImportDataToBuilder(profileForTransform);
                const transformedCounts = importSectionCounts(formPayload);
                console.log('🔄 After transformation:', {
                  firstName: formPayload.firstName || '(empty)',
                  lastName: formPayload.lastName || '(empty)',
                  skills: transformedCounts.skills,
                  experience: transformedCounts.experience,
                  education: transformedCounts.education,
                });
              }

              const validation = validateTransformedData(formPayload);
              const importOk = hasImportableContent(formPayload);

              const pipelineCheck = validateImportPipelineAlignment(
                builderReady ? parsed : (parsed as Record<string, unknown>),
                formPayload
              );
              if (!pipelineCheck.ok && process.env.NODE_ENV === 'development') {
                console.warn('[resume-import:pipeline-validation]', pipelineCheck);
              }

              devResumeImportLog('after import', {
                hasImportableContent: importOk,
                ...importSectionCounts(formPayload),
                importSuccess: importOk,
              });

              if (importOk) {
                setFormData(formPayload);
                console.log('formData.projects after import', formPayload.projects);
                formLoaded = true;
                sessionStorage.removeItem('resume-import-data');

                const notes = [...validation.issues, ...validation.warnings].filter(Boolean);
                toast({
                  title: '✨ Resume Imported',
                  description:
                    notes.length > 0
                      ? `Your resume data was loaded. ${notes.join('; ')}`
                      : 'Your resume data was loaded. Review each section before exporting.',
                  duration: 5000,
                });
              } else {
                console.error('❌ Import produced no usable content:', validation);
                toast({
                  title: 'Import Warning',
                  description:
                    validation.issues.join('; ') ||
                    'Parsed resume had no fields we could map. You can fill the form manually.',
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
          } else if (shouldPrefill) {
            console.warn('⚠️ Prefill=true but no import data found in sessionStorage');
          }
        }

        // Priority 2: Load saved draft (from localStorage) — once per template
        if (!skipFormHydration && !formLoaded && !paymentFlowData) {
          const savedData = localStorage.getItem(`resume-${templateId}`);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              const sparseSections =
                (!Array.isArray(parsed.experience) || parsed.experience.length === 0) ||
                (!Array.isArray(parsed.skills) || parsed.skills.length === 0) ||
                (!Array.isArray(parsed.education) || parsed.education.length === 0);
              const hasRecoverySource =
                (typeof parsed.rawText === 'string' && parsed.rawText.length >= 80) ||
                (typeof parsed.summary === 'string' &&
                  parsed.summary.length >= 120 &&
                  /(experience|education|skills|employment)/i.test(parsed.summary));
              const shouldRehydrate =
                !parsed._userEdited &&
                !isBuilderFormSnapshot(parsed) &&
                sparseSections &&
                hasRecoverySource;
              if (shouldRehydrate) {
                const { transformImportDataToBuilder } = await import(
                  '@/lib/resume-builder/import-transformer'
                );
                const { builderFormData: _nestedBuilder, ...profileForTransform } = parsed;
                setFormData(transformImportDataToBuilder(profileForTransform));
              } else {
                setFormData(parsed);
              }
              formLoaded = true;
              console.log('📋 Loaded saved draft from localStorage');
            } catch (e) {
              console.error('Error parsing saved data:', e);
            }
          }
        }

        if (!skipFormHydration && formLoaded) {
          formHydratedForTemplateRef.current = templateId;
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
    // colorParam is intentionally read here as well so returning from the
    // Design Studio with ?color= restores the chosen palette.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, router, toast, colorParam, shouldPrefill]);

  // Auto-save to localStorage
  useEffect(() => {
    if (templateId && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`resume-${templateId}`, JSON.stringify(formData));
        saveResumeBuilderLastEditor(templateId, typeId || undefined);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [formData, templateId, typeId]);

  // Calculate progress
  const currentStepIndex = activeSteps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / activeSteps.length) * 100;

  // Navigation handlers
  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId);
    // Scroll to top on mobile
    if (window.innerWidth < 1200) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = () => {
    const currentIndex = activeSteps.findIndex(s => s.id === currentStep);
    if (currentIndex < activeSteps.length - 1) {
      goToStep(activeSteps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = activeSteps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      goToStep(activeSteps[currentIndex - 1].id);
    }
  };

  // Update form data — single source of truth; sync derived contact fields for preview
  const updateFormData = useCallback(
    (updates: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
    userHasEditedRef.current = true;
    setFormData((prev) => {
      const patch = typeof updates === 'function' ? updates(prev) : updates;
      const next = { ...prev, ...patch, _userEdited: true };

      if ('firstName' in patch || 'lastName' in patch) {
        const fn = String(next.firstName ?? '').trim();
        const ln = String(next.lastName ?? '').trim();
        const combined = [fn, ln].filter(Boolean).join(' ');
        next.name = combined;
        next['Full Name'] = combined;
      }

      if ('summary' in patch) {
        next.bio = patch.summary ?? '';
      }

      if ('hobbies' in patch) {
        const list = Array.isArray(patch.hobbies) ? patch.hobbies : [];
        next.hobbies = list;
        next.Hobbies = list;
        next['Hobbies & Interests'] = list;
        next.interests = list;
        next.Interests = list;
        next.personalInterests = list;
      }

      if ('projects' in patch) {
        const list = (Array.isArray(patch.projects) ? patch.projects : []).map((item) =>
          syncProjectEntryAliases(
            item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
          )
        );
        next.projects = list;
        next.Projects = list;
      }

      if ('experience' in patch) {
        const list = Array.isArray(patch.experience) ? patch.experience : [];
        const shouldFinalize = patch._experienceFinalize === true;
        const normalized = shouldFinalize
          ? list.map((item, index) =>
              syncExperienceEntryAliases(
                item && typeof item === 'object' ? (item as Record<string, unknown>) : {},
                { reconcileHeaders: false }
              )
            )
          : list.map((item, index) => {
              if (!item || typeof item !== 'object') return item;
              const row = item as Record<string, unknown>;
              if (typeof row._id === 'string' && row._id.trim()) return row;
              return {
                ...row,
                _id:
                  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : `exp_${index}`,
              };
            });
        next.experience = normalized;
        next['Work Experience'] = normalized;
        next.Experience = normalized;
        if ('_experienceFinalize' in next) {
          delete next._experienceFinalize;
        }
      }

      if ('education' in patch) {
        const list = (Array.isArray(patch.education) ? patch.education : []).map(
          (item) =>
            syncEducationEntryAliases(
              item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
            )
        );
        next.education = list;
        next.Education = list;
      }

      if ('jobTitle' in patch) {
        const jt = patch.jobTitle == null ? '' : String(patch.jobTitle);
        next.jobTitle = jt;
        next.title = jt;
      } else if ('title' in patch && !('jobTitle' in patch)) {
        const t = patch.title == null ? '' : String(patch.title);
        next.title = t;
        next.jobTitle = t;
      }

      const clearKeys = [
        'linkedin',
        'phone',
        'email',
        'location',
        'portfolio',
        'summary',
        'jobTitle',
        'title',
      ] as const;
      for (const key of clearKeys) {
        if (key in patch && (patch[key] === '' || patch[key] == null)) {
          next[key] = '';
          if (key === 'jobTitle' || key === 'title') {
            next.jobTitle = '';
            next.title = '';
          }
        }
      }

      return next;
    });
  }, []);

  // Open the dedicated Design Studio page (template gallery + colors +
  // typography) instead of the cramped popup modal. Auto-save will flush
  // the latest formData under `resume-${templateId}` so the studio sees the
  // same data we have in memory here.
  const openDesignStudio = useCallback(() => {
    if (!templateId) return;
    if (typeof window !== 'undefined') {
      // Best-effort flush in case the debounced save hasn't fired yet.
      try {
        localStorage.setItem(`resume-${templateId}`, JSON.stringify(formData));
      } catch {
        // ignore quota errors
      }
    }
    const params = new URLSearchParams();
    params.set('template', templateId);
    if (typeId) params.set('type', typeId);
    if (selectedColorId) params.set('color', selectedColorId);
    router.push(`/resume-builder/design-studio?${params.toString()}`);
  }, [templateId, typeId, selectedColorId, formData, router]);

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
      case 'additional-sections':
        return <DynamicSectionsStep {...commonProps} />;
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
    <motion.div className="resume-editor-shell flex flex-col bg-slate-100 min-[1200px]:h-screen min-[1200px]:max-h-screen min-[1200px]:overflow-hidden max-[1199px]:min-h-dvh max-[1199px]:overflow-x-clip max-[1199px]:overflow-y-auto">
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
              {/* Mobile: Open Design Studio */}
              <Button
                variant="outline"
                size="sm"
                onClick={openDesignStudio}
                className="min-[1200px]:hidden shrink-0 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">Design</span>
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
                onClick={openDesignStudio}
                className="hidden min-[1200px]:flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Wand2 className="w-4 h-4" />
                Change Template
              </Button>
              <div className="hidden min-[1200px]:block">
                <Progress value={progress} className="w-64 h-2" />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Step {currentStepIndex + 1} of {activeSteps.length}
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
                {activeSteps.map((step) => (
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
                {activeSteps.map((step, index) => {
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
            {/* Color theming and template browsing now live in the Design
                Studio page — see openDesignStudio() above. */}
            <div className="resume-editor-preview-chrome resume-editor-preview-chrome--compact">
              <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openDesignStudio}
                  className="h-8 gap-1.5 text-xs font-medium shrink-0 hover:bg-blue-50 hover:border-blue-300"
                  aria-label="Change Template"
                >
                  <Wand2 className="w-3.5 h-3.5 text-blue-600" />
                  Change Template
                </Button>
              </div>
            </div>
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
    </motion.div>
  );
}
