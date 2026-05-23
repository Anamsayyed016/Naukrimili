/**
 * Central smart context for all resume-builder inline AI suggestions.
 * Single source of truth — consumed by API route, hybrid services, and UI.
 */

import { buildResumeSuggestionContext, type ResumeSuggestionContextInput } from '@/lib/resume-builder/suggestion-context';
import { parseJobDescription, type ParsedJobDescription } from '@/lib/resume-builder/jd-parser';

export interface SmartSuggestionContextInput extends ResumeSuggestionContextInput {
  jobDescription?: string;
  resolvedRole?: string;
  excludeSuggestions?: string[];
  rejectedSuggestions?: string[];
  regenerate?: boolean;
  regenerateIndex?: number;
  templateId?: string;
  parsedResumeSections?: Record<string, unknown>;
}

export interface SmartSuggestionContext extends Record<string, unknown> {
  role: string;
  jobTitle: string;
  experienceLevel: string;
  currentSection: string;
  currentField: string;
  projectName: string;
  technologies: string[];
  skills: string[];
  jobDescription: string;
  parsedJD: ParsedJobDescription | null;
  extractedJDKeywords: string[];
  jdSkills: string[];
  jdResponsibilities: string[];
  jdTechnologies: string[];
  jdIndustry: string;
  jdSeniority: string;
  existingSummary: string;
  existingSkills: string[];
  experienceEntries: string;
  educationEntries: string;
  existingProjects: string[];
  userInput: string;
  previousSuggestions: string[];
  rejectedSuggestions: string[];
  resumeTemplate: string;
  regenerate: boolean;
  regenerateIndex: number;
  certifications?: string[];
  experienceDetails?: string[];
  variationTone?: string;
  suggestionDomain?: string;
}

function collectEducationSummary(education: unknown[]): string {
  return education
    .slice(0, 4)
    .map((edu) => {
      const e = edu as Record<string, unknown>;
      return `${e.degree || ''} ${e.institution || e.school || ''}`.trim();
    })
    .filter(Boolean)
    .join('; ');
}

function collectCertifications(certs: unknown): string[] {
  if (!Array.isArray(certs)) return [];
  return certs
    .map((c) => {
      const row = c as Record<string, unknown>;
      return String(row.name || row.title || row.certification || '').trim();
    })
    .filter(Boolean)
    .slice(0, 8);
}

function mergeSkills(...lists: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const s of list || []) {
      const t = String(s).trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

/**
 * Build the full structured context object every suggestion request should use.
 */
export function buildSmartSuggestionContext(
  input: SmartSuggestionContextInput
): SmartSuggestionContext {
  const base = buildResumeSuggestionContext(input);
  const { formData } = input;

  const jdText = String(
    input.jobDescription || formData.jobDescription || formData.jd || ''
  ).trim();
  const parsedJD = parseJobDescription(jdText);

  const role = String(
    input.resolvedRole || base.jobTitle || formData.jobTitle || formData.title || ''
  ).trim();

  const experience = Array.isArray(formData.experience) ? formData.experience : [];
  const education = Array.isArray(formData.education) ? formData.education : [];
  const skills = mergeSkills(
    base.skills as string[],
    parsedJD?.skills,
    parsedJD?.technologies
  );

  const technologies = mergeSkills(
    input.technologies,
    base.projectTechnologies as string[],
    parsedJD?.technologies
  );

  const experienceLevel = String(
    parsedJD?.seniority && input.regenerate !== true
      ? parsedJD.seniority
      : base.experienceLevel || 'experienced'
  );

  const previousSuggestions = [
    ...(input.excludeSuggestions || []),
    ...(Array.isArray(base.excludeSuggestions) ? (base.excludeSuggestions as string[]) : []),
  ];

  const ctx: SmartSuggestionContext = {
    ...base,
    role,
    jobTitle: role || String(base.jobTitle || ''),
    experienceLevel,
    currentSection: String(input.currentSection || base.currentSection || ''),
    currentField: String(input.currentField || base.currentField || ''),
    projectName: String(input.projectName || base.currentProjectName || ''),
    technologies,
    skills,
    jobDescription: jdText,
    parsedJD,
    extractedJDKeywords: parsedJD?.atsKeywords || [],
    jdSkills: parsedJD?.skills || [],
    jdResponsibilities: parsedJD?.responsibilities || [],
    jdTechnologies: parsedJD?.technologies || [],
    jdIndustry: parsedJD?.industry || String(base.industry || ''),
    jdSeniority: parsedJD?.seniority || '',
    existingSummary: String(formData.summary || formData.bio || base.summary || ''),
    existingSkills: (base.skills as string[]) || [],
    experienceEntries: String(base.existingExperience || ''),
    educationEntries: collectEducationSummary(education),
    existingProjects: (base.existingProjects as string[]) || [],
    userInput: String(input.userInput || base.userInput || ''),
    previousSuggestions,
    rejectedSuggestions: input.rejectedSuggestions || [],
    resumeTemplate: input.templateId || String(base.templateType || 'resume-builder'),
    regenerate: !!input.regenerate,
    regenerateIndex:
      typeof input.regenerateIndex === 'number' ? input.regenerateIndex : 0,
    certifications: collectCertifications(formData.certifications),
    experienceDetails: experience
      .slice(0, 3)
      .map((exp) => {
        const e = exp as Record<string, unknown>;
        return String(e.description || e.Description || '').slice(0, 200);
      })
      .filter(Boolean),
  };

  return ctx;
}

/** Compact block injected into AI prompts (keeps token use reasonable). */
export function buildPromptContextBlock(context: SmartSuggestionContext | Record<string, unknown>): string {
  const c = context as SmartSuggestionContext;
  const payload = {
    role: c.role || c.jobTitle,
    experienceLevel: c.experienceLevel,
    section: c.currentSection,
    field: c.currentField,
    projectName: c.projectName,
    technologies: (c.technologies || []).slice(0, 8),
    skills: (c.skills || []).slice(0, 12),
    projects: (c.existingProjects || []).slice(0, 5),
    summaryExcerpt: String(c.existingSummary || '').slice(0, 200),
    experienceExcerpt: String(c.experienceEntries || '').slice(0, 200),
    jdSkills: (c.jdSkills || []).slice(0, 10),
    jdKeywords: (c.extractedJDKeywords || []).slice(0, 12),
    jdResponsibilities: (c.jdResponsibilities || []).slice(0, 4),
    jdIndustry: c.jdIndustry,
    variationTone: c.variationTone,
    regenerate: c.regenerate,
    excludeCount: (c.previousSuggestions || []).length,
  };
  return JSON.stringify(payload, null, 0);
}
