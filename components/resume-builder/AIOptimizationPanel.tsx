'use client';

/**
 * Collapsible AI Optimization drawer — lives inside the form column only.
 */

import { useState, useCallback, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { OptimizationReport } from '@/lib/resume-builder/ai-optimization/types';

const TARGET_ROLES = [
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'HR Manager',
  'Recruiter',
  'UI/UX Designer',
  'Graphic Designer',
  'Digital Marketing Specialist',
  'Product Manager',
  'Business Analyst',
  'DevOps Engineer',
  'QA Engineer',
];

const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher / Entry' },
  { value: 'student', label: 'Student / Intern' },
  { value: 'experienced', label: 'Experienced' },
  { value: 'senior', label: 'Senior / Lead' },
];

interface AIOptimizationPanelProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

export default function AIOptimizationPanel({
  formData,
  updateFormData,
}: AIOptimizationPanelProps) {
  const { status } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [targetRole, setTargetRole] = useState(
    () => String(formData.jobTitle || formData.title || TARGET_ROLES[0])
  );
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState(
    () => String(formData.experienceLevel || 'experienced')
  );
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const analyzeInFlightRef = useRef(false);
  const lastAnalyzeAtRef = useRef(0);
  const ANALYZE_COOLDOWN_MS = 2000;

  const resolvedRole =
    targetRole === '__custom__' ? customRole.trim() : targetRole.trim();

  const analyze = useCallback(async () => {
    if (analyzeInFlightRef.current || loading) return;

    const now = Date.now();
    if (now - lastAnalyzeAtRef.current < ANALYZE_COOLDOWN_MS) {
      toast({
        title: 'Please wait',
        description: 'Analysis was just requested. Try again in a moment.',
      });
      return;
    }

    if (status !== 'authenticated') {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to run AI resume optimization.',
        variant: 'destructive',
      });
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    if (!resolvedRole) {
      setError('Select or enter a target role');
      return;
    }
    if (jobDescription.trim().length < 40) {
      setError('Paste a job description (at least 40 characters)');
      return;
    }

    setLoading(true);
    setError(null);
    analyzeInFlightRef.current = true;
    lastAnalyzeAtRef.current = now;

    try {
      const res = await fetch('/api/resume-builder/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: resolvedRole,
          industry: formData.industry || '',
          experienceLevel,
          jobDescription: jobDescription.trim(),
          formData,
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
      toast({
        title: 'Analysis complete',
        description: data.cached
          ? 'Loaded cached results for this resume and JD.'
          : `Role match: ${data.roleMatchPercent}% · ATS: ${data.atsScore}%`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      toast({ title: 'Optimization failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
      analyzeInFlightRef.current = false;
    }
  }, [status, resolvedRole, jobDescription, experienceLevel, formData, toast, loading]);

  const applyProject = (project: OptimizationReport['suggestedProjects'][0]) => {
    const existing = Array.isArray(formData.projects)
      ? [...(formData.projects as Record<string, unknown>[])]
      : [];
    existing.push({ title: project.title, description: project.description });
    updateFormData({ projects: existing });
    toast({ title: 'Project added' });
  };

  const applySummary = () => {
    if (!report?.summary?.suggested) return;
    updateFormData({ summary: report.summary.suggested });
    toast({ title: 'Summary applied' });
  };

  const applySkills = () => {
    if (!report?.suggestedSkills?.length) return;
    const existing = Array.isArray(formData.skills)
      ? (formData.skills as string[]).map((s) => s.toLowerCase())
      : [];
    const merged = [
      ...(Array.isArray(formData.skills) ? (formData.skills as string[]) : []),
      ...report.suggestedSkills.filter((s) => !existing.includes(s.toLowerCase())),
    ];
    updateFormData({ skills: [...new Set(merged)].slice(0, 24) });
    toast({ title: 'Skills added' });
  };

  const applyKeywords = () => {
    if (!report?.atsKeywords?.length) return;
    updateFormData({ ats_keywords: report.atsKeywords });
    toast({ title: 'ATS keywords saved' });
  };

  const applyBullet = (bullet: OptimizationReport['experienceBullets'][0]) => {
    const experiences = Array.isArray(formData.experience)
      ? [...(formData.experience as Record<string, unknown>[])]
      : [];
    if (!experiences[bullet.experienceIndex]) return;
    experiences[bullet.experienceIndex] = {
      ...experiences[bullet.experienceIndex],
      description: bullet.improved,
    };
    updateFormData({ experience: experiences });
    toast({ title: 'Experience updated' });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="resume-ai-optimize-drawer">
      <CollapsibleTrigger className="resume-ai-optimize-trigger">
        <span className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
          <span className="truncate">AI Resume Optimization</span>
          {report && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {report.roleMatchPercent}% match
            </Badge>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </CollapsibleTrigger>

      <CollapsibleContent className="resume-ai-optimize-body">
        <p className="text-xs text-slate-600 mb-3">
          Paste a job description for recruiter-level, ATS-aware suggestions. Apply changes only when you choose.
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium flex items-center gap-1 mb-1">
              <Target className="w-3 h-3" /> Target role
            </Label>
            <select
              value={targetRole || TARGET_ROLES[0]}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {TARGET_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="__custom__">Custom role…</option>
            </select>
            {targetRole === '__custom__' && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Cloud Solutions Architect"
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            )}
          </div>

          <div>
            <Label className="text-xs font-medium mb-1 block">Experience level</Label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-medium flex items-center gap-1 mb-1">
              <FileText className="w-3 h-3" /> Job description
            </Label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              rows={5}
              className="text-sm resize-y min-h-[100px]"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze resume
              </>
            )}
          </Button>

          {status === 'unauthenticated' && (
            <p className="text-xs text-amber-700">Sign in required to analyze.</p>
          )}

          {report && (
            <div className="space-y-0">
              <div className="resume-ai-optimize-scores">
                <div className="resume-ai-score-card">
                  <p className="text-[10px] uppercase text-slate-500">ATS score</p>
                  <p className="text-xl font-bold text-slate-900">{report.atsScore}%</p>
                </div>
                <div className="resume-ai-score-card">
                  <p className="text-[10px] uppercase text-slate-500">Role match</p>
                  <p className="text-xl font-bold text-blue-700">{report.roleMatchPercent}%</p>
                </div>
              </div>

              {report.qualityIssues.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Resume quality</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    {report.qualityIssues.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </section>
              )}

              {report.skillGaps.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Skill gaps</p>
                  <ul className="mt-1 space-y-1.5 text-xs text-slate-600">
                    {report.skillGaps.map((g, i) => (
                      <li key={i}>
                        <span className="font-medium text-slate-800">{g.skill}</span>
                        <span className="text-slate-400"> · {g.priority}</span>
                        {g.reason ? <p className="text-slate-500 mt-0.5">{g.reason}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {report.missingSkills.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Missing skills</p>
                  <div className="resume-ai-chip-list">
                    {report.missingSkills.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {report.missingKeywords.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Missing keywords</p>
                  <div className="resume-ai-chip-list">
                    {report.missingKeywords.slice(0, 12).map((k) => (
                      <Badge key={k} variant="secondary" className="text-xs">
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    onClick={applyKeywords}
                  >
                    Save keywords
                  </Button>
                </section>
              )}

              {report.summary?.suggested && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Improved summary</p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-4">{report.summary.suggested}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    onClick={applySummary}
                  >
                    Apply summary
                  </Button>
                </section>
              )}

              {report.suggestedSkills.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Suggested skills</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    onClick={applySkills}
                  >
                    Add skills to resume
                  </Button>
                </section>
              )}

              {report.experienceBullets.map((b, i) => (
                <section key={i} className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">
                    Experience bullet {b.experienceIndex + 1}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{b.improved}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    onClick={() => applyBullet(b)}
                  >
                    Apply bullet
                  </Button>
                </section>
              ))}

              {report.roleSpecificRecommendations.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Recruiter recommendations</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    {report.roleSpecificRecommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </section>
              )}

              {report.recruiterNotes.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Insider notes</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    {report.recruiterNotes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </section>
              )}

              {report.fresherGuidance && report.fresherGuidance.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Fresher guidance</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600 list-disc pl-4">
                    {report.fresherGuidance.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </section>
              )}

              {report.suggestedProjects.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Suggested projects</p>
                  <ul className="mt-1 space-y-2">
                    {report.suggestedProjects.map((p, i) => (
                      <li key={i} className="text-xs text-slate-600 border border-slate-100 rounded-md p-2 bg-white">
                        <p className="font-medium text-slate-800">{p.title}</p>
                        <p className="mt-0.5">{p.description}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => applyProject(p)}
                        >
                          Add project
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {report.suggestedCertifications.length > 0 && (
                <section className="resume-ai-section">
                  <p className="text-xs font-semibold text-slate-800">Suggested certifications</p>
                  <div className="resume-ai-chip-list">
                    {report.suggestedCertifications.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
