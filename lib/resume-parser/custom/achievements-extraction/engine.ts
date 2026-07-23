/**
 * Achievements / awards extraction engine.
 */

import { collapseOcrBrokenDateLines } from '../experience-extraction/lines';
import { parseAchievementsFromSectionWithStats } from './parse';
import type { AchievementsExtractionResult, CustomExtractedAchievement } from './types';

export function extractAchievementsFromSection(
  sectionText: string
): CustomExtractedAchievement[] {
  return extractAchievementsWithMeta(sectionText).achievements;
}

export function extractAchievementsWithMeta(sectionText: string): AchievementsExtractionResult {
  const prepared = collapseOcrBrokenDateLines(sectionText || '');
  const { achievements: parsed, rejectedCount } = parseAchievementsFromSectionWithStats(prepared);

  return {
    achievements: parsed.map((p) => ({ text: p.text, confidence: p.confidence })),
    rejectedCount,
  };
}
