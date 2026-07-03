/**
 * Semantic heading taxonomy for hybrid section detection.
 * Phrase and token overlap — not exact-regex matching.
 */

import type { NormalizedSectionType } from './types';

export interface SectionTaxonomyEntry {
  phrases: readonly string[];
  tokens: readonly string[];
  /** Typical document order weight (0–1) for context scoring. */
  typicalOrder: number;
}

export const SECTION_TAXONOMY: Record<Exclude<NormalizedSectionType, 'custom'>, SectionTaxonomyEntry> = {
  summary: {
    phrases: [
      'professional summary',
      'executive summary',
      'career summary',
      'career objective',
      'professional profile',
      'about me',
      'profile',
      'objective',
      'summary',
    ],
    tokens: ['summary', 'profile', 'objective', 'about', 'overview', 'bio', 'synopsis', 'introduction'],
    typicalOrder: 0.12,
  },
  experience: {
    phrases: [
      'professional experience',
      'work experience',
      'employment history',
      'career history',
      'work history',
      'professional background',
      'employment',
      'internship',
      'internships',
      'relevant experience',
      'industry experience',
      'consulting experience',
      'freelance experience',
    ],
    tokens: [
      'experience',
      'employment',
      'work',
      'career',
      'internship',
      'internships',
      'positions',
      'industry',
      'consulting',
      'freelance',
    ],
    typicalOrder: 0.35,
  },
  education: {
    phrases: [
      'academic background',
      'academic qualification',
      'educational qualification',
      'academic history',
      'qualifications',
      'education history',
      'educational background',
      'academic credentials',
    ],
    tokens: [
      'education',
      'academic',
      'qualification',
      'qualifications',
      'degrees',
      'schooling',
      'studies',
      'university',
      'college',
    ],
    typicalOrder: 0.55,
  },
  skills: {
    phrases: [
      'technical skills',
      'core skills',
      'key skills',
      'technical competencies',
      'core competencies',
      'professional skills',
      'technical expertise',
      'areas of expertise',
      'tools and technologies',
    ],
    tokens: [
      'skills',
      'skill',
      'technologies',
      'technology',
      'expertise',
      'competencies',
      'competency',
      'proficiencies',
      'capabilities',
      'toolkit',
      'stack',
    ],
    typicalOrder: 0.28,
  },
  projects: {
    phrases: [
      'major projects',
      'academic projects',
      'personal projects',
      'professional projects',
      'key projects',
      'notable projects',
    ],
    tokens: ['projects', 'project', 'portfolio', 'case', 'studies'],
    typicalOrder: 0.48,
  },
  languages: {
    phrases: [
      'language proficiency',
      'spoken languages',
      'language skills',
      'linguistic skills',
      'foreign languages',
    ],
    tokens: ['languages', 'language', 'linguistic', 'bilingual', 'multilingual'],
    typicalOrder: 0.72,
  },
  certifications: {
    phrases: [
      'licenses and certifications',
      'certifications and licenses',
      'professional certifications',
      'professional development',
      'licenses certifications',
      'certificates and training',
    ],
    tokens: [
      'certifications',
      'certification',
      'certificates',
      'certificate',
      'licenses',
      'licences',
      'license',
      'training',
      'courses',
      'workshops',
      'credentials',
    ],
    typicalOrder: 0.65,
  },
  achievements: {
    phrases: ['key achievements', 'awards and honors', 'honors and awards', 'notable achievements'],
    tokens: ['achievements', 'achievement', 'awards', 'award', 'honors', 'honours', 'recognition', 'accomplishments'],
    typicalOrder: 0.58,
  },
  hobbies: {
    phrases: ['hobbies and interests', 'interests and hobbies', 'personal interests'],
    tokens: ['interests', 'interest', 'hobbies', 'hobby', 'activities', 'extracurricular', 'passions'],
    typicalOrder: 0.82,
  },
  references: {
    phrases: ['professional references'],
    tokens: ['references', 'reference'],
    typicalOrder: 0.9,
  },
  volunteer: {
    phrases: ['volunteer experience', 'community service'],
    tokens: ['volunteer', 'volunteering', 'community'],
    typicalOrder: 0.62,
  },
  publications: {
    phrases: ['research publications'],
    tokens: ['publications', 'publication', 'papers', 'patents'],
    typicalOrder: 0.68,
  },
};

const COMBINED_SPLIT_RE = /\s*(?:&|\/|,|\+|\band\b|\bor\b)\s*/i;

export function normalizeHeadingText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[:\-–—|•·]+$/g, '')
    .replace(/[^\p{L}\p{N}\s&/+]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitCombinedHeadingParts(normalized: string): string[] {
  if (!normalized) return [];
  const parts = normalized.split(COMBINED_SPLIT_RE).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [normalized];
}

export function scoreHeadingKeywords(
  rawHeading: string
): Partial<Record<NormalizedSectionType, number>> {
  const normalized = normalizeHeadingText(rawHeading);
  const parts = splitCombinedHeadingParts(normalized);
  const scores: Partial<Record<NormalizedSectionType, number>> = {};

  for (const [type, tax] of Object.entries(SECTION_TAXONOMY) as Array<
    [Exclude<NormalizedSectionType, 'custom'>, SectionTaxonomyEntry]
  >) {
    let best = 0;
    for (const part of parts) {
      let partScore = 0;
      for (const phrase of tax.phrases) {
        if (part === phrase) partScore = Math.max(partScore, 88);
        else if (part.startsWith(phrase) || part.endsWith(phrase)) partScore = Math.max(partScore, 72);
        else if (part.includes(phrase)) partScore = Math.max(partScore, 58);
      }
      for (const token of tax.tokens) {
        const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i');
        if (re.test(part)) partScore = Math.max(partScore, part === token ? 70 : 42);
      }
      best = Math.max(best, partScore);
    }
    if (best > 0) scores[type] = Math.min(100, best);
  }

  return scores;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
