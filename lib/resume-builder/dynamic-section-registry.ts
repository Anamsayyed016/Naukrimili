/**
 * Schema-driven registry for optional Builder sections backed by canonical mapping.
 * Sections render only when data exists — no per-resume hardcoding.
 */

import type { CanonicalNodeType } from '@/lib/resume-builder/canonical-mapping/types';
import { emptyExtendedBuilderSections, type ExtendedBuilderSections } from '@/lib/resume-builder/canonical-mapping/types';

export type DynamicSectionKind = 'stringList' | 'recordList' | 'textarea' | 'keyValue';

export interface RecordFieldSpec {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'month' | 'email' | 'tel';
}

export interface DynamicSectionSpec {
  id: string;
  label: string;
  description: string;
  fieldKey: keyof ExtendedBuilderSections;
  kind: DynamicSectionKind;
  canonicalTypes: CanonicalNodeType[];
  recordFields?: RecordFieldSpec[];
}

export const DYNAMIC_SECTION_REGISTRY: DynamicSectionSpec[] = [
  {
    id: 'awards',
    label: 'Awards & Honors',
    description: 'Recognitions, honors, and awards received.',
    fieldKey: 'awards',
    kind: 'stringList',
    canonicalTypes: ['AWARD'],
  },
  {
    id: 'professional-highlights',
    label: 'Professional Highlights',
    description: 'Career highlights and standout accomplishments.',
    fieldKey: 'professionalHighlights',
    kind: 'stringList',
    canonicalTypes: ['ACHIEVEMENT'],
  },
  {
    id: 'professional-qualifications',
    label: 'Professional Qualifications',
    description: 'Formal qualifications separate from education degrees.',
    fieldKey: 'professionalQualifications',
    kind: 'stringList',
    canonicalTypes: ['EDUCATION'],
  },
  {
    id: 'core-competencies',
    label: 'Core Competencies',
    description: 'Core competencies distinct from general skills.',
    fieldKey: 'coreCompetencies',
    kind: 'stringList',
    canonicalTypes: ['CORE_SKILL'],
  },
  {
    id: 'soft-skills',
    label: 'Soft Skills',
    description: 'Interpersonal and transferable skills.',
    fieldKey: 'softSkills',
    kind: 'stringList',
    canonicalTypes: ['SOFT_SKILL'],
  },
  {
    id: 'technical-skills',
    label: 'Technical Skills',
    description: 'Tools, frameworks, and technical proficiencies.',
    fieldKey: 'technicalSkills',
    kind: 'stringList',
    canonicalTypes: ['TECHNICAL_SKILL', 'TOOLS', 'FRAMEWORK', 'DATABASE'],
  },
  {
    id: 'volunteer',
    label: 'Volunteer Experience',
    description: 'Volunteer roles and community involvement.',
    fieldKey: 'volunteer',
    kind: 'stringList',
    canonicalTypes: ['VOLUNTEER'],
  },
  {
    id: 'training',
    label: 'Training & Workshops',
    description: 'Courses, seminars, and professional training.',
    fieldKey: 'training',
    kind: 'stringList',
    canonicalTypes: ['TRAINING'],
  },
  {
    id: 'internships',
    label: 'Internships',
    description: 'Internship positions and details.',
    fieldKey: 'internships',
    kind: 'recordList',
    canonicalTypes: ['INTERNSHIP'],
    recordFields: [
      { key: 'title', label: 'Role / Title', placeholder: 'Software Engineering Intern' },
      { key: 'company', label: 'Organization', placeholder: 'Acme Corp' },
      { key: 'location', label: 'Location', placeholder: 'Remote' },
      { key: 'startDate', label: 'Start', type: 'month' },
      { key: 'endDate', label: 'End', type: 'month' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    id: 'research',
    label: 'Research',
    description: 'Research projects and academic work.',
    fieldKey: 'research',
    kind: 'stringList',
    canonicalTypes: ['RESEARCH'],
  },
  {
    id: 'publications',
    label: 'Publications',
    description: 'Published papers, articles, and books.',
    fieldKey: 'publications',
    kind: 'stringList',
    canonicalTypes: ['PUBLICATION'],
  },
  {
    id: 'patents',
    label: 'Patents',
    description: 'Patents and intellectual property.',
    fieldKey: 'patents',
    kind: 'stringList',
    canonicalTypes: ['PATENT'],
  },
  {
    id: 'memberships',
    label: 'Memberships',
    description: 'Professional associations and memberships.',
    fieldKey: 'memberships',
    kind: 'stringList',
    canonicalTypes: ['MEMBERSHIP'],
  },
  {
    id: 'references',
    label: 'References',
    description: 'Professional references.',
    fieldKey: 'references',
    kind: 'recordList',
    canonicalTypes: ['REFERENCE'],
    recordFields: [
      { key: 'name', label: 'Name', placeholder: 'Jane Smith' },
      { key: 'title', label: 'Title', placeholder: 'Engineering Manager' },
      { key: 'company', label: 'Company', placeholder: 'Acme Corp' },
      { key: 'phone', label: 'Phone', type: 'tel' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'relationship', label: 'Relationship', placeholder: 'Former Manager' },
    ],
  },
  {
    id: 'declaration',
    label: 'Declaration',
    description: 'Declaration or certification statement.',
    fieldKey: 'declaration',
    kind: 'textarea',
    canonicalTypes: ['DECLARATION'],
  },
  {
    id: 'personal-details',
    label: 'Personal Details',
    description: 'Additional personal information from the resume.',
    fieldKey: 'personalDetails',
    kind: 'keyValue',
    canonicalTypes: ['PERSONAL_DETAILS'],
  },
];

function hasStringList(value: unknown): boolean {
  return Array.isArray(value) && value.some((v) => typeof v === 'string' && v.trim().length > 0);
}

function hasRecordList(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.some((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    return Object.values(entry as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.trim().length > 0
    );
  });
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasKeyValue(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.values(value as Record<string, unknown>).some(
    (v) => typeof v === 'string' && v.trim().length > 0
  );
}

export function readExtendedSections(formData: Record<string, unknown>): ExtendedBuilderSections {
  const base = emptyExtendedBuilderSections();
  const ext =
    formData.extendedSections && typeof formData.extendedSections === 'object'
      ? (formData.extendedSections as Partial<ExtendedBuilderSections>)
      : {};

  const merged: ExtendedBuilderSections = {
    ...base,
    ...ext,
    personalDetails: { ...base.personalDetails, ...(ext.personalDetails || {}) },
    extraSections: [...(ext.extraSections || [])],
  };

  for (const spec of DYNAMIC_SECTION_REGISTRY) {
    const top = formData[spec.fieldKey];
    if (top == null) continue;
    if (spec.kind === 'stringList' && hasStringList(top)) {
      (merged[spec.fieldKey] as string[]) = top as string[];
    } else if (spec.kind === 'recordList' && hasRecordList(top)) {
      (merged[spec.fieldKey] as Array<Record<string, unknown>>) = top as Array<Record<string, unknown>>;
    } else if (spec.kind === 'textarea' && hasText(top)) {
      (merged[spec.fieldKey] as string) = String(top);
    } else if (spec.kind === 'keyValue' && hasKeyValue(top)) {
      (merged[spec.fieldKey] as Record<string, string>) = top as Record<string, string>;
    }
  }

  if (hasRecordList(formData.extraSections)) {
    merged.extraSections = formData.extraSections as Array<{ heading: string; body: string }>;
  } else if (merged.extraSections.length === 0 && Array.isArray(ext.extraSections)) {
    merged.extraSections = ext.extraSections;
  }

  return merged;
}

export function sectionHasData(
  spec: DynamicSectionSpec,
  extended: ExtendedBuilderSections
): boolean {
  const value = extended[spec.fieldKey];
  switch (spec.kind) {
    case 'stringList':
      return hasStringList(value);
    case 'recordList':
      return hasRecordList(value);
    case 'textarea':
      return hasText(value);
    case 'keyValue':
      return hasKeyValue(value);
    default:
      return false;
  }
}

export function getActiveDynamicSections(formData: Record<string, unknown>): DynamicSectionSpec[] {
  const extended = readExtendedSections(formData);
  const active = DYNAMIC_SECTION_REGISTRY.filter((spec) => sectionHasData(spec, extended));
  if (extended.extraSections.length > 0) {
    return active;
  }
  return active;
}

export function hasAnyDynamicSectionData(formData: Record<string, unknown>): boolean {
  const extended = readExtendedSections(formData);
  if (extended.extraSections.length > 0) return true;
  return DYNAMIC_SECTION_REGISTRY.some((spec) => sectionHasData(spec, extended));
}

export function writeExtendedSection(
  formData: Record<string, unknown>,
  fieldKey: keyof ExtendedBuilderSections,
  value: unknown
): Record<string, unknown> {
  const extended = readExtendedSections(formData);
  return {
    ...formData,
    extendedSections: { ...extended, [fieldKey]: value },
    [fieldKey]: value,
  };
}
