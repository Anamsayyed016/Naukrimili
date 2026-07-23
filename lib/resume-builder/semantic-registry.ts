/**
 * Unified semantic section registry — single source of truth for:
 * Parser section detection, text recovery, canonical mapping, Builder routing,
 * dynamic sections, template rendering, and OpenAI classification hints.
 *
 * No resume-specific rules — all entries are generic heading semantics.
 */

import type { CanonicalNodeType } from '@/lib/resume-builder/canonical-mapping/types';
import type { ExtendedBuilderSections } from '@/lib/resume-builder/canonical-mapping/types';
import type { NormalizedSectionType } from '@/lib/resume-parser/custom/section-detection/types';

export const SEMANTIC_REGISTRY_VERSION = '1.0.0';

export type StandardBuilderField =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'hobbies';

export type BuilderTarget =
  | { kind: 'standard'; field: StandardBuilderField }
  | { kind: 'extended'; field: keyof ExtendedBuilderSections }
  | { kind: 'experience_body' }
  | { kind: 'extra' };

export interface SemanticSectionDefinition {
  id: string;
  label: string;
  phrases: readonly string[];
  tokens?: readonly string[];
  nodeTypes: CanonicalNodeType[];
  builderTarget: BuilderTarget;
  /** Custom parser taxonomy alignment */
  parserType?: NormalizedSectionType;
  typicalOrder?: number;
  /** Default classification confidence when phrase matches */
  baseConfidence: number;
}

function def(
  partial: Omit<SemanticSectionDefinition, 'baseConfidence'> & { baseConfidence?: number }
): SemanticSectionDefinition {
  return { baseConfidence: 78, ...partial };
}

