/**
 * Types for Language Extraction module (custom parser).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const LANGUAGE_EXTRACTION_VERSION = '1.0.0';

export interface CustomExtractedLanguage {
  name: string;
  proficiency: string;
  confidence: number;
}

export type CanonicalLanguage = NonNullable<ExtractedResumeData['languages']>[number];

export interface LanguageExtractionResult {
  languages: CustomExtractedLanguage[];
  canonical: CanonicalLanguage[];
  rejectedCount: number;
}

export function toCanonicalLanguage(lang: CustomExtractedLanguage): CanonicalLanguage {
  if (!lang.proficiency?.trim()) return lang.name;
  return { name: lang.name, proficiency: lang.proficiency };
}
