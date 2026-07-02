/**
 * Internal orchestrator metrics logging — not exposed to Builder or API responses.
 */

import type { OrchestratorMetrics } from './metrics';

export function logOrchestratorMetrics(
  metrics: OrchestratorMetrics,
  fallbackReason: string | undefined,
  requestId?: string
): void {
  const prefix = requestId ? `[PARSER-ORCHESTRATOR:${requestId}]` : '[PARSER-ORCHESTRATOR]';
  const payload = {
    mode: metrics.mode,
    selectedParser: metrics.selectedParser,
    totalExecutionTimeMs: metrics.totalExecutionTimeMs,
    fallbackReason,
    primary: {
      parser: metrics.primary.parserName,
      version: metrics.primary.parserVersion,
      executionTimeMs: metrics.primary.executionTimeMs,
      confidence: metrics.primary.confidence,
      resumeQuality: metrics.primary.resumeQuality,
      fallbackTriggered: metrics.primary.fallbackTriggered,
      fallbackReason: metrics.primary.fallbackReason,
      sectionScores: metrics.primary.sectionScores,
    },
    shadow: metrics.shadow
      ? {
          parser: metrics.shadow.parserName,
          confidence: metrics.shadow.confidence,
          resumeQuality: metrics.shadow.resumeQuality,
          sectionScores: metrics.shadow.sectionScores,
        }
      : undefined,
    config: metrics.configSnapshot,
  };
  console.warn(prefix, JSON.stringify(payload));
}
