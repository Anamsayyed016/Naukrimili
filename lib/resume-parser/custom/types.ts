/**
 * Internal types for the custom text-only resume parser (foundation).
 * Not used by production routes until explicit integration.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import type { ResumeDocumentProfile } from '@/lib/resume-parser/resume-document-analysis';
import type { ResumeTextSignals } from '@/lib/resume-parser/text-recovery';

/** Parser revision — bump when extractors or scoring change. */
export const CUSTOM_PARSER_VERSION = '0.1.0-foundation';

/**
 * Section identifiers for future per-section extractors.
 * Wired through extension points only; no extractors registered yet.
 */
export type CustomParserSectionId =
  | 'identity'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'hobbies';

/** 0–100 confidence for a single logical field (scalar or collection). */
export interface CustomParserFieldConfidence {
  field: string;
  confidence: number;
  extractor?: CustomParserSectionId;
  note?: string;
}

/** Aggregate confidence report produced during finalize (foundation: mostly zeros). */
export interface CustomParserConfidenceReport {
  overall: number;
  fields: CustomParserFieldConfidence[];
  parserVersion: string;
}

/** Prepared input shared by all future section extractors. */
export interface CustomParserContext {
  sourceText: string;
  normalizedText: string;
  documentProfile: ResumeDocumentProfile;
  signals: ResumeTextSignals;
  parserVersion: string;
}

/**
 * Extension point: one section extractor merges into a partial ExtractedResumeData.
 * Implementations must be pure (no I/O, no globals).
 */
export interface CustomParserSectionExtractor {
  readonly section: CustomParserSectionId;
  readonly priority: number;
  extract(ctx: CustomParserContext, current: ExtractedResumeData): Partial<ExtractedResumeData>;
}

/**
 * Pipeline hooks for future orchestration. Foundation uses prepare + finalize only.
 */
export interface CustomParserPipelineHooks {
  prepare: (resumeText: string) => CustomParserContext;
  extractors: readonly CustomParserSectionExtractor[];
  finalize: (
    ctx: CustomParserContext,
    data: ExtractedResumeData,
    confidence: CustomParserConfidenceReport
  ) => ExtractedResumeData;
}