/** All semantic section definitions — ordered by typical document position. */
export const SEMANTIC_SECTION_DEFINITIONS: SemanticSectionDefinition[] = [
  def({
    id: 'summary',
    label: 'Professional Summary',
    phrases: [
      'summary',
      'professional summary',
      'executive summary',
      'career summary',
      'career synopsis',
      'executive synopsis',
      'objective',
      'career objective',
      'professional objective',
      'about',
      'about me',
      'introduction',
      'overview',
      'bio',
      'biography',
      'career profile',
      'executive profile',
      'personal profile',
    ],
    tokens: ['summary', 'profile', 'objective', 'about', 'overview', 'bio', 'synopsis'],
    nodeTypes: ['SUMMARY', 'OBJECTIVE', 'PROFILE'],
    builderTarget: { kind: 'standard', field: 'summary' },
    parserType: 'summary',
    typicalOrder: 0.1,
    baseConfidence: 85,
  }),
  def({
    id: 'professional-highlights',
    label: 'Professional Highlights',
    phrases: [
      'professional highlights',
      'career highlights',
      'key highlights',
      'highlights',
      'notable highlights',
      'career accomplishments summary',
    ],
    tokens: ['highlights', 'highlight'],
    nodeTypes: ['ACHIEVEMENT', 'SEMANTIC_SECTION'],
    builderTarget: { kind: 'extended', field: 'professionalHighlights' },
    parserType: 'achievements',
    typicalOrder: 0.14,
    baseConfidence: 82,
  }),
  def({
    id: 'experience',
    label: 'Work Experience',
    phrases: [
      'experience',
      'work experience',
      'professional experience',
      'experience summary',
      'summary of experience',
      'work history',
      'employment',
      'employment history',
      'career history',
      'professional history',
      'professional background',
      'professional journey',
      'positions held',
      'employment record',
      'relevant experience',
      'industry experience',
      'additional experience',
      'consulting experience',
      'leadership experience',
      'management experience',
      'corporate experience',
      'project experience',
      'internship',
      'internships',
      'internship experience',
      'organizational experience',
      'organisational experience',
    ],
    tokens: ['experience', 'employment', 'work', 'career', 'internship', 'positions'],
    nodeTypes: ['EXPERIENCE', 'JOB_TITLE', 'COMPANY', 'RESPONSIBILITY'],
    builderTarget: { kind: 'standard', field: 'experience' },
    parserType: 'experience',
    typicalOrder: 0.35,
    baseConfidence: 88,
  }),
  def({
    id: 'key-responsibilities',
    label: 'Key Responsibilities',
    phrases: [
      'key responsibilities',
      'responsibilities',
      'roles and responsibilities',
      'roles & responsibilities',
      'project roles and responsibilities',
      'project roles & responsibilities',
      'duties',
      'key duties',
      'core responsibilities',
    ],
    tokens: ['responsibilities', 'responsibility', 'duties', 'roles'],
    nodeTypes: ['RESPONSIBILITY', 'SEMANTIC_SECTION'],
    builderTarget: { kind: 'experience_body' },
    parserType: 'experience',
    typicalOrder: 0.36,
    baseConfidence: 80,
  }),
  def({
    id: 'skills',
    label: 'Skills',
    phrases: ['skills', 'key skills', 'professional skills', 'industrial skills', 'functional skills', 'domain skills', 'software skills', 'computer skills', 'areas of expertise', 'expertise'],
    tokens: ['skills', 'skill', 'expertise', 'industrial', 'functional'],
    nodeTypes: ['TECHNICAL_SKILL'],
    builderTarget: { kind: 'standard', field: 'skills' },
    parserType: 'skills',
    typicalOrder: 0.28,
  }),
  def({
    id: 'technical-skills',
    label: 'Technical Skills',
    phrases: [
      'technical skills',
      'technical competencies',
      'technical expertise',
      'technologies',
      'tech stack',
      // Keep multi-word only — bare "Tools"/"Frameworks" are subcategory labels
      // inside an open skills section, not root section headings.
      'tools and technologies',
      'computer skills',
      'it skills',
    ],
    tokens: ['technical', 'technologies', 'technology', 'computer'],
    nodeTypes: ['TECHNICAL_SKILL', 'TOOLS', 'FRAMEWORK', 'DATABASE'],
    builderTarget: { kind: 'extended', field: 'technicalSkills' },
    parserType: 'skills',
    typicalOrder: 0.29,
  }),
  def({
    id: 'core-competencies',
    label: 'Core Competencies',
    phrases: ['core competencies', 'core competency', 'key competencies', 'competencies'],
    tokens: ['competencies', 'competency'],
    nodeTypes: ['CORE_SKILL'],
    builderTarget: { kind: 'extended', field: 'coreCompetencies' },
    parserType: 'skills',
    typicalOrder: 0.27,
  }),
  def({
    id: 'soft-skills',
    label: 'Soft Skills',
    phrases: ['soft skills', 'interpersonal skills', 'transferable skills'],
    tokens: ['soft'],
    nodeTypes: ['SOFT_SKILL'],
    builderTarget: { kind: 'extended', field: 'softSkills' },
    parserType: 'skills',
    typicalOrder: 0.26,
  }),
  def({
    id: 'strengths',
    label: 'Strengths',
    phrases: ['strengths', 'key strengths', 'personal strengths', 'professional strengths'],
    tokens: ['strengths', 'strength'],
    nodeTypes: ['SEMANTIC_SECTION'],
    builderTarget: { kind: 'extended', field: 'strengths' },
    parserType: 'skills',
    typicalOrder: 0.26,
    baseConfidence: 80,
  }),
  def({
    id: 'industry-expertise',
    label: 'Industry Expertise',
    phrases: ['industry expertise', 'industry knowledge', 'domain expertise', 'sector expertise'],
    tokens: ['industry', 'domain'],
    nodeTypes: ['SEMANTIC_SECTION'],
    builderTarget: { kind: 'extended', field: 'industryExpertise' },
    parserType: 'skills',
    typicalOrder: 0.27,
  }),
  def({
    id: 'projects',
    label: 'Projects',
    phrases: [
      'projects',
      'personal projects',
      'key projects',
      'key projects handled',
      'projects handled',
      'major projects',
      'professional projects',
      'academic projects',
      'notable projects',
      'portfolio projects',
      'portfolio',
      'case studies',
      'selected work',
    ],
    tokens: ['projects', 'portfolio'],
    nodeTypes: ['PROJECT'],
    builderTarget: { kind: 'standard', field: 'projects' },
    parserType: 'projects',
    typicalOrder: 0.48,
  }),
  def({
    id: 'education',
    label: 'Education',
    phrases: [
      'education',
      'academic background',
      'academic history',
      'academic qualifications',
      'educational qualifications',
      'educational background',
      'degrees',
      'schooling',
      'studies',
      'academics',
      'academic record',
    ],
    tokens: ['education', 'academic', 'degrees', 'schooling', 'university', 'college'],
    nodeTypes: ['EDUCATION'],
    builderTarget: { kind: 'standard', field: 'education' },
    parserType: 'education',
    typicalOrder: 0.55,
  }),
  def({
    id: 'professional-qualifications',
    label: 'Professional Qualifications',
    phrases: [
      'professional qualification',
      'professional qualifications',
      'prof qualification',
      'prof qualifications',
    ],
    tokens: ['professional', 'qualification'],
    nodeTypes: ['CERTIFICATION', 'TRAINING', 'SEMANTIC_SECTION'],
    builderTarget: { kind: 'extended', field: 'professionalQualifications' },
    parserType: 'certifications',
    typicalOrder: 0.6,
    baseConfidence: 84,
  }),
  def({
    id: 'certifications',
    label: 'Certifications',
    phrases: [
      'certifications',
      'certificates',
      'licenses',
      'licences',
      'licenses and certifications',
      'professional certifications',
      'professional development',
      'accreditation',
      'accreditations',
      'credentials',
    ],
    tokens: ['certifications', 'certification', 'certificates', 'licenses', 'credentials'],
    nodeTypes: ['CERTIFICATION', 'LICENSE'],
    builderTarget: { kind: 'standard', field: 'certifications' },
    parserType: 'certifications',
    typicalOrder: 0.65,
  }),
  def({
    id: 'training',
    label: 'Training & Workshops',
    phrases: [
      'training',
      'trainings',
      'courses',
      'online courses',
      'workshops',
      'continuing education',
      'professional training',
      'training and workshops',
      'training & workshops',
      'training and workshop',
      'training & workshop',
      'workshops and training',
      'workshops & training',
    ],
    tokens: ['training', 'courses', 'workshops', 'workshop'],
    nodeTypes: ['TRAINING'],
    builderTarget: { kind: 'extended', field: 'training' },
    parserType: 'certifications',
    typicalOrder: 0.66,
  }),
  def({
    id: 'seminars',
    label: 'Seminars & Conferences',
    phrases: ['seminars', 'seminar', 'conferences', 'conference', 'symposium', 'symposia'],
    tokens: ['seminar', 'conference'],
    nodeTypes: ['TRAINING', 'SEMANTIC_SECTION'],
    builderTarget: { kind: 'extended', field: 'seminars' },
    parserType: 'certifications',
    typicalOrder: 0.67,
  }),
  def({
    id: 'achievements',
    label: 'Achievements',
    phrases: [
      'achievements',
      'key achievements',
      'notable achievements',
      'professional achievements',
      'accomplishments',
      'key accomplishments',
      'notable accomplishments',
    ],
    tokens: ['achievements', 'achievement', 'accomplishments'],
    nodeTypes: ['ACHIEVEMENT'],
    builderTarget: { kind: 'standard', field: 'achievements' },
    parserType: 'achievements',
    typicalOrder: 0.58,
  }),
  def({
    id: 'awards',
    label: 'Awards & Honors',
    phrases: [
      'awards',
      'awards and honors',
      'awards & honors',
      'honors',
      'honours',
      'honors and awards',
      'recognition',
      'recognitions',
    ],
    tokens: ['awards', 'award', 'honors', 'recognition'],
    nodeTypes: ['AWARD'],
    builderTarget: { kind: 'extended', field: 'awards' },
    parserType: 'achievements',
    typicalOrder: 0.59,
  }),
  def({
    id: 'languages',
    label: 'Languages',
    phrases: ['languages', 'language skills', 'spoken languages', 'language proficiency'],
    tokens: ['languages', 'language'],
    nodeTypes: ['LANGUAGE'],
    builderTarget: { kind: 'standard', field: 'languages' },
    parserType: 'languages',
    typicalOrder: 0.72,
  }),
  def({
    id: 'volunteer',
    label: 'Volunteer Experience',
    phrases: ['volunteer', 'volunteering', 'volunteer experience', 'community service'],
    tokens: ['volunteer', 'volunteering', 'community'],
    nodeTypes: ['VOLUNTEER'],
    builderTarget: { kind: 'extended', field: 'volunteer' },
    parserType: 'volunteer',
    typicalOrder: 0.62,
  }),
  def({
    id: 'memberships',
    label: 'Memberships',
    phrases: [
      'memberships',
      'membership',
      'professional memberships',
      'professional membership',
      'professional bodies',
      'affiliations',
      'professional affiliations',
    ],
    tokens: ['membership', 'memberships', 'affiliations'],
    nodeTypes: ['MEMBERSHIP'],
    builderTarget: { kind: 'extended', field: 'memberships' },
    typicalOrder: 0.7,
  }),
  def({
    id: 'research',
    label: 'Research',
    phrases: ['research', 'research work', 'research experience', 'research projects'],
    tokens: ['research'],
    nodeTypes: ['RESEARCH'],
    builderTarget: { kind: 'extended', field: 'research' },
    typicalOrder: 0.68,
  }),
  def({
    id: 'publications',
    label: 'Publications',
    phrases: ['publications', 'publication', 'published works', 'papers', 'research publications'],
    tokens: ['publications', 'publication', 'papers'],
    nodeTypes: ['PUBLICATION'],
    builderTarget: { kind: 'extended', field: 'publications' },
    parserType: 'publications',
    typicalOrder: 0.68,
  }),
  def({
    id: 'patents',
    label: 'Patents',
    phrases: ['patents', 'patent', 'intellectual property'],
    tokens: ['patents', 'patent'],
    nodeTypes: ['PATENT'],
    builderTarget: { kind: 'extended', field: 'patents' },
    typicalOrder: 0.69,
  }),
  def({
    id: 'hobbies',
    label: 'Interests & Hobbies',
    phrases: [
      'hobbies',
      'interests',
      'hobbies and interests',
      'interests and hobbies',
      'personal interests',
      'activities',
      'extracurricular',
    ],
    tokens: ['hobbies', 'hobby', 'interests', 'interest', 'activities'],
    nodeTypes: ['HOBBY', 'INTEREST'],
    builderTarget: { kind: 'standard', field: 'hobbies' },
    parserType: 'hobbies',
    typicalOrder: 0.82,
  }),
  def({
    id: 'references',
    label: 'References',
    phrases: ['references', 'professional references', 'referees'],
    tokens: ['references', 'reference'],
    nodeTypes: ['REFERENCE'],
    builderTarget: { kind: 'extended', field: 'references' },
    parserType: 'references',
    typicalOrder: 0.9,
  }),
  def({
    id: 'personal-details',
    label: 'Personal Details',
    phrases: ['personal details', 'personal information', 'personal data', 'biodata', 'bio data'],
    tokens: ['personal', 'biodata'],
    nodeTypes: ['PERSONAL_DETAILS', 'SEMANTIC_SECTION'],
    builderTarget: { kind: 'extended', field: 'personalDetails' },
    typicalOrder: 0.05,
  }),
  def({
    id: 'declaration',
    label: 'Declaration',
    phrases: ['declaration', 'certification statement', 'self declaration'],
    tokens: ['declaration'],
    nodeTypes: ['DECLARATION'],
    builderTarget: { kind: 'extended', field: 'declaration' },
    typicalOrder: 0.95,
  }),
  def({
    id: 'internships',
    label: 'Internships',
    phrases: ['internships', 'internship details'],
    tokens: ['internship'],
    nodeTypes: ['INTERNSHIP'],
    builderTarget: { kind: 'extended', field: 'internships' },
    parserType: 'experience',
    typicalOrder: 0.34,
  }),
];

