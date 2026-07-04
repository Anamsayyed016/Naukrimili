/**
 * Canonical field nodes — intermediate representation between parser output and Builder form.
 * Mapping layer only; does not alter parser extraction.
 */

export const CANONICAL_MAPPING_VERSION = '1.0.0';

export type CanonicalNodeType =
  | 'PERSON_NAME'
  | 'JOB_TITLE'
  | 'COMPANY'
  | 'ORGANIZATION'
  | 'EMPLOYER'
  | 'LOCATION'
  | 'ADDRESS'
  | 'PHONE'
  | 'EMAIL'
  | 'LINKEDIN'
  | 'PORTFOLIO'
  | 'GITHUB'
  | 'SUMMARY'
  | 'OBJECTIVE'
  | 'PROFILE'
  | 'EXPERIENCE'
  | 'PROJECT'
  | 'CERTIFICATION'
  | 'LICENSE'
  | 'EDUCATION'
  | 'TRAINING'
  | 'INTERNSHIP'
  | 'ACHIEVEMENT'
  | 'RESPONSIBILITY'
  | 'LANGUAGE'
  | 'HOBBY'
  | 'INTEREST'
  | 'SOFT_SKILL'
  | 'TECHNICAL_SKILL'
  | 'CORE_SKILL'
  | 'TOOLS'
  | 'FRAMEWORK'
  | 'DATABASE'
  | 'AWARD'
  | 'PUBLICATION'
  | 'REFERENCE'
  | 'DECLARATION'
  | 'PERSONAL_DETAILS'
  | 'MEMBERSHIP'
  | 'VOLUNTEER'
  | 'RESEARCH'
  | 'PATENT'
  | 'SEMANTIC_SECTION'
  | 'STRENGTH'
  | 'INDUSTRY_EXPERTISE'
  | 'UNKNOWN';

export interface CanonicalFieldNode {
  id: string;
  type: CanonicalNodeType;
  value: string;
  confidence: number;
  section: string;
  page?: number;
  position: number;
  parent?: string;
  source: string;
}

export interface BuilderFieldSpec {
  builderKey: string;
  acceptedTypes: CanonicalNodeType[];
  aliasKeys: string[];
  /** Scalar identity / summary fields */
  scalar?: boolean;
  /** Per-entry array field (experience, education, etc.) */
  arrayEntry?: boolean;
  entryField?: string;
}

export interface CanonicalMappingReport {
  matched: string[];
  recovered: string[];
  missing: string[];
  rejected: string[];
  repaired: string[];
  dynamicSections: string[];
  ledger?: BuilderMappingLedger;
}

export interface CanonicalMappingResult {
  version: string;
  nodes: CanonicalFieldNode[];
  builder: Record<string, unknown>;
  report: CanonicalMappingReport;
}

/** Extended Builder schema — preserved alongside existing form fields. */
export interface ExtendedBuilderSections {
  professionalQualifications: string[];
  professionalHighlights: string[];
  coreCompetencies: string[];
  softSkills: string[];
  technicalSkills: string[];
  strengths: string[];
  industryExpertise: string[];
  seminars: string[];
  awards: string[];
  memberships: string[];
  training: string[];
  internships: Array<Record<string, unknown>>;
  volunteer: string[];
  research: string[];
  patents: string[];
  publications: string[];
  references: Array<Record<string, unknown>>;
  declaration: string;
  personalDetails: Record<string, string>;
  extraSections: Array<{ heading: string; body: string }>;
  /** Sections that could not be mapped — visible for user review, never silently dropped */
  unsupportedSections: Array<{ heading: string; body: string; reason?: string }>;
}

export interface BuilderMappingLedger {
  mapped: number;
  recovered: number;
  dynamic: number;
  unsupported: number;
  discarded: number;
  nodeIds: string[];
}

export function emptyExtendedBuilderSections(): ExtendedBuilderSections {
  return {
    professionalQualifications: [],
    professionalHighlights: [],
    coreCompetencies: [],
    softSkills: [],
    technicalSkills: [],
    strengths: [],
    industryExpertise: [],
    seminars: [],
    awards: [],
    memberships: [],
    training: [],
    internships: [],
    volunteer: [],
    research: [],
    patents: [],
    publications: [],
    references: [],
    declaration: '',
    personalDetails: {},
    extraSections: [],
    unsupportedSections: [],
  };
}

export function emptyMappingLedger(): BuilderMappingLedger {
  return { mapped: 0, recovered: 0, dynamic: 0, unsupported: 0, discarded: 0, nodeIds: [] };
}
