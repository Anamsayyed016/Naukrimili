/**
 * Types for custom experience extraction (isolated module).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const EXPERIENCE_EXTRACTION_VERSION = '1.0.0';

export interface ExperienceFieldConfidence {
  company: number;
  designation: number;
  location: number;
  employmentType: number;
  startDate: number;
  endDate: number;
  description: number;
}

/** Rich experience record with confidence — maps to ExtractedResumeData.experience. */
export interface CustomExtractedExperience {
  company: string;
  designation: string;
  location: string;
  employmentType: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  description: string;
  bulletPoints: string[];
  technologies: string[];
  confidence: number;
  fieldConfidence: ExperienceFieldConfidence;
}

export type ExperienceLineRole =
  | 'boundary'
  | 'company'
  | 'designation'
  | 'location'
  | 'date'
  | 'employmentType'
  | 'bullet'
  | 'description'
  | 'noise';

export interface ExperienceLine {
  index: number;
  text: string;
  isBlank: boolean;
  isBullet: boolean;
  boundaryScore: number;
  role: ExperienceLineRole;
}

export interface ExperienceRawBlock {
  startLine: number;
  endLine: number;
  lines: ExperienceLine[];
  headerText: string;
  bodyLines: string[];
}

export interface ParsedDateRange {
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  confidence: number;
  raw: string;
}

export type CanonicalExperience = ExtractedResumeData['experience'][number];

export function toCanonicalExperience(exp: CustomExtractedExperience): CanonicalExperience {
  return {
    company: exp.company || '',
    position: exp.designation || '',
    location: exp.location || undefined,
    startDate: exp.startDate || '',
    endDate: exp.current ? undefined : exp.endDate || undefined,
    current: exp.current,
    description: exp.description,
    achievements: [...exp.bulletPoints],
  };
}
