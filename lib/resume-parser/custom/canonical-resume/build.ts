/**
 * Build CanonicalResume from validated data only.
 */

import { toCanonicalEducation } from '../education-extraction/types';
import { toCanonicalExperience } from '../experience-extraction/types';
import { toCanonicalIdentity } from '../identity-extraction/types';
import { toCanonicalProject } from '../project-extraction/types';
import { toCanonicalSummary } from '../summary-extraction/types';
import { toCanonicalSkills } from '../skills-intelligence/types';
import type { ValidationRepairResult, ValidatedResumeBundle } from '../validation-repair/types';
import { freezeCanonicalResume } from './immutable';
import { buildCanonicalMetadata } from './metadata';
import {
  createCertificationNode,
  createEducationNode,
  createExperienceNode,
  createIdentityNode,
  createProjectNode,
  createSkillNode,
  createSummaryNode,
  normalizeLanguageEntry,
} from './nodes';
import type {
  BuildCanonicalResumeInput,
  CanonicalCertificationData,
  CanonicalLanguageData,
  CanonicalResume,
  RejectedDiagnosticEntry,
} from './types';
import { CANONICAL_RESUME_VERSION } from './types';

function normalizeLanguages(
  languages: ValidatedResumeBundle['languages']
): CanonicalLanguageData[] {
  if (!languages?.length) return [];
  return languages.map((entry) =>
    typeof entry === 'string'
      ? { name: entry.trim() }
      : { name: (entry.name || '').trim(), proficiency: entry.proficiency }
  );
}

function normalizeCertifications(
  certifications: ValidatedResumeBundle['certifications']
): CanonicalCertificationData[] {
  if (!certifications?.length) return [];
  return certifications.map((c) => ({
    name: c.name || '',
    issuer: c.issuer || '',
    date: c.date || '',
    url: c.url,
  }));
}

function mapValidatedBundleToInput(
  bundle: ValidatedResumeBundle,
  reports: Pick<
    ValidationRepairResult,
    'validationReport' | 'repairReport' | 'resumeQualityScore' | 'parserConfidenceScore'
  >,
  options?: {
    rawText?: string;
    rejected?: RejectedDiagnosticEntry[];
    parserDiagnostics?: BuildCanonicalResumeInput['parserDiagnostics'];
  }
): BuildCanonicalResumeInput {
  const identity = bundle.identity
    ? toCanonicalIdentity(bundle.identity)
    : { fullName: '', email: '', phone: '' };
  const summary = bundle.summary ? toCanonicalSummary(bundle.summary) : { summary: '' };

  return {
    identity,
    summary,
    experience: bundle.experiences.map(toCanonicalExperience),
    projects: bundle.projects.map(toCanonicalProject),
    education: bundle.educations.map(toCanonicalEducation),
    skills: toCanonicalSkills(bundle.skills).map((name) => ({ name })),
    languages: normalizeLanguages(bundle.languages),
    certifications: normalizeCertifications(bundle.certifications),
    validationReport: reports.validationReport,
    repairReport: reports.repairReport,
    resumeQualityScore: reports.resumeQualityScore,
    parserConfidenceScore: reports.parserConfidenceScore,
    rawText: options?.rawText,
    rejected: options?.rejected,
    parserDiagnostics: options?.parserDiagnostics,
  };
}

/**
 * Merge ONLY validated section data into the canonical graph.
 * Invalid / rejected entries must be passed via `rejected` diagnostics.
 */
export function buildCanonicalResume(input: BuildCanonicalResumeInput): CanonicalResume {
  const metadata = buildCanonicalMetadata(input);

  const resume: CanonicalResume = {
    version: CANONICAL_RESUME_VERSION,
    identity: createIdentityNode(input.identity),
    summary: createSummaryNode(input.summary),
    experience: Object.freeze(
      input.experience.map((exp, index) => createExperienceNode(index, exp))
    ),
    projects: Object.freeze(input.projects.map((proj, index) => createProjectNode(index, proj))),
    education: Object.freeze(input.education.map((edu, index) => createEducationNode(index, edu))),
    skills: Object.freeze(input.skills.map((skill, index) => createSkillNode(index, skill))),
    languages: Object.freeze(
      input.languages.map((lang, index) => normalizeLanguageEntry(lang, index))
    ),
    certifications: Object.freeze(
      input.certifications.map((cert, index) => createCertificationNode(index, cert))
    ),
    metadata,
  };

  return freezeCanonicalResume(resume);
}

/** Build from validation & repair engine output (validated bundle only). */
export function buildCanonicalResumeFromValidation(
  result: ValidationRepairResult,
  options?: {
    rejected?: RejectedDiagnosticEntry[];
    parserDiagnostics?: BuildCanonicalResumeInput['parserDiagnostics'];
  }
): CanonicalResume {
  const input = mapValidatedBundleToInput(
    result.validated,
    {
      validationReport: result.validationReport,
      repairReport: result.repairReport,
      resumeQualityScore: result.resumeQualityScore,
      parserConfidenceScore: result.parserConfidenceScore,
    },
    {
      rawText: result.resume.rawText,
      rejected: options?.rejected,
      parserDiagnostics: options?.parserDiagnostics,
    }
  );

  return buildCanonicalResume(input);
}