const PHRASE_INDEX = new Map<string, SemanticSectionDefinition>();
for (const section of SEMANTIC_SECTION_DEFINITIONS) {
  for (const phrase of section.phrases) {
    const key = normalizeSemanticHeading(phrase);
    if (!PHRASE_INDEX.has(key) || section.baseConfidence >= (PHRASE_INDEX.get(key)?.baseConfidence ?? 0)) {
      PHRASE_INDEX.set(key, section);
    }
  }
}

export function normalizeSemanticHeading(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[:\-–—|•·]+$/g, '')
    .replace(/[^\p{L}\p{N}\s&/+]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SemanticClassification {
  definition: SemanticSectionDefinition;
  confidence: number;
  normalizedHeading: string;
  matchedPhrase: string;
}

/** Score heading against registry — phrase match first, then token overlap. */
export function classifySectionHeading(rawHeading: string): SemanticClassification | null {
  const normalized = normalizeSemanticHeading(rawHeading);
  if (!normalized || normalized.length < 2) return null;

  const exact = PHRASE_INDEX.get(normalized);
  if (exact) {
    return {
      definition: exact,
      confidence: exact.baseConfidence,
      normalizedHeading: normalized,
      matchedPhrase: normalized,
    };
  }

  let best: SemanticClassification | null = null;
  for (const section of SEMANTIC_SECTION_DEFINITIONS) {
    for (const phrase of section.phrases) {
      const p = normalizeSemanticHeading(phrase);
      const phraseWords = p.split(/\s+/).filter(Boolean).length;
      // Single-word phrases ("employment", "experience") must be exact heading
      // matches — never substring hits inside employer lines
      // ("Ministry of labour employment").
      const exactOrContainsPhrase =
        normalized === p ||
        (phraseWords >= 2 && (normalized.includes(p) || normalized.endsWith(` ${p}`)));
      // Avoid "tools" matching phrase "tools and technologies" (skills sub-labels).
      const phraseContainsHeading =
        phraseWords >= 2 &&
        p.includes(normalized) &&
        !(normalized.split(/\s+/).length === 1 && normalized.length < p.length);
      if (exactOrContainsPhrase || phraseContainsHeading) {
        const score = section.baseConfidence - (normalized.length > p.length + 8 ? 8 : 0);
        if (!best || score > best.confidence) {
          best = {
            definition: section,
            confidence: score,
            normalizedHeading: normalized,
            matchedPhrase: phrase,
          };
        }
      }
    }
    if (section.tokens) {
      const words = normalized.split(/\s+/);
      const tokenHits = words.filter((w) =>
        section.tokens!.some((t) => {
          if (w === t) return true;
          // Simple English plurals only — never prefix-match ("works" ↛ "work",
          // "workshop" ↛ "work") which mis-routes wrap debris into sections.
          if (t.length >= 4 && (w === `${t}s` || w === `${t}es`)) return true;
          if (w.length >= 4 && (t === `${w}s` || t === `${w}es`)) return true;
          return false;
        })
      );
      // Multi-token definitions (e.g. professional + qualification) must not fire on a
      // single shared word like "Professional" inside a job title.
      const minHits = section.tokens.length >= 2 ? 2 : 1;
      if (tokenHits.length >= minHits) {
        const score = section.baseConfidence - 12 + tokenHits.length * 4;
        if (!best || score > best.confidence) {
          best = {
            definition: section,
            confidence: Math.min(92, score),
            normalizedHeading: normalized,
            matchedPhrase: tokenHits.join(' '),
          };
        }
      }
    }
  }

  return best && best.confidence >= 55 ? best : null;
}

export function getDefinitionById(id: string): SemanticSectionDefinition | undefined {
  return SEMANTIC_SECTION_DEFINITIONS.find((d) => d.id === id);
}

/** Build text-recovery SECTION_ALIASES from registry (standard parser fields only). */
export function buildTextRecoverySectionAliases(): Record<string, string[]> {
  const aliases: Record<string, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    memberships: [],
    publications: [],
    patents: [],
    volunteer: [],
    references: [],
    hobbies: [],
  };

  for (const section of SEMANTIC_SECTION_DEFINITIONS) {
    const target = section.builderTarget;
    let bucket: string | null = null;
    if (target.kind === 'standard') {
      bucket = target.field;
    } else if (target.kind === 'extended') {
      if (target.field === 'memberships') bucket = 'memberships';
      else if (target.field === 'publications') bucket = 'publications';
      else if (target.field === 'patents') bucket = 'patents';
      else if (target.field === 'volunteer') bucket = 'volunteer';
      else if (target.field === 'references') bucket = 'references';
      else if (target.field === 'awards') bucket = 'achievements';
      else if (
        target.field === 'professionalHighlights' ||
        target.field === 'professionalQualifications' ||
        target.field === 'training' ||
        target.field === 'seminars' ||
        target.field === 'strengths' ||
        target.field === 'industryExpertise' ||
        target.field === 'coreCompetencies' ||
        target.field === 'softSkills' ||
        target.field === 'technicalSkills'
      ) {
        continue;
      }
    } else if (target.kind === 'experience_body') {
      bucket = 'experience';
    }
    if (!bucket || !aliases[bucket]) continue;
    for (const phrase of section.phrases) {
      if (!aliases[bucket].includes(phrase)) aliases[bucket].push(phrase);
    }
  }

  return aliases;
}

