/**
 * Builder compatibility layer — every canonical node must be accounted for.
 */

import type { CanonicalFieldNode } from '@/lib/resume-builder/canonical-mapping/types';
import {
  emptyMappingLedger,
  type BuilderMappingLedger,
  type ExtendedBuilderSections,
} from '@/lib/resume-builder/canonical-mapping/types';
import { emptyExtendedBuilderSections } from '@/lib/resume-builder/canonical-mapping/types';
import { classifySectionHeading, STANDARD_PROFILE_KEYS } from '@/lib/resume-builder/semantic-registry';
import { routeSectionBodyToBuilder } from '@/lib/resume-builder/semantic-routing';

const ACCOUNTED_TYPES = new Set([
  'PERSON_NAME',
  'JOB_TITLE',
  'COMPANY',
  'ORGANIZATION',
  'EMPLOYER',
  'LOCATION',
  'ADDRESS',
  'PHONE',
  'EMAIL',
  'LINKEDIN',
  'PORTFOLIO',
  'GITHUB',
  'SUMMARY',
  'OBJECTIVE',
  'PROFILE',
  'EXPERIENCE',
  'PROJECT',
  'CERTIFICATION',
  'LICENSE',
  'EDUCATION',
  'LANGUAGE',
  'HOBBY',
  'INTEREST',
  'ACHIEVEMENT',
  'RESPONSIBILITY',
  'SEMANTIC_SECTION',
  'AWARD',
  'PUBLICATION',
  'PATENT',
  'VOLUNTEER',
  'MEMBERSHIP',
  'TRAINING',
  'RESEARCH',
  'REFERENCE',
  'DECLARATION',
  'PERSONAL_DETAILS',
  'TECHNICAL_SKILL',
  'CORE_SKILL',
  'SOFT_SKILL',
  'TOOLS',
  'FRAMEWORK',
  'DATABASE',
  'STRENGTH',
  'INDUSTRY_EXPERTISE',
  'INTERNSHIP',
]);

function ingestProfileSectionKeys(
  builder: Record<string, unknown>,
  profile: Record<string, unknown>
): Record<string, unknown> {
  let next = { ...builder };
  for (const [key, raw] of Object.entries(profile)) {
    if (STANDARD_PROFILE_KEYS.has(key)) continue;
    const classified = classifySectionHeading(key.replace(/([A-Z])/g, ' $1'));
    if (!classified) continue;

    let body = '';
    if (typeof raw === 'string') body = raw;
    else if (Array.isArray(raw)) {
      body = raw
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return Object.values(item as Record<string, unknown>)
              .filter((v) => typeof v === 'string' && String(v).trim())
              .join(' — ');
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    if (!body.trim()) continue;
    next = routeSectionBodyToBuilder(next, classified.definition.label, body, classified.confidence);
  }
  return next;
}

function ingestAdditionalSections(
  builder: Record<string, unknown>,
  profile: Record<string, unknown>
): Record<string, unknown> {
  let next = { ...builder };
  const additional = profile.additionalResumeData;
  if (!additional || typeof additional !== 'object') return next;
  const add = additional as Record<string, unknown>;

  const extra = Array.isArray(add.extraSections) ? add.extraSections : [];
  for (const block of extra) {
    if (!block || typeof block !== 'object') continue;
    const heading = String((block as { heading?: string }).heading || '').trim();
    const body = String((block as { body?: string }).body || '').trim();
    if (!heading) continue;
    next = routeSectionBodyToBuilder(next, heading, body, 75);
  }

  for (const header of Array.isArray(add.sectionHeaders) ? add.sectionHeaders : []) {
    const h = String(header || '').trim();
    if (!h) continue;
    const match = extra.find(
      (e) =>
        e &&
        typeof e === 'object' &&
        String((e as { heading?: string }).heading || '').toLowerCase() === h.toLowerCase()
    );
    if (match) continue;
    next = routeSectionBodyToBuilder(next, h, '', 60);
  }

  return next;
}

/**
 * Final compatibility pass: route profile sections, extend schema, account all nodes.
 */
export function applyBuilderCompatibility(
  builder: Record<string, unknown>,
  profile: Record<string, unknown>,
  nodes: CanonicalFieldNode[]
): { builder: Record<string, unknown>; ledger: BuilderMappingLedger } {
  const ledger = emptyMappingLedger();
  ledger.mapped = nodes.length;
  ledger.nodeIds = nodes.map((n) => n.id);

  let next = ingestProfileSectionKeys(builder, profile);
  next = ingestAdditionalSections(next, profile);

  const extended: ExtendedBuilderSections = {
    ...emptyExtendedBuilderSections(),
    ...(typeof next.extendedSections === 'object'
      ? (next.extendedSections as ExtendedBuilderSections)
      : {}),
  };

  for (const node of nodes) {
    if (ACCOUNTED_TYPES.has(node.type)) {
      ledger.recovered += 1;
    } else if (node.type === 'UNKNOWN') {
      const heading = node.section || node.source;
      extended.unsupportedSections.push({
        heading,
        body: node.value,
        reason: 'unclassified node type',
      });
      ledger.unsupported += 1;
    } else {
      extended.unsupportedSections.push({
        heading: node.type,
        body: node.value,
        reason: 'unsupported node type',
      });
      ledger.unsupported += 1;
    }
  }

  const dynamicFields = [
    'awards',
    'professionalHighlights',
    'professionalQualifications',
    'coreCompetencies',
    'softSkills',
    'technicalSkills',
    'strengths',
    'industryExpertise',
    'seminars',
    'training',
    'volunteer',
    'memberships',
    'research',
    'publications',
    'patents',
    'references',
    'declaration',
  ] as const;
  for (const key of dynamicFields) {
    const val = extended[key];
    if (Array.isArray(val) && val.length > 0) ledger.dynamic += 1;
    else if (typeof val === 'string' && val.trim()) ledger.dynamic += 1;
  }
  if (extended.extraSections.length > 0) ledger.dynamic += extended.extraSections.length;

  ledger.discarded = 0;

  return {
    builder: {
      ...next,
      extendedSections: extended,
      unsupportedSections: extended.unsupportedSections,
      mappingLedger: ledger,
    },
    ledger,
  };
}
