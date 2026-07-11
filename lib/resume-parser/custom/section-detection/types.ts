/**
 * Types for the custom parser section detection engine (isolated module).
 */

import type { AdaptiveParseStrategy } from '@/lib/resume-parser/adaptive-parse-strategy';
import type { DynamicDocumentAnalysis } from '@/lib/resume-parser/dynamic-document-analysis';
import type { ResumeDocumentProfile } from '@/lib/resume-parser/resume-document-analysis';

export const SECTION_DETECTION_VERSION = '1.0.0';

/** Canonical section types the detector maps headings onto. */
export type NormalizedSectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'languages'
  | 'certifications'
  | 'achievements'
  | 'hobbies'
  | 'references'
  | 'volunteer'
  | 'publications'
  | 'custom';

export interface SectionScoreBreakdown {
  keyword: number;
  capitalization: number;
  formatting: number;
  context: number;
  content: number;
  profile: number;
  total: number;
}

/** One detected section block with offsets into normalized text. */
export interface DetectedSectionBlock {
  type: NormalizedSectionType;
  confidence: number;
  startIndex: number;
  endIndex: number;
  lineStart: number;
  lineEnd: number;
  rawHeading: string;
  content: string;
  scores: SectionScoreBreakdown;
}

export interface CustomSectionBlock {
  rawHeading: string;
  content: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface SectionCoverageReport {
  complete: boolean;
  assignedChars: number;
  totalChars: number;
  gaps: Array<{ start: number; end: number; text: string }>;
  overlaps: Array<{ sectionA: number; sectionB: number; start: number; end: number }>;
}

/**
 * Flat map of section bodies plus metadata — content only, no field parsing.
 */
export interface DetectedResumeSections {
  detectionVersion: string;
  normalizedText: string;
  documentProfile: ResumeDocumentProfile;
  /** Dynamic layout/quality analysis (optional — backward compatible). */
  documentAnalysis?: DynamicDocumentAnalysis;
  /** Self-adaptive parsing strategy derived from analysis. */
  parseStrategy?: AdaptiveParseStrategy;
  /** Contact / header block before the first detected heading. */
  preamble: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  projects: string;
  languages: string;
  certifications: string;
  achievements: string;
  hobbies: string;
  references: string;
  volunteer: string;
  publications: string;
  customSections: CustomSectionBlock[];
  /** Ordered section blocks (document order). */
  sections: DetectedSectionBlock[];
  coverage: SectionCoverageReport;
}

export interface LineSpan {
  index: number;
  text: string;
  start: number;
  end: number;
  isBlank: boolean;
}

export interface HeadingCandidate {
  lineIndex: number;
  rawHeading: string;
  type: NormalizedSectionType;
  confidence: number;
  scores: SectionScoreBreakdown;
  typeScores: Partial<Record<NormalizedSectionType, number>>;
}
