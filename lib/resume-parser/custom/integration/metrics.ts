/**
 * Internal parser metrics — no analytics service.
 */

import type { ParserId } from './types';
import { PARSER_ORCHESTRATOR_VERSION } from './types';

export interface ParserRunMetrics {
  parserName: ParserId;
  parserVersion: string;
  executionTimeMs: number;
  confidence: number;
  resumeQuality: number;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  sectionScores: Record<string, number>;
  resumeIdentifier?: string;
  timestamp: string;
}

export interface OrchestratorMetrics {
  orchestratorVersion: string;
  mode: string;
  selectedParser: ParserId | 'production-deferred';
  totalExecutionTimeMs: number;
  primary: ParserRunMetrics;
  shadow?: ParserRunMetrics;
  configSnapshot: {
    enabled: boolean;
    mode: string;
    confidenceThreshold: number;
    qualityThreshold: number;
  };
}

export function createParserRunMetrics(input: {
  parserName: ParserId;
  parserVersion: string;
  executionTimeMs: number;
  confidence: number;
  resumeQuality?: number;
  fallbackTriggered?: boolean;
  fallbackReason?: string;
  sectionScores?: Record<string, number>;
  resumeIdentifier?: string;
  deterministic?: boolean;
}): ParserRunMetrics {
  return {
    parserName: input.parserName,
    parserVersion: input.parserVersion,
    executionTimeMs: Math.round(input.executionTimeMs),
    confidence: Math.round(input.confidence),
    resumeQuality: Math.round(input.resumeQuality ?? 0),
    fallbackTriggered: Boolean(input.fallbackTriggered),
    fallbackReason: input.fallbackReason,
    sectionScores: input.sectionScores || {},
    resumeIdentifier: input.resumeIdentifier,
    timestamp: input.deterministic ? '1970-01-01T00:00:00.000Z' : new Date().toISOString(),
  };
}

export function buildOrchestratorMetrics(input: {
  mode: string;
  selectedParser: ParserId | 'production-deferred';
  totalExecutionTimeMs: number;
  primary: ParserRunMetrics;
  shadow?: ParserRunMetrics;
  config: {
    enabled: boolean;
    mode: string;
    confidenceThreshold: number;
    qualityThreshold: number;
  };
}): OrchestratorMetrics {
  return {
    orchestratorVersion: PARSER_ORCHESTRATOR_VERSION,
    mode: input.mode,
    selectedParser: input.selectedParser,
    totalExecutionTimeMs: Math.round(input.totalExecutionTimeMs),
    primary: input.primary,
    shadow: input.shadow,
    configSnapshot: input.config,
  };
}
