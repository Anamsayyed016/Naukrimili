/**
 * Experience Extraction Engine — converts detected experience section text into structured entries.
 */

import { partitionExperienceBlocks } from './boundaries';
import { buildExperienceFromBlock } from './fields';
import { buildExperienceLines } from './lines';
import type { CanonicalExperience, CustomExtractedExperience } from './types';
import { filterValidExperiences } from './validate';
import { toCanonicalExperience } from './types';

export interface ExperienceExtractionResult {
  experiences: CustomExtractedExperience[];
  canonical: CanonicalExperience[];
  rejectedCount: number;
  blockCount: number;
}

/**
 * Extract structured experiences from a detected experience section (raw text).
 */
export function extractExperiencesFromSection(
  experienceSectionText: string
): CustomExtractedExperience[] {
  const result = extractExperiencesWithMeta(experienceSectionText);
  return result.experiences;
}

export function extractExperiencesWithMeta(
  experienceSectionText: string
): ExperienceExtractionResult {
  const lines = buildExperienceLines(experienceSectionText || '');
  const blocks = partitionExperienceBlocks(lines);
  const built = blocks.map(buildExperienceFromBlock);
  const experiences = filterValidExperiences(built);

  return {
    experiences,
    canonical: experiences.map(toCanonicalExperience),
    rejectedCount: built.length - experiences.length,
    blockCount: blocks.length,
  };
}

export function extractCanonicalExperiences(
  experienceSectionText: string
): CanonicalExperience[] {
  return extractExperiencesWithMeta(experienceSectionText).canonical;
}
