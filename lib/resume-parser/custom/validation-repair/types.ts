/**
 * Types for Validation & Repair Engine (isolated module).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

import type { CustomExtractedEducation } from '../education-extraction/types';
import type { CustomExtractedExperience } from '../experience-extraction/types';
import type { CustomExtractedIdentity } from '../identity-extraction/types';
import type { CustomExtractedProject } from '../project-extraction/types';
import type { CustomExtractedSummary } from '../summary-extraction/types';
import type { IntelligentSkill } from '../skills-intelligence/types';

export const VALIDATION_REPAIR_VERSION = '1.0.0';

export type EvidenceSource =
  | 'current_section'
  | 'previous_lines'
  | 'next_lines'
  | 'section_metadata'
  | 'parser_aliases'
  | 'other_parser_output'
  | 'raw_text';

export type ValidationSeverity = 'error' | 'warning' | 'manual_review';

export interface ValidationIssue {
  severity: ValidationSeverity;
  section: string;
  field?: string;
  index?: number;
  code: string;
  message: string;
}

export interface RepairRecord {
  section: string;
  field: string;
  index?: number;
  originalValue: string;
  recoveredValue: string;
  evidenceSource: EvidenceSource;
  confidence: number;
  reason: string;
}

export interface SectionConfidenceScores {
  identity: number;
  summary: number;
  experience: number;
  projects: number;
  education: number;
  skills: number;
  languages: number;
  certifications: number;
}

export interface ValidationReport {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  manualReview: ValidationIssue[];
  sectionConfidence: SectionConfidenceScores;
}

export interface RepairReport {
  repairs: RepairRecord[];
  repairCount: number;
}

export interface ValidationRepairInput {
  rawText?: string;
  identity?: CustomExtractedIdentity | null;
  summary?: CustomExtractedSummary | null;
  experiences?: CustomExtractedExperience[];
  projects?: CustomExtractedProject[];
  educations?: CustomExtractedEducation[];
  skills?: IntelligentSkill[];
  languages?: ExtractedResumeData['languages'];
  certifications?: ExtractedResumeData['certifications'];
  parserConfidence?: number;
  sectionTexts?: {
    experience?: string;
    projects?: string;
    education?: string;
    skills?: string;
    summary?: string;
    contact?: string;
    languages?: string;
    certifications?: string;
  };
}

export interface ValidatedResumeBundle {
  identity: CustomExtractedIdentity | null;
  summary: CustomExtractedSummary | null;
  experiences: CustomExtractedExperience[];
  projects: CustomExtractedProject[];
  educations: CustomExtractedEducation[];
  skills: IntelligentSkill[];
  languages: ExtractedResumeData['languages'];
  certifications: ExtractedResumeData['certifications'];
}

export interface ValidationRepairResult {
  resume: ExtractedResumeData;
  validated: ValidatedResumeBundle;
  validationReport: ValidationReport;
  repairReport: RepairReport;
  resumeQualityScore: number;
  parserConfidenceScore: number;
}

export interface RepairContext {
  rawText: string;
  sectionTexts: NonNullable<ValidationRepairInput['sectionTexts']>;
  repairs: RepairRecord[];
  issues: ValidationIssue[];
  allExperiences: CustomExtractedExperience[];
  allProjects: CustomExtractedProject[];
  allEducations: CustomExtractedEducation[];
  allSkills: IntelligentSkill[];
}

export function createRepairContext(input: ValidationRepairInput): RepairContext {
  return {
    rawText: input.rawText || '',
    sectionTexts: input.sectionTexts || {},
    repairs: [],
    issues: [],
    allExperiences: [...(input.experiences || [])],
    allProjects: [...(input.projects || [])],
    allEducations: [...(input.educations || [])],
    allSkills: [...(input.skills || [])],
  };
}

export function recordRepair(
  ctx: RepairContext,
  record: Omit<RepairRecord, 'confidence'> & { confidence: number }
): void {
  if (record.originalValue === record.recoveredValue) return;
  ctx.repairs.push(record);
}

export function recordIssue(ctx: RepairContext, issue: ValidationIssue): void {
  ctx.issues.push(issue);
}
