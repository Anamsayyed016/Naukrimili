/**
 * Experience Extraction Engine — converts detected experience section text into structured entries.
 */

import { partitionExperienceBlocks } from './boundaries';
import { buildExperienceFromBlock } from './fields';
import { buildExperienceLines } from './lines';
import type { CanonicalExperience, CustomExtractedExperience } from './types';
import { filterValidExperiences } from './validate';
import { toCanonicalExperience } from './types';

/** When one employer has multiple roles, inherit company from the previous entry. */
function inheritCompanyAcrossExperiences(
  experiences: CustomExtractedExperience[]
): CustomExtractedExperience[] {
  let lastCompany = '';
  return experiences.map((exp) => {
    const company = exp.company?.trim() || '';
    if (company) {
      lastCompany = company;
      return exp;
    }
    if (exp.designation?.trim() && lastCompany) {
      return { ...exp, company: lastCompany };
    }
    return exp;
  });
}

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
  experienceSectionText: string,
  boundaryOptions?: import('./boundaries').ExperienceBoundaryOptions
): CustomExtractedExperience[] {
  const result = extractExperiencesWithMeta(experienceSectionText, boundaryOptions);
  return result.experiences;
}

export function extractExperiencesWithMeta(
  experienceSectionText: string,
  boundaryOptions?: import('./boundaries').ExperienceBoundaryOptions
): ExperienceExtractionResult {
  const lines = buildExperienceLines(experienceSectionText || '');
  const blocks = partitionExperienceBlocks(lines, boundaryOptions);
  const built = blocks.map(buildExperienceFromBlock);
  const experiences = inheritCompanyAcrossExperiences(filterValidExperiences(built));

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
