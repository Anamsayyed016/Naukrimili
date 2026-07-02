/**
 * Types for custom education extraction (isolated module).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const EDUCATION_EXTRACTION_VERSION = '1.0.0';

export interface EducationFieldConfidence {
  institution: number;
  degree: number;
  fieldOfStudy: number;
  specialization: number;
  startDate: number;
  endDate: number;
  performance: number;
  location: number;
  description: number;
}

/** Rich education record — maps to ExtractedResumeData.education. */
export interface CustomExtractedEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  specialization: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  cgpa: string;
  gpa: string;
  percentage: string;
  grade: string;
  location: string;
  description: string;
  achievements: string[];
  coursework: string[];
  confidence: number;
  fieldConfidence: EducationFieldConfidence;
}

export interface EducationLine {
  index: number;
  text: string;
  isBlank: boolean;
  isBullet: boolean;
  boundaryScore: number;
}

export interface EducationRawBlock {
  startLine: number;
  endLine: number;
  lines: EducationLine[];
  headerText: string;
  bodyLines: string[];
}

export type CanonicalEducation = ExtractedResumeData['education'][number];

export function toCanonicalEducation(edu: CustomExtractedEducation): CanonicalEducation {
  const gpa =
    edu.cgpa ||
    edu.gpa ||
    edu.percentage ||
    edu.grade ||
    undefined;

  const descriptionParts = [edu.description];
  if (edu.achievements.length > 0) {
    descriptionParts.push(edu.achievements.join('\n'));
  }
  if (edu.coursework.length > 0) {
    descriptionParts.push(`Coursework: ${edu.coursework.join(', ')}`);
  }

  const description = descriptionParts
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();

  return {
    institution: edu.institution || '',
    degree: edu.degree || '',
    field: edu.fieldOfStudy || edu.specialization || '',
    startDate: edu.startDate || '',
    endDate: edu.current ? '' : edu.endDate || '',
    gpa,
    description: description || undefined,
  };
}