/** Custom parser SECTION_TAXONOMY phrases/tokens from registry. */
export function buildParserSectionTaxonomy(): Record<
  Exclude<NormalizedSectionType, 'custom'>,
  { phrases: string[]; tokens: string[]; typicalOrder: number }
> {
  const out = {} as Record<
    Exclude<NormalizedSectionType, 'custom'>,
    { phrases: string[]; tokens: string[]; typicalOrder: number }
  >;
  const parserTypes: Exclude<NormalizedSectionType, 'custom'>[] = [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'languages',
    'certifications',
    'achievements',
    'hobbies',
    'references',
    'volunteer',
    'publications',
  ];

  for (const pt of parserTypes) {
    out[pt] = { phrases: [], tokens: [], typicalOrder: 0.5 };
  }

  for (const section of SEMANTIC_SECTION_DEFINITIONS) {
    if (!section.parserType || section.parserType === 'custom') continue;
    const pt = section.parserType;
    const entry = out[pt];
    if (!entry) continue;
    for (const p of section.phrases) {
      if (!entry.phrases.includes(p)) entry.phrases.push(p);
    }
    if (section.tokens) {
      for (const t of section.tokens) {
        if (!entry.tokens.includes(t)) entry.tokens.push(t);
      }
    }
    if (section.typicalOrder != null) {
      entry.typicalOrder = section.typicalOrder;
    }
  }

  return out;
}

