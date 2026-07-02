/**
 * Production Parser Orchestrator — types (Phase 1, not wired to upload route).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import type { ResumeDocumentProfile } from '@/lib/resume-parser/resume-document-analysis';

import type { ParserRunMetrics, OrchestratorMetrics } from './metrics';
import type { CustomParserMode, OrchestratorConfig } from './config';

export const PARSER_ORCHESTRATOR_VERSION = '1.0.0';

export type ParserId =
  | 'custom'
  | 'affinda'
  | 'apilayer'
  | 'eden'
  | 'eden+apilayer'
  | 'document-autofill'
  | 'hybrid'
  | 'text-recovery'
  | 'legacy-chain';

export interface OrchestratorInput {
  /** Normalized resume text (after prepareResumeTextForParsing). */
  normalizedText: string;
  /** Original file buffer when document parsers are available. */
  fileBuffer?: Buffer;
  fileName?: string;
  /** Document profile from prepareResumeTextForParsing. */
  documentProfile?: ResumeDocumentProfile | null;
  /** Optional correlation id (upload id, request id, etc.). */
  resumeIdentifier?: string;
}

export interface ParserAdapterResult {
  data: ExtractedResumeData;
  parserId: ParserId;
  parserVersion: string;
  confidence: number;
  resumeQuality?: number;
  executionTimeMs: number;
  sectionScores?: Record<string, number>;
  validationErrorCount?: number;
  fallbackTriggered?: boolean;
  fallbackReason?: string;
}

export interface OrchestratorResult {
  /** Selected parser output — production ExtractedResumeData schema only. */
  data: ExtractedResumeData | null;
  selectedParser: ParserId | 'production-deferred';
  config: OrchestratorConfig;
  metrics: OrchestratorMetrics;
  /** When true, caller must run the full existing production parser chain. */
  deferToProductionParser: boolean;
  fallbackReason?: string;
}

export interface OrchestratorOptions {
  /** Override env-based config (testing). */
  configOverride?: Partial<OrchestratorConfig>;
  /**
   * Production integration: on custom failure, defer to caller's legacy parser
   * instead of runLegacyProductionParser() inside the orchestrator.
   */
  deferProductionFallback?: boolean;
}

export type { ParserRunMetrics, OrchestratorMetrics, CustomParserMode, OrchestratorConfig };
