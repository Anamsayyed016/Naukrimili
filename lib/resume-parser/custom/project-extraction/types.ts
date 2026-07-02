/**
 * Types for custom project extraction (isolated module).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const PROJECT_EXTRACTION_VERSION = '1.0.0';

export interface ProjectFieldConfidence {
  title: number;
  role: number;
  description: number;
  technologies: number;
  links: number;
  company: number;
  duration: number;
}

/** Rich project record — maps to ExtractedResumeData.projects via toCanonicalProject(). */
export interface CustomExtractedProject {
  title: string;
  role: string;
  description: string;
  technologies: string[];
  github: string;
  liveUrl: string;
  duration: string;
  company: string;
  achievements: string[];
  confidence: number;
  fieldConfidence: ProjectFieldConfidence;
}

export interface ProjectLine {
  index: number;
  text: string;
  isBlank: boolean;
  isBullet: boolean;
  boundaryScore: number;
}

export interface ProjectRawBlock {
  startLine: number;
  endLine: number;
  lines: ProjectLine[];
  headerText: string;
  bodyLines: string[];
}

export type CanonicalProject = NonNullable<ExtractedResumeData['projects']>[number];

export function toCanonicalProject(project: CustomExtractedProject): CanonicalProject {
  const url = project.liveUrl || project.github || undefined;
  const description =
    project.description ||
    (project.achievements.length > 0 ? project.achievements.join('\n') : '');

  let startDate: string | undefined;
  let endDate: string | undefined;
  const durationMatch = project.duration.match(
    /(\d{4}(?:-\d{2})?|\w+\s+\d{4}).*?(\d{4}(?:-\d{2})?|\w+\s+\d{4}|present|current)/i
  );
  if (durationMatch) {
    startDate = durationMatch[1];
    const end = durationMatch[2];
    if (!/present|current/i.test(end)) endDate = end;
  }

  return {
    name: project.title || '',
    description,
    technologies: [...project.technologies],
    url,
    startDate,
    endDate,
  };
}