/** OpenAI / Hybrid prompt section rules derived from registry. */
export function buildOpenAISectionClassificationRules(): string {
  const lines: string[] = [
    'SECTION CLASSIFICATION (use exactly these targets — never invent new section names):',
  ];
  const seen = new Set<string>();
  for (const section of SEMANTIC_SECTION_DEFINITIONS) {
    if (seen.has(section.id)) continue;
    seen.add(section.id);
    const target =
      section.builderTarget.kind === 'standard'
        ? `builder.${section.builderTarget.field}`
        : section.builderTarget.kind === 'extended'
          ? `builder.extended.${section.builderTarget.field}`
          : section.builderTarget.kind === 'experience_body'
            ? 'experience[].description (append, do not create new section)'
            : 'builder.extraSections';
  lines.push(
      `- "${section.label}" (${section.phrases.slice(0, 4).join(', ')}…) → ${target}`
    );
  }
  lines.push('- Professional Highlights → builder.extended.professionalHighlights (NOT summary, NOT projects)');
  lines.push('- Professional Qualifications → builder.extended.professionalQualifications OR certifications (NOT education degrees)');
  lines.push('- Strengths → builder.extended.strengths (NOT general skills)');
  lines.push('- Key Responsibilities → experience description bullets (NOT a standalone section)');
  return lines.join('\n');
}

