export { LANGUAGE_EXTRACTION_VERSION } from './types';
export type { CanonicalLanguage, CustomExtractedLanguage, LanguageExtractionResult } from './types';
export { toCanonicalLanguage } from './types';
export {
  extractCanonicalLanguages,
  extractLanguagesFromSection,
  extractLanguagesWithMeta,
} from './engine';
export { parseLanguageLine, parseLanguagesFromSection } from './parse';
