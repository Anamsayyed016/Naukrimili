/**
 * Types for hobbies / interests extraction (isolated module).
 */

export const HOBBIES_EXTRACTION_VERSION = '1.0.0';

export interface CustomExtractedHobby {
  name: string;
  confidence: number;
}

export interface HobbiesExtractionResult {
  hobbies: CustomExtractedHobby[];
  rejectedCount: number;
}

export function toCanonicalHobbies(items: CustomExtractedHobby[]): string[] {
  return items.map((h) => h.name).filter(Boolean);
}
