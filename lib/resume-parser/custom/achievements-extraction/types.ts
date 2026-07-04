/**
 * Types for global achievements / awards extraction (isolated module).
 */

export const ACHIEVEMENTS_EXTRACTION_VERSION = '1.0.0';

export interface CustomExtractedAchievement {
  text: string;
  confidence: number;
}

export interface AchievementsExtractionResult {
  achievements: CustomExtractedAchievement[];
  rejectedCount: number;
}

export function toCanonicalAchievements(items: CustomExtractedAchievement[]): string[] {
  return items.map((a) => a.text).filter(Boolean);
}
