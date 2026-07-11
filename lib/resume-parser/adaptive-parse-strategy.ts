/**
 * Self-adaptive parsing strategy — derived from dynamic document analysis only.
 */

import type { DynamicDocumentAnalysis } from '@/lib/resume-parser/dynamic-document-analysis';

export type ReadingOrderMode = 'standard' | 'column-reconstruct' | 'sidebar-first';
export type GapRepairMode = 'default' | 'preamble-first' | 'infer-section';
export type ExperienceBoundaryMode = 'standard' | 'aggressive' | 'conservative';

export interface AdaptiveParseStrategy {
  readingOrderMode: ReadingOrderMode;
  gapRepairMode: GapRepairMode;
  experienceBoundaryMode: ExperienceBoundaryMode;
  preferSidebarExtraction: boolean;
  boostOcrRecovery: boolean;
  splitMergedHeadings: boolean;
  /** Experience boundary score threshold (higher = fewer splits). */
  experienceBoundaryThreshold: number;
  experienceBoundaryThresholdAfterBlank: number;
}

/**
 * Choose parsing strategy automatically from document analysis — no hardcoded layouts.
 */
export function deriveAdaptiveParseStrategy(
  analysis: DynamicDocumentAnalysis
): AdaptiveParseStrategy {
  const { profile, columnCount, hasSidebar, hasTables, hasMergedHeaders, ocrQualityScore } =
    analysis;
  const signals = profile.signals;

  let readingOrderMode: ReadingOrderMode = 'standard';
  if (hasSidebar || profile.types.includes('TYPE_D_SIDEBAR')) {
    readingOrderMode = 'sidebar-first';
  } else if (signals.multiColumnLikely || columnCount >= 2) {
    readingOrderMode = 'column-reconstruct';
  }

  let gapRepairMode: GapRepairMode = 'default';
  if (readingOrderMode === 'sidebar-first') {
    gapRepairMode = 'preamble-first';
  } else if (signals.multiColumnLikely || hasTables) {
    gapRepairMode = 'infer-section';
  }

  let experienceBoundaryMode: ExperienceBoundaryMode = 'standard';
  let experienceBoundaryThreshold = 48;
  let experienceBoundaryThresholdAfterBlank = 38;

  if (signals.executiveLayout || analysis.pageCountEstimate >= 3) {
    experienceBoundaryMode = 'conservative';
    experienceBoundaryThreshold = 52;
    experienceBoundaryThresholdAfterBlank = 42;
  } else if (hasTables || columnCount >= 2) {
    experienceBoundaryMode = 'aggressive';
    experienceBoundaryThreshold = 42;
    experienceBoundaryThresholdAfterBlank = 34;
  }

  return {
    readingOrderMode,
    gapRepairMode,
    experienceBoundaryMode,
    preferSidebarExtraction: hasSidebar || signals.sidebarLikely,
    boostOcrRecovery: ocrQualityScore < 55 || signals.scannedLikely || signals.imageHeavyLikely,
    splitMergedHeadings: hasMergedHeaders,
    experienceBoundaryThreshold,
    experienceBoundaryThresholdAfterBlank,
  };
}
