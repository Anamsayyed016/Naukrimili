/**
 * Metadata assembly — validation, repairs, quality scores (internal only).
 */

import { CANONICAL_RESUME_VERSION } from './types';
import type {
  BuildCanonicalResumeInput,
  CanonicalResumeMetadata,
  ParserDiagnostics,
  QualityMetadata,
  RejectedDiagnosticEntry,
} from './types';
import type { RepairReport, ValidationReport } from '../validation-repair/types';

export function buildQualityMetadata(input: {
  validationReport: ValidationReport;
  repairReport: RepairReport;
  resumeQualityScore: number;
  parserConfidenceScore: number;
}): QualityMetadata {
  const { validationReport, repairReport, resumeQualityScore, parserConfidenceScore } = input;

  return {
    resumeQualityScore,
    parserConfidenceScore,
    repairCount: repairReport.repairCount,
    warningCount: validationReport.warnings.length,
    manualReviewCount: validationReport.manualReview.length,
    errorCount: validationReport.errors.length,
    sectionConfidence: { ...validationReport.sectionConfidence },
  };
}

export function buildParserDiagnostics(
  input: BuildCanonicalResumeInput
): ParserDiagnostics {
  const partial = input.parserDiagnostics || {};

  return {
    parserVersion: CANONICAL_RESUME_VERSION,
    customParserVersion: partial.customParserVersion,
    rawTextLength: partial.rawTextLength ?? (input.rawText || '').length,
    rawText: input.rawText || partial.rawText,
    source: partial.source,
    extractionModules: partial.extractionModules,
    notes: partial.notes,
  };
}

export function buildCanonicalMetadata(
  input: BuildCanonicalResumeInput
): CanonicalResumeMetadata {
  return {
    validation: snapshotValidationReport(input.validationReport),
    repairs: snapshotRepairReport(input.repairReport),
    quality: buildQualityMetadata(input),
    parser: buildParserDiagnostics(input),
    rejected: Object.freeze([...(input.rejected || [])]) as readonly RejectedDiagnosticEntry[],
  };
}

function snapshotValidationReport(report: ValidationReport): ValidationReport {
  return {
    errors: report.errors.map((e) => ({ ...e })),
    warnings: report.warnings.map((w) => ({ ...w })),
    manualReview: report.manualReview.map((m) => ({ ...m })),
    sectionConfidence: { ...report.sectionConfidence },
  };
}

function snapshotRepairReport(report: RepairReport): RepairReport {
  return {
    repairCount: report.repairCount,
    repairs: report.repairs.map((r) => ({ ...r })),
  };
}
