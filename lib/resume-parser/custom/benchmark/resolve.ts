/**
 * Resolve benchmark actual output to comparable shapes.
 */

import { buildCanonicalResumeFromValidation } from '../canonical-resume/build';
import { toExtractedResumeData } from '../canonical-resume/serialize';
import type { CanonicalResume } from '../canonical-resume/types';
import type { ValidationRepairResult } from '../validation-repair/types';
import type { BenchmarkActualOutput, ResolvedBenchmarkActual } from './types';

export function resolveBenchmarkActual(actual: BenchmarkActualOutput): ResolvedBenchmarkActual {
  if (actual.kind === 'extracted') {
    return { extracted: actual.data };
  }

  if (actual.kind === 'canonical') {
    return {
      extracted: toExtractedResumeData(actual.resume),
      canonical: actual.resume,
    };
  }

  const result = actual.result;
  const canonical = buildCanonicalResumeFromValidation(result);
  return {
    extracted: result.resume,
    canonical,
    validation: result,
    intelligentSkills: result.validated.skills,
  };
}

export function countCanonicalNodes(resume: CanonicalResume): number {
  return (
    2 +
    resume.experience.length +
    resume.projects.length +
    resume.education.length +
    resume.skills.length +
    resume.languages.length +
    resume.certifications.length
  );
}