/** Dynamic section specs derived from registry extended targets. */
export function getExtendedFieldDefinitions(): Array<{
  id: string;
  label: string;
  fieldKey: keyof ExtendedBuilderSections;
  nodeTypes: CanonicalNodeType[];
  kind: 'stringList' | 'recordList' | 'textarea' | 'keyValue';
}> {
  const specs: Array<{
    id: string;
    label: string;
    fieldKey: keyof ExtendedBuilderSections;
    nodeTypes: CanonicalNodeType[];
    kind: 'stringList' | 'recordList' | 'textarea' | 'keyValue';
  }> = [];

  const recordFields = new Set<keyof ExtendedBuilderSections>(['internships', 'references']);
  const textareaFields = new Set<keyof ExtendedBuilderSections>(['declaration']);
  const keyValueFields = new Set<keyof ExtendedBuilderSections>(['personalDetails']);

  for (const section of SEMANTIC_SECTION_DEFINITIONS) {
    if (section.builderTarget.kind !== 'extended') continue;
    const fieldKey = section.builderTarget.field;
    if (fieldKey === 'extraSections') continue;
    if (specs.some((s) => s.fieldKey === fieldKey)) continue;
    let kind: 'stringList' | 'recordList' | 'textarea' | 'keyValue' = 'stringList';
    if (recordFields.has(fieldKey)) kind = 'recordList';
    else if (textareaFields.has(fieldKey)) kind = 'textarea';
    else if (keyValueFields.has(fieldKey)) kind = 'keyValue';
    specs.push({
      id: section.id,
      label: section.label,
      fieldKey,
      nodeTypes: section.nodeTypes,
      kind,
    });
  }
  return specs;
}

export const STANDARD_PROFILE_KEYS = new Set([
  'firstName',
  'lastName',
  'name',
  'fullName',
  'email',
  'phone',
  'location',
  'address',
  'linkedin',
  'portfolio',
  'github',
  'headline',
  'jobTitle',
  'title',
  'designation',
  'summary',
  'bio',
  'objective',
  'professionalSummary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'achievements',
  'hobbies',
  'interests',
  'awards',
  'rawText',
  'confidence',
  'resumeId',
  'builderFormData',
  'additionalResumeData',
  'customParserUsed',
  'selectedParser',
  '_aiProvider',
  '_imported',
  'Work Experience',
  'Experience',
  'Education',
  'Skills',
  'Projects',
  'Certifications',
  'Achievements',
  'Languages',
  'Hobbies',
  'extendedSections',
  'unsupportedSections',
  'mappingLedger',
]);
