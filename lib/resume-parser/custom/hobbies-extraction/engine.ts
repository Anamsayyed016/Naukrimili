/**
 * Hobbies / interests extraction engine.
 */

import { parseHobbiesFromSectionWithStats } from './parse';
import type { CustomExtractedHobby, HobbiesExtractionResult } from './types';

export function extractHobbiesFromSection(sectionText: string): CustomExtractedHobby[] {
  return extractHobbiesWithMeta(sectionText).hobbies;
}

export function extractHobbiesWithMeta(sectionText: string): HobbiesExtractionResult {
  const { hobbies: parsed, rejectedCount } = parseHobbiesFromSectionWithStats(sectionText || '');

  return {
    hobbies: parsed.map((p) => ({ name: p.name, confidence: p.confidence })),
    rejectedCount,
  };
}
