'use client';

/**
 * Single shared AI optimization state for resume builder (Phase 2).
 * Does not own formData — receives it via props/ref for analyze + stale detection only.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import type { OptimizationReport } from '@/lib/resume-builder/ai-optimization/types';
import { buildContextFingerprint } from '@/lib/resume-builder/ai-optimization/context-fingerprint';
import {
  canUseReportForField,
  getFieldSuggestionsFromReport,
  getFieldSuggestionsFromRolePreview,
  canUseRolePreviewForField,
  type SuggestionField,
} from '@/lib/resume-builder/ai-optimization/field-suggestions';
import {
  getRoleFirstProfile,
  type RoleFirstProfile,
} from '@/lib/resume-builder/ai-optimization/role-first-intelligence';
import { TARGET_ROLES, JD_STORAGE_PREFIX } from '@/components/resume-builder/resume-optimization-constants';

const ANALYZE_COOLDOWN_MS = 2000;
const JD_ENHANCE_MIN_LENGTH = 40;
const AUTO_RUN_DEBOUNCE_MS = 1400;

export interface ResumeOptimizationContextValue {
  targetRole: string;
  setTargetRole: (value: string) => void;
  customRole: string;
  setCustomRole: (value: string) => void;
  resolvedRole: string;
  experienceLevel: string;
  setExperienceLevel: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  report: OptimizationReport | null;
  isReportStale: boolean;
  analyzedFingerprint: string | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  lastAnalyzedAt: number | null;
  hasJobDescription: boolean;
  rolePreview: RoleFirstProfile;
  runOptimize: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  clearReport: () => void;
  getFieldSuggestions: (
    field: SuggestionField,
    formData: Record<string, unknown>,
    searchValue?: string
  ) => { suggestions: string[]; keywords: string[] };
  shouldUseReportForField: (field: SuggestionField) => boolean;
}

const ResumeOptimizationContext = createContext<ResumeOptimizationContextValue | null>(
  null
);

export function useResumeOptimization(): ResumeOptimizationContextValue {
  const ctx = useContext(ResumeOptimizationContext);
  if (!ctx) {
    throw new Error('useResumeOptimization must be used within ResumeOptimizationProvider');
  }
  return ctx;
}

/** Optional hook for components that may render outside provider (falls back gracefully) */
export function useResumeOptimizationOptional(): ResumeOptimizationContextValue | null {
  return useContext(ResumeOptimizationContext);
}

interface ResumeOptimizationProviderProps {
  children: ReactNode;
  formData: Record<string, unknown>;
  templateId?: string;
}

function resolveInitialRole(formData: Record<string, unknown>): string {
  const fromForm = String(formData.jobTitle || formData.title || '').trim();
  if (fromForm && TARGET_ROLES.includes(fromForm as (typeof TARGET_ROLES)[number])) {
    return fromForm;
  }
  if (fromForm) return '__custom__';
  return TARGET_ROLES[0];
}

