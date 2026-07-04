/**
 * Achievements / awards extraction engine.
 */

import { parseAchievementsFromSectionWithStats } from './parse';
import type { AchievementsExtractionResult, CustomExtractedAchievement } from './types';

export function extractAchievementsFromSection(
  sectionText: string
): CustomExtractedAchievement[] {
  return extractAchievementsWithMeta(sectionText).achievements;
}

export function extractAchievementsWithMeta(sectionText: string): AchievementsExtractionResult {
  const { achievements: parsed, rejectedCount } = parseAchievementsFromSectionWithStats(
    sectionText || ''
  );

  return {
    achievements: parsed.map((p) => ({ text: p.text, confidence: p.confidence })),
    rejectedCount,
  };
}
