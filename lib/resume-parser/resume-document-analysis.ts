/**
 * Resume document classification + preprocessing (NOT a parser).
 * Runs once before Affinda / Eden / text-recovery to normalize layout-specific text.
 */

import {
  cleanResumeTextPreservingLines,
  prepareResumeTextForParsing as prepareTextCore,
  classifyResumeTextSignals,
  type ResumeTextSignals,
} from '@/lib/resume-parser/text-recovery';

export type ResumeDocumentType =
  | 'TYPE_A_ATS'
  | 'TYPE_B_EXECUTIVE'
  | 'TYPE_C_MULTI_COLUMN'
  | 'TYPE_D_SIDEBAR'
  | 'TYPE_E_COVER_LETTER_RESUME'
  | 'TYPE_F_IMAGE_HEAVY'
  | 'TYPE_G_SCANNED'
  | 'TYPE_H_HYBRID';

export interface ResumeDocumentProfile {
  primaryType: ResumeDocumentType;
  types: ResumeDocumentType[];
  signals: ResumeTextSignals;
}

export function classifyResumeDocumentFromSignals(signals: ResumeTextSignals): ResumeDocumentProfile {
  const types: ResumeDocumentType[] = [];

  if (signals.coverLetterDetected) types.push('TYPE_E_COVER_LETTER_RESUME');
  if (signals.executiveLayout) types.push('TYPE_B_EXECUTIVE');
  if (signals.multiColumnLikely) types.push('TYPE_C_MULTI_COLUMN');
  if (signals.sidebarLikely) types.push('TYPE_D_SIDEBAR');
  if (signals.imageHeavyLikely) types.push('TYPE_F_IMAGE_HEAVY');
  if (signals.scannedLikely) types.push('TYPE_G_SCANNED');

  if (types.length === 0) {
    types.push('TYPE_A_ATS');
  } else if (types.length > 1) {
    types.push('TYPE_H_HYBRID');
  }

  const primaryType =
    types.find((t) => t === 'TYPE_E_COVER_LETTER_RESUME') ||
    types.find((t) => t === 'TYPE_G_SCANNED') ||
    types.find((t) => t === 'TYPE_D_SIDEBAR') ||
    types.find((t) => t === 'TYPE_C_MULTI_COLUMN') ||
    types.find((t) => t === 'TYPE_B_EXECUTIVE') ||
    types.find((t) => t === 'TYPE_F_IMAGE_HEAVY') ||
    types[0];

  return { primaryType, types: [...new Set(types)], signals };
}

export function classifyResumeDocument(rawText: string): ResumeDocumentProfile {
  return classifyResumeDocumentFromSignals(classifyResumeTextSignals(rawText));
}

/**
 * Single preprocessing entry used by upload route and text-recovery.
 */
export function prepareResumeTextForParsing(rawText: string): {
  text: string;
  profile: ResumeDocumentProfile;
} {
  const cleaned = cleanResumeTextPreservingLines(rawText || '');
  const signals = classifyResumeTextSignals(cleaned);
  const { text } = prepareTextCore(rawText || '');
  const profile = classifyResumeDocumentFromSignals(signals);
  return { text, profile };
}
