/**
 * Semantic heading taxonomy for hybrid section detection.
 * Phrase and token overlap — not exact-regex matching.
 */

import type { NormalizedSectionType } from './types';
import { classifySectionHeading } from '@/lib/resume-builder/semantic-registry';

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
      'an overview',
      'career overview',
      'professional overview',
    ],
    tokens: ['summary', 'profile', 'objective', 'about', 'overview', 'bio', 'introduction'],
    typicalOrder: 0.12,
  },
  experience: {
    phrases: [
      'professional experience',
      'work experience',
      'job experience',
      'practical experience',
      'employment history',
      'employment details',
      'career history',
      'work history',
      'professional background',
      'employment record',
      'internship experience',
      'relevant experience',
      'industry experience',
      'consulting experience',
      'freelance experience',
      'experience summary',
      'summary of experience',
      'project experience',
      'work exposure',
      'areas of exposure',
      'professional exposure',
      'additional exposure',
      'nature of duties',
      'job profile',
      'organizational experience',
      'organisational experience',
      'organization experience',
      'organisation experience',
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
      'practical',
      'exposure',
      'duties',
      'organizational',
      'organisational',
    ],
    typicalOrder: 0.35,
  },
  education: {
    phrases: [
      'academic background',
      'academic qualification',
      'academics qualification',
      'educational qualification',
      'educational',
      'academic history',
      'qualifications',
      'education history',
      'educational background',
      'academic credentials',
      'professional qualification',
      'professional qualifications',
      'academia',
      'scholastic record',
      'educational qualifications',
    ],
    tokens: [
      'education',
      'educational',
      'academic',
      'academics',
      'academia',
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
      'it skills',
      'strengths and it skills',
      'strengths it skills',
      'key strengths',
      'technical competencies',
      'core competencies',
      'core specialties',
      'core specialities',
      'core specialties and key areas',
      'core specialities and key areas',
      'key areas',
      'key area',
      'areas of specialization',
      'areas of specialisation',
      'professional skills',
      'industrial skills',
      'functional skills',
      'domain skills',
      'core industrial skills',
      'technical expertise',
      'areas of expertise',
      'tools and technologies',
      'software skills',
      'computer skills',
      'synopsis of work profile',
      'synopsis of work',
      'work profile and experience gained',
      'competencies gained',
      'experience gained',
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
      'synopsis',
      'strengths',
      'specialties',
      'specialities',
      'specialty',
      'speciality',
      'industrial',
      'functional',
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
      'key projects handled',
      'projects handled',
      'notable projects',
      'important projects',
      'project portfolio',
    ],
    tokens: ['projects', 'portfolio', 'case', 'studies'],
    typicalOrder: 0.48,
  },
  languages: {
    phrases: [
      'language proficiency',
      'spoken languages',
      'language skills',
      'linguistic skills',
      'foreign languages',
      'language known',
      'languages known',
      'languages known',
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
      'professional and technical qualification',
      'professional technical qualification',
      'technical qualification',
      'technical qualifications',
      'licenses certifications',
      'certificates and training',
      'online paid courses',
      'certification online',
      'training and workshops',
      'training & workshops',
      'training and workshop',
      'training & workshop',
      'workshops and training',
      'workshops & training',
      'trainings and workshops',
    ],
    tokens: [
      'certifications',
      'certification',
      'certificates',
      'certificate',
      'licenses',
      'licences',
      'license',
      'courses',
      'workshops',
      'workshop',
      'training',
      'trainings',
      'credentials',
    ],
    typicalOrder: 0.65,
  },
  achievements: {
    phrases: [
      'key achievements',
      'career achievements',
      'professional achievements',
      'major achievements',
      'awards and honors',
      'honors and awards',
      'notable achievements',
      'cost saving activities',
      'cost savings',
      'cost saving',
      'key accomplishments',
      'career accomplishments',
    ],
    tokens: [
      'achievements',
      'achievement',
      'awards',
      'award',
      'honors',
      'honours',
      'recognition',
      'accomplishments',
      'savings',
    ],
    typicalOrder: 0.58,
  },
  hobbies: {
    phrases: ['hobbies and interests', 'interests and hobbies', 'personal interests'],
    tokens: ['interests', 'interest', 'hobbies', 'hobby', 'extracurricular', 'passions'],
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

/** Strip trailing employment date ranges so "Job Experience from Oct 2010 to till date" scores as "job experience". */
export function stripHeadingDateSuffix(normalized: string): string {
  if (!normalized) return '';
  let s = normalized
    .replace(
      /\bfrom\s+(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+)?(?:(?:19|20)?\d{2}|oct|nov|dec|jan|feb|mar|apr|may|jun|jul|aug|sep).*$/i,
      ''
    )
    .replace(
      /\b(?:(?:19|20)\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*(?:'\d{2})?\s*(?:[-–—to]|till|present).*$/i,
      ''
    )
    .replace(/\b(?:to\s+)?(?:till\s*date|present|current|ongoing)\s*$/i, '')
    .replace(/\(\s*(?:online|paid|courses?|certificate?s?|licenses?)[^)]*\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length >= 3 ? s : normalized;
}

export function normalizeHeadingText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[:\-–—|•·]+$/g, '')
    .replace(/[^\p{L}\p{N}\s&/+']/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitCombinedHeadingParts(normalized: string): string[] {
  if (!normalized) return [];
  const parts = normalized.split(COMBINED_SPLIT_RE).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [normalized];
}

function scorePartAgainstTaxonomy(part: string, tax: SectionTaxonomyEntry): number {
  let partScore = 0;
  for (const phrase of tax.phrases) {
    const phraseWords = phrase.split(/\s+/).filter(Boolean).length;
    if (part === phrase) partScore = Math.max(partScore, 88);
    else if (
      phraseWords >= 2 &&
      (part.startsWith(phrase) || part.endsWith(phrase))
    ) {
      partScore = Math.max(partScore, 78);
    } else if (phraseWords >= 2 && part.includes(phrase)) {
      partScore = Math.max(partScore, 58);
    }
    // Single-word phrases must be exact matches only — "Ministry of labour employment"
    // must not score like the section phrase "employment".
  }
  for (const token of tax.tokens) {
    const re = new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i');
    if (re.test(part)) partScore = Math.max(partScore, part === token ? 70 : 48);
  }
  // Lead-in boost: heading begins with a known phrase/token (dated suffixes already stripped).
  for (const phrase of tax.phrases) {
    if (part.startsWith(phrase) && phrase.split(/\s+/).length >= 2) {
      partScore = Math.max(partScore, 82);
    }
  }
  return partScore;
}

export function scoreHeadingKeywords(
  rawHeading: string
): Partial<Record<NormalizedSectionType, number>> {
  const normalized = normalizeHeadingText(rawHeading);
  const stripped = stripHeadingDateSuffix(normalized);
  const parts = [
    ...new Set([...splitCombinedHeadingParts(normalized), ...splitCombinedHeadingParts(stripped), stripped, normalized]),
  ].filter(Boolean);
  const scores: Partial<Record<NormalizedSectionType, number>> = {};

  const semantic = classifySectionHeading(rawHeading);
  if (semantic && semantic.confidence >= 58 && semantic.definition.parserType) {
    const pt = semantic.definition.parserType;
    if (pt !== 'custom') {
      scores[pt] = Math.max(scores[pt] ?? 0, semantic.confidence);
    }
    if (semantic.definition.id === 'professional-qualifications') {
      scores.education = Math.min(scores.education ?? 0, 35);
      scores.certifications = Math.max(scores.certifications ?? 0, semantic.confidence);
    }
    if (semantic.definition.id === 'professional-highlights') {
      scores.summary = Math.min(scores.summary ?? 0, 40);
      scores.achievements = Math.max(scores.achievements ?? 0, semantic.confidence);
    }
    // Strengths alone may dampen skills, but "Strengths & IT Skills" compounds stay skills.
    if (semantic.definition.id === 'strengths' && !/\bskills?\b/i.test(normalized)) {
      scores.skills = Math.min(scores.skills ?? 0, 45);
    }
  }

  for (const [type, tax] of Object.entries(SECTION_TAXONOMY) as Array<
    [Exclude<NormalizedSectionType, 'custom'>, SectionTaxonomyEntry]
  >) {
    let best = 0;
    for (const part of parts) {
      best = Math.max(best, scorePartAgainstTaxonomy(part, tax));
    }
    if (best > 0) scores[type] = Math.min(100, Math.max(scores[type] ?? 0, best));
  }

  // "Cost Saving Activities" / savings headings are achievements, not hobbies.
  if (
    scores.hobbies &&
    /\b(?:cost\s+sav(?:ing|ings)|savings?\s+activit|accomplishments?)\b/i.test(normalized)
  ) {
    scores.achievements = Math.max(scores.achievements ?? 0, Math.max(scores.hobbies, 72));
    delete scores.hobbies;
  }

  // "Career Achievements" / "Key Achievements" must not tie-break into experience
  // just because the experience taxonomy includes the token "career".
  if (
    scores.achievements &&
    scores.experience &&
    /\bachievements?\b|\baccomplishments?\b|\bawards?\b|\bhonou?rs?\b/i.test(normalized)
  ) {
    scores.achievements = Math.max(scores.achievements, 82);
    // Prefer achievements whenever both fire on an accomplishments heading.
    if ((scores.achievements ?? 0) >= (scores.experience ?? 0) - 5) {
      delete scores.experience;
    } else if ((scores.experience ?? 0) < 70) {
      delete scores.experience;
    }
  }

  // Bare "Training & Development" thematic blocks are not certifications unless
  // the heading itself names certificates/courses/licenses.
  if (
    scores.certifications &&
    /\btraining\b/i.test(normalized) &&
    !/\b(?:certif|licence|license|course|workshop|credential)\b/i.test(normalized)
  ) {
    delete scores.certifications;
  }

  // Singular "project" is an in-role field label on many CVs ("Project: Fiber Rollout").
  // Only plural / multi-word project headings open a Projects section.
  if (scores.projects && /^(?:project)\s*$/i.test(normalized)) {
    scores.projects = Math.min(scores.projects, 20);
  }

  // In-role duty labels ("Activities Performed", "Tasks Assigned/Undertaken")
  // describe work responsibilities — never a hobbies/interests section.
  if (
    scores.hobbies &&
    /\b(?:performed|undertaken|carried\s+out|assigned|handled|discharged|rendered)\b/i.test(normalized)
  ) {
    scores.hobbies = Math.min(scores.hobbies, 20);
  }

  return scores;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
