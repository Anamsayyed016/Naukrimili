/**
 * Language Extraction Engine — converts detected languages section into structured entries.
 */

import { parseLanguagesFromSectionWithStats } from './parse';
import type { CanonicalLanguage, CustomExtractedLanguage, LanguageExtractionResult } from './types';
import { toCanonicalLanguage } from './types';

export function extractLanguagesFromSection(
  languagesSectionText: string
): CustomExtractedLanguage[] {
  return extractLanguagesWithMeta(languagesSectionText).languages;
}

export function extractLanguagesWithMeta(
  languagesSectionText: string
): LanguageExtractionResult {
  const { languages: parsed, rejectedCount } = parseLanguagesFromSectionWithStats(
    languagesSectionText || ''
  );
  const languages: CustomExtractedLanguage[] = parsed.map((p) => ({
    name: p.name,
    proficiency: p.proficiency,
    confidence: p.confidence,
  }));

  return {
    languages,
    canonical: languages.map(toCanonicalLanguage),
    rejectedCount,
  };
}

export function extractCanonicalLanguages(languagesSectionText: string): CanonicalLanguage[] {
  return extractLanguagesWithMeta(languagesSectionText).canonical;
}
