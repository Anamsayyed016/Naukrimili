/**
 * Education Extraction Engine — converts detected education section into structured entries.
 */

import { partitionEducationBlocks } from './boundaries';
import { buildEducationFromBlock } from './fields';
import type { CanonicalEducation, CustomExtractedEducation } from './types';
import { filterValidEducation } from './validate';
import { toCanonicalEducation } from './types';

export interface EducationExtractionResult {
  educations: CustomExtractedEducation[];
  canonical: CanonicalEducation[];
  rejectedCount: number;
  blockCount: number;
}

/** Drop personal-details / references / current-job prose tails glued onto education. */
function trimEducationSectionTail(sectionText: string): string {
  const text = String(sectionText || '');
  const cutters = [
    /\n\s*(?:personal\s*details|personal\s*information|personal\s*data|biodata|bio\s*data|references?|declaration|i\s+hereby\s+declare)\b/i,
    // Current-role prose that OCR/layout appends after academic rows.
    /\n\s*(?:at\s+present\s*,?\s*i\s+am\s+working|currently\s+(?:i\s+am\s+)?working|presently\s+working|i\s+am\s+(?:currently\s+)?working\s+with)\b/i,
    /\n\s*(?:software\s+skills?|technical\s+skills?|computer\s+skills?|strengths?|languages?\s+known)\b/i,
  ];
  let cut = -1;
  for (const re of cutters) {
    const idx = text.search(re);
    if (idx > 40 && (cut < 0 || idx < cut)) cut = idx;
  }
  if (cut > 40) return text.slice(0, cut).trim();
  return text.trim();
}

export function extractEducationFromSection(
  educationSectionText: string
): CustomExtractedEducation[] {
  return extractEducationWithMeta(educationSectionText).educations;
}

export function extractEducationWithMeta(
  educationSectionText: string
): EducationExtractionResult {
  const trimmed = trimEducationSectionTail(educationSectionText || '');
  const blocks = partitionEducationBlocks(trimmed);
  const built = blocks.map(buildEducationFromBlock);
  const educations = filterValidEducation(built);

  return {
    educations,
    canonical: educations.map(toCanonicalEducation),
    rejectedCount: built.length - educations.length,
    blockCount: blocks.length,
  };
}

export function extractCanonicalEducation(
  educationSectionText: string
): CanonicalEducation[] {
  return extractEducationWithMeta(educationSectionText).canonical;
}
