/**
 * Canonical Resume Model — single source of truth for custom parser pipeline.
 *
 * User-visible fields reuse ExtractedResumeData shapes.
 * Parser / validation / confidence data lives in metadata only.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

import type { RepairReport, SectionConfidenceScores, ValidationReport } from '../validation-repair/types';

export const CANONICAL_RESUME_VERSION = '1.0.0';

/** Scalar sections — one node per resume. */
export type CanonicalIdentityData = Pick<
  ExtractedResumeData,
  'fullName' | 'email' | 'phone' | 'location' | 'linkedin' | 'portfolio'
>;

export type CanonicalSummaryData = Pick<ExtractedResumeData, 'summary'>;

export type CanonicalExperienceData = ExtractedResumeData['experience'][number];
export type CanonicalEducationData = ExtractedResumeData['education'][number];
export type CanonicalProjectData = NonNullable<ExtractedResumeData['projects']>[number];
export type CanonicalCertificationData = NonNullable<ExtractedResumeData['certifications']>[number];

export interface CanonicalLanguageData {
  name: string;
  proficiency?: string;
}

export interface CanonicalSkillData {
  name: string;
}

export interface CanonicalIdentityNode {
  readonly id: string;
  readonly data: CanonicalIdentityData;
}

export interface CanonicalSummaryNode {
  readonly id: string;
  readonly data: CanonicalSummaryData;
}

export interface CanonicalExperienceNode {
  readonly id: string;
  readonly data: CanonicalExperienceData;
}

export interface CanonicalProjectNode {
  readonly id: string;
  readonly data: CanonicalProjectData;
}

export interface CanonicalEducationNode {
  readonly id: string;
  readonly data: CanonicalEducationData;
}

export interface CanonicalSkillNode {
  readonly id: string;
  readonly data: CanonicalSkillData;
}

export interface CanonicalLanguageNode {
  readonly id: string;
  readonly data: CanonicalLanguageData;
}

export interface CanonicalCertificationNode {
  readonly id: string;
  readonly data: CanonicalCertificationData;
}

export interface ParserDiagnostics {
  parserVersion: string;
  customParserVersion?: string;
  rawTextLength: number;
  rawText?: string;
  source?: string;
  extractionModules?: string[];
  notes?: string[];
}

export interface QualityMetadata {
  resumeQualityScore: number;
  parserConfidenceScore: number;
  repairCount: number;
  warningCount: number;
  manualReviewCount: number;
  errorCount: number;
  sectionConfidence: SectionConfidenceScores;
}

export interface RejectedDiagnosticEntry {
  section: string;
  index?: number;
  reason: string;
  code?: string;
}

export interface CanonicalResumeMetadata {
  readonly validation: ValidationReport;
  readonly repairs: RepairReport;
  readonly quality: QualityMetadata;
  readonly parser: ParserDiagnostics;
  readonly rejected: readonly RejectedDiagnosticEntry[];
}

/**
 * Immutable canonical resume graph — the only cross-module communication surface.
 */
export interface CanonicalResume {
  readonly version: string;
  readonly identity: CanonicalIdentityNode;
  readonly summary: CanonicalSummaryNode;
  readonly experience: readonly CanonicalExperienceNode[];
  readonly projects: readonly CanonicalProjectNode[];
  readonly education: readonly CanonicalEducationNode[];
  readonly skills: readonly CanonicalSkillNode[];
  readonly languages: readonly CanonicalLanguageNode[];
  readonly certifications: readonly CanonicalCertificationNode[];
  readonly metadata: CanonicalResumeMetadata;
}

export interface BuildCanonicalResumeInput {
  identity: CanonicalIdentityData;
  summary: CanonicalSummaryData;
  experience: CanonicalExperienceData[];
  projects: CanonicalProjectData[];
  education: CanonicalEducationData[];
  skills: CanonicalSkillData[];
  languages: CanonicalLanguageData[];
  certifications: CanonicalCertificationData[];
  validationReport: ValidationReport;
  repairReport: RepairReport;
  resumeQualityScore: number;
  parserConfidenceScore: number;
  rawText?: string;
  parserDiagnostics?: Partial<ParserDiagnostics>;
  rejected?: RejectedDiagnosticEntry[];
}

/** JSON-serializable snapshot (full internal model). */
export interface CanonicalResumeSnapshot {
  version: string;
  identity: CanonicalIdentityNode;
  summary: CanonicalSummaryNode;
  experience: CanonicalExperienceNode[];
  projects: CanonicalProjectNode[];
  education: CanonicalEducationNode[];
  skills: CanonicalSkillNode[];
  languages: CanonicalLanguageNode[];
  certifications: CanonicalCertificationNode[];
  metadata: CanonicalResumeMetadata;
}
