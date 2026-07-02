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

export function extractEducationFromSection(
  educationSectionText: string
): CustomExtractedEducation[] {
  return extractEducationWithMeta(educationSectionText).educations;
}

export function extractEducationWithMeta(
  educationSectionText: string
): EducationExtractionResult {
  const blocks = partitionEducationBlocks(educationSectionText || '');
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
