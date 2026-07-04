/**
 * Assemble validated sections into canonical ExtractedResumeData.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

import { createEmptyExtractedResumeData } from '../empty-extracted';
import { toCanonicalEducation } from '../education-extraction/types';
import { toCanonicalExperience } from '../experience-extraction/types';
import { toCanonicalIdentity } from '../identity-extraction/types';
import { toCanonicalProject } from '../project-extraction/types';
import { toCanonicalSummary } from '../summary-extraction/types';
import { toCanonicalSkills } from '../skills-intelligence/types';
import type { ValidatedResumeBundle } from './types';

export function assembleValidatedResume(
  bundle: ValidatedResumeBundle,
  rawText: string,
  _resumeQualityScore: number,
  parserConfidenceScore: number
): ExtractedResumeData {
  const base = createEmptyExtractedResumeData(rawText);

  const identity = bundle.identity ? toCanonicalIdentity(bundle.identity) : null;
  const summary = bundle.summary ? toCanonicalSummary(bundle.summary) : null;

  return {
    ...base,
    fullName: identity?.fullName || '',
    email: identity?.email || '',
    phone: identity?.phone || '',
    location: identity?.location || '',
    linkedin: identity?.linkedin || '',
    portfolio: identity?.portfolio || bundle.identity?.github || '',
    summary: summary?.summary || '',
    skills: toCanonicalSkills(bundle.skills),
    experience: bundle.experiences.map(toCanonicalExperience),
    education: bundle.educations.map(toCanonicalEducation),
    projects: bundle.projects.map(toCanonicalProject),
    certifications: bundle.certifications || [],
    languages: bundle.languages || [],
    achievements: bundle.achievements || [],
    hobbies: bundle.hobbies || [],
    confidence: parserConfidenceScore,
    rawText,
    // Store quality metadata in achievements slot is wrong - use confidence only
    // resumeQualityScore exposed via ValidationRepairResult, not embedded in canonical
  };
}