export function ResumeOptimizationProvider({
  children,
  formData,
  templateId,
}: ResumeOptimizationProviderProps) {
  const { status } = useSession();
  const { toast } = useToast();

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const [targetRole, setTargetRoleState] = useState(() => resolveInitialRole(formData));
  const [customRole, setCustomRoleState] = useState(() => {
    const fromForm = String(formData.jobTitle || formData.title || '').trim();
    if (fromForm && !TARGET_ROLES.includes(fromForm as (typeof TARGET_ROLES)[number])) {
      return fromForm;
    }
    return '';
  });
  const [experienceLevel, setExperienceLevelState] = useState(() =>
    String(formData.experienceLevel || 'experienced')
  );
  const [jobDescription, setJobDescriptionState] = useState('');
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [isReportStale, setIsReportStale] = useState(false);
  const [analyzedFingerprint, setAnalyzedFingerprint] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<number | null>(null);

  const analyzeInFlightRef = useRef(false);
  const lastAnalyzeAtRef = useRef(0);
  const roleTouchedRef = useRef(false);

  const resolvedRole =
    targetRole === '__custom__' ? customRole.trim() : targetRole.trim();

  const industry = String(formData.industry || '').trim();

  const rolePreview = useMemo(
    () =>
      resolvedRole
        ? getRoleFirstProfile(resolvedRole, experienceLevel)
        : getRoleFirstProfile(TARGET_ROLES[0], experienceLevel),
    [resolvedRole, experienceLevel]
  );

  const currentFingerprint = useMemo(
    () =>
      buildContextFingerprint({
        targetRole: resolvedRole,
        industry,
        experienceLevel,
        jobDescription,
        formData,
      }),
    [resolvedRole, industry, experienceLevel, jobDescription, formData]
  );

  // Restore JD from sessionStorage once per template
  useEffect(() => {
    if (!templateId || typeof window === 'undefined') return;
    try {
      const saved = sessionStorage.getItem(`${JD_STORAGE_PREFIX}-${templateId}`);
      if (saved) setJobDescriptionState(saved);
    } catch {
      /* ignore */
    }
  }, [templateId]);

  // Persist JD
  useEffect(() => {
    if (!templateId || typeof window === 'undefined') return;
    try {
      if (jobDescription.trim()) {
        sessionStorage.setItem(`${JD_STORAGE_PREFIX}-${templateId}`, jobDescription);
      }
    } catch {
      /* ignore */
    }
  }, [jobDescription, templateId]);

  // Sync role from contacts when user has not manually changed role in drawer
  useEffect(() => {
    if (roleTouchedRef.current) return;
    const fromForm = String(formData.jobTitle || formData.title || '').trim();
    if (!fromForm) return;
    if (TARGET_ROLES.includes(fromForm as (typeof TARGET_ROLES)[number])) {
      setTargetRoleState(fromForm);
      setCustomRoleState('');
    } else {
      setTargetRoleState('__custom__');
      setCustomRoleState(fromForm);
    }
  }, [formData.jobTitle, formData.title]);

  // Mark report stale when fingerprint diverges
  useEffect(() => {
    if (!report || !analyzedFingerprint) return;
    if (currentFingerprint !== analyzedFingerprint) {
      setIsReportStale(true);
    }
  }, [currentFingerprint, analyzedFingerprint, report]);

  const setTargetRole = useCallback((value: string) => {
    roleTouchedRef.current = true;
    setTargetRoleState(value);
  }, []);

  const setCustomRole = useCallback((value: string) => {
    roleTouchedRef.current = true;
    setCustomRoleState(value);
  }, []);

  const setExperienceLevel = useCallback((value: string) => {
    setExperienceLevelState(value);
  }, []);

  const setJobDescription = useCallback((value: string) => {
    setJobDescriptionState(value);
  }, []);

  const clearReport = useCallback(() => {
    setReport(null);
    setAnalyzedFingerprint(null);
    setIsReportStale(false);
    setAnalyzeError(null);
  }, []);

  const runOptimize = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      if (analyzeInFlightRef.current || isAnalyzing) return;

      const now = Date.now();
      if (!options?.force && now - lastAnalyzeAtRef.current < ANALYZE_COOLDOWN_MS) {
        if (!options?.silent) {
          toast({
            title: 'Please wait',
            description: 'Analysis was just requested. Try again in a moment.',
          });
        }
        return;
      }

      if (status !== 'authenticated') {
        if (!options?.silent) {
          toast({
            title: 'Sign in required',
            description: 'Please sign in to run AI resume optimization.',
            variant: 'destructive',
          });
        }
        signIn(undefined, { callbackUrl: window.location.href });
        return;
      }

      if (!resolvedRole) {
        setAnalyzeError('Select or enter a target role');
        return;
      }

      const jd = jobDescription.trim();
      const fp = buildContextFingerprint({
        targetRole: resolvedRole,
        industry,
        experienceLevel,
        jobDescription: jd,
        formData: formDataRef.current,
      });

      if (
        !options?.force &&
        report &&
        analyzedFingerprint === fp &&
        !isReportStale
      ) {
        if (!options?.silent) {
          toast({
            title: 'Using cached analysis',
            description: `Role match: ${report.roleMatchPercent}% · ATS: ${report.atsScore}%`,
          });
        }
        return;
      }

      setIsAnalyzing(true);
      setAnalyzeError(null);
      analyzeInFlightRef.current = true;
      lastAnalyzeAtRef.current = now;

      try {
        const res = await fetch('/api/resume-builder/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetRole: resolvedRole,
            industry,
            experienceLevel,
            jobDescription: jd,
            formData: formDataRef.current,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.requiresPayment) {
            throw new Error(data.error || 'AI usage limit reached. Upgrade to continue.');
          }
          throw new Error(data.error || 'Analysis failed');
        }

        setReport(data as OptimizationReport);
        setAnalyzedFingerprint(fp);
        setIsReportStale(false);
        setLastAnalyzedAt(Date.now());

        if (!options?.silent) {
          const modeLabel =
            data.mode === 'jd-enhanced' ? 'JD-enhanced' : 'Role-based';
          toast({
            title: 'Guidance ready',
            description: data.cached
              ? `Loaded cached ${modeLabel} results.`
              : `${modeLabel}: ${data.roleMatchPercent}% role fit · ATS ${data.atsScore}%`,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setAnalyzeError(msg);
        if (!options?.silent) {
          toast({ title: 'Optimization failed', description: msg, variant: 'destructive' });
        }
      } finally {
        setIsAnalyzing(false);
        analyzeInFlightRef.current = false;
      }
    },
    [
      isAnalyzing,
      status,
      resolvedRole,
      jobDescription,
      experienceLevel,
      industry,
      report,
      analyzedFingerprint,
      isReportStale,
      toast,
    ]
  );

  const shouldUseReportForFieldFn = useCallback(
    (field: SuggestionField) => {
      if (report && !isReportStale) {
        return canUseReportForField(report, false, field);
      }
      return canUseRolePreviewForField(rolePreview, field);
    },
    [report, isReportStale, rolePreview]
  );

  // Auto-run role-first guidance when role / level / JD context changes
  useEffect(() => {
    if (!resolvedRole || status !== 'authenticated') return;
    const timer = setTimeout(() => {
      runOptimize({ silent: true });
    }, AUTO_RUN_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [resolvedRole, experienceLevel, jobDescription, status, runOptimize]);

  const getFieldSuggestions = useCallback(
    (field: SuggestionField, fd: Record<string, unknown>, searchValue = '') => {
      if (report && !isReportStale) {
        return getFieldSuggestionsFromReport(report, field, fd, searchValue);
      }
      return getFieldSuggestionsFromRolePreview(rolePreview, field, fd, searchValue);
    },
    [report, isReportStale, rolePreview]
  );

  const value = useMemo<ResumeOptimizationContextValue>(
    () => ({
      targetRole,
      setTargetRole,
      customRole,
      setCustomRole,
      resolvedRole,
      experienceLevel,
      setExperienceLevel,
      jobDescription,
      setJobDescription,
      report,
      isReportStale,
      analyzedFingerprint,
      isAnalyzing,
      analyzeError,
      lastAnalyzedAt,
      hasJobDescription: jobDescription.trim().length >= JD_ENHANCE_MIN_LENGTH,
      rolePreview,
      runOptimize,
      clearReport,
      getFieldSuggestions,
      shouldUseReportForField: shouldUseReportForFieldFn,
    }),
    [
      targetRole,
      setTargetRole,
      customRole,
      setCustomRole,
      resolvedRole,
      experienceLevel,
      setExperienceLevel,
      jobDescription,
      setJobDescription,
      report,
      isReportStale,
      analyzedFingerprint,
      isAnalyzing,
      analyzeError,
      lastAnalyzedAt,
      rolePreview,
      runOptimize,
      clearReport,
      getFieldSuggestions,
      shouldUseReportForFieldFn,
    ]
  );

  return (
    <ResumeOptimizationContext.Provider value={value}>
      {children}
    </ResumeOptimizationContext.Provider>
  );
}
