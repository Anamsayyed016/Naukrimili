/**
 * Dynamic section visibility, meaningful-content checks, and duplicate merging.
 */

import {
  emptyExtendedBuilderSections,
  type ExtendedBuilderSections,
} from '@/lib/resume-builder/canonical-mapping/types';
import { SEMANTIC_SECTION_DEFINITIONS } from '@/lib/resume-builder/semantic-registry';
import { hasMeaningfulText, isInvalidStringListItemForSection } from '@/lib/resume-builder/section-visibility';
import type { DynamicSectionKind, DynamicSectionSpec } from '@/lib/resume-builder/dynamic-section-registry';

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^unknown$/i, /^n\/a\.?$/i, /^na\.?$/i, /^-+$/, /^\.+$/, /^_+$/,
  /^none$/i, /^nil$/i, /^null$/i, /^not applicable$/i, /^not available$/i,
  /^tbd\.?$/i, /^placeholder$/i, /^enter .+$/i, /^your .+ here$/i,
  /^add .+ here$/i, /^click to add$/i, /^to be added$/i, /^pending$/i,
  /^sample$/i, /^example$/i, /^lorem ipsum/i,
];

const DYNAMIC_SECTION_LABELS = [
  'Awards & Honors', 'Professional Highlights', 'Professional Qualifications',
  'Core Competencies', 'Soft Skills', 'Technical Skills', 'Strengths',
  'Industry Expertise', 'Seminars & Conferences', 'Volunteer Experience',
  'Training & Workshops', 'Internships', 'Research', 'Publications', 'Patents',
  'Memberships', 'References', 'Declaration', 'Personal Details',
];

const SECTION_HEADING_PHRASES = new Set<string>(
  [
    ...DYNAMIC_SECTION_LABELS.map((label) => label.toLowerCase()),
    ...SEMANTIC_SECTION_DEFINITIONS.flatMap((d) =>
      [d.label, ...d.phrases].map((p) => p.toLowerCase().trim())
    ),
  ].filter(Boolean)
);

const DUPLICATE_MERGE_THRESHOLD = 0.9;

type StandardMergeTarget = 'skills' | 'achievements' | 'certifications' | 'languages' | 'hobbies' | 'summary';

interface DynamicMergeRule {
  dynamicField: keyof ExtendedBuilderSections;
  target: StandardMergeTarget;
}

const DYNAMIC_MERGE_RULES: DynamicMergeRule[] = [
  { dynamicField: 'technicalSkills', target: 'skills' },
  { dynamicField: 'coreCompetencies', target: 'skills' },
  { dynamicField: 'softSkills', target: 'skills' },
  { dynamicField: 'strengths', target: 'skills' },
  { dynamicField: 'industryExpertise', target: 'skills' },
  { dynamicField: 'awards', target: 'achievements' },
  { dynamicField: 'professionalHighlights', target: 'achievements' },
  { dynamicField: 'professionalQualifications', target: 'certifications' },
];

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/\s+\d{1,3}%?\s*$/i, '').replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokensMatch(a: string, b: string): boolean {
  const na = normalizeToken(a);
  const nb = normalizeToken(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;
  return false;
}

export function isPlaceholderContent(value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  if (text.length <= 2 && !/[a-z0-9]{2}/i.test(text)) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(text));
}

export function isHeadingOnlyContent(value: string, sectionLabel?: string): boolean {
  const text = value.trim();
  if (!text) return true;
  const normalized = text.toLowerCase().replace(/[:|\-_=]+$/, '').replace(/\s+/g, ' ').trim();
  if (sectionLabel && normalized === sectionLabel.toLowerCase().replace(/\s+/g, ' ').trim()) return true;
  if (SECTION_HEADING_PHRASES.has(normalized)) return true;
  return /^(section|heading|title)\s*[:.]?\s*$/i.test(normalized);
}

export function filterMeaningfulListItems(
  items: unknown[],
  options?: { sectionLabel?: string; excludeValues?: Iterable<string> }
): string[] {
  if (!Array.isArray(items)) return [];
  const exclude = new Set<string>();
  if (options?.excludeValues) {
    for (const value of options.excludeValues) {
      const key = normalizeToken(String(value));
      if (key) exclude.add(key);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const text = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
    if (!hasMeaningfulText(text) || isPlaceholderContent(text) || isHeadingOnlyContent(text, options?.sectionLabel)) continue;
    if (isInvalidStringListItemForSection(text, options?.sectionLabel)) continue;
    const key = normalizeToken(text);
    if (!key || seen.has(key)) continue;
    if (exclude.has(key) || [...exclude].some((ex) => tokensMatch(ex, key))) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function overlapRatio(source: string[], target: string[]): number {
  if (source.length === 0) return 0;
  return source.filter((item) => target.some((t) => tokensMatch(item, t))).length / source.length;
}

function mergeUniqueIntoTarget(target: string[], incoming: string[]): string[] {
  const out = [...target];
  for (const item of incoming) {
    if (!out.some((existing) => tokensMatch(existing, item))) out.push(item);
  }
  return out;
}

function extractStandardStringList(builder: Record<string, unknown>, target: StandardMergeTarget): string[] {
  switch (target) {
    case 'skills':
      return filterMeaningfulListItems(Array.isArray(builder.skills ?? builder.Skills) ? (builder.skills ?? builder.Skills) as unknown[] : []);
    case 'achievements':
      return filterMeaningfulListItems(Array.isArray(builder.achievements ?? builder.Achievements) ? (builder.achievements ?? builder.Achievements) as unknown[] : []);
    case 'hobbies':
      return filterMeaningfulListItems(Array.isArray(builder.hobbies ?? builder.Hobbies) ? (builder.hobbies ?? builder.Hobbies) as unknown[] : []);
    case 'summary': {
      const raw = String(builder.summary ?? builder.bio ?? '').trim();
      return raw && hasMeaningfulText(raw) ? [raw] : [];
    }
    case 'languages': {
      const raw = builder.languages ?? builder.Languages;
      if (!Array.isArray(raw)) return [];
      return filterMeaningfulListItems(raw.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          return String(rec.language ?? rec.name ?? '');
        }
        return '';
      }));
    }
    case 'certifications': {
      const raw = builder.certifications ?? builder.Certifications;
      if (!Array.isArray(raw)) return [];
      return filterMeaningfulListItems(raw.map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          return String(rec.name ?? rec.title ?? '');
        }
        return '';
      }));
    }
    default:
      return [];
  }
}

function writeStandardStringList(builder: Record<string, unknown>, target: StandardMergeTarget, values: string[]): void {
  if (target === 'skills') { builder.skills = values; builder.Skills = values; }
  else if (target === 'achievements') { builder.achievements = values; builder.Achievements = values; }
  else if (target === 'hobbies') { builder.hobbies = values; builder.Hobbies = values; }
  else if (target === 'summary' && values[0]) { builder.summary = values[0]; builder.bio = values[0]; builder.objective = values[0]; }
  else if (target === 'languages') {
    builder.languages = values.map((name) => ({ language: name, name, proficiency: '' }));
    builder.Languages = builder.languages;
  } else if (target === 'certifications') {
    builder.certifications = values.map((name) => ({ name, issuer: '', date: '', link: '' }));
    builder.Certifications = builder.certifications;
  }
}

function filterMeaningfulRecordList(items: unknown[], spec: DynamicSectionSpec): Array<Record<string, unknown>> {
  if (!Array.isArray(items)) return [];
  return items
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map((entry) => {
      const cleaned: Record<string, unknown> = {};
      for (const field of spec.recordFields || [{ key: 'name', label: 'Name' }]) {
        const text = String(entry[field.key] ?? '').trim();
        if (hasMeaningfulText(text) && !isPlaceholderContent(text) && !isHeadingOnlyContent(text, spec.label)) {
          cleaned[field.key] = text;
        }
      }
      return cleaned;
    })
    .filter((entry) => Object.keys(entry).length > 0);
}

function filterMeaningfulKeyValue(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const k = key.trim();
    const v = String(raw ?? '').trim();
    if (!k || !hasMeaningfulText(v) || isPlaceholderContent(v) || isHeadingOnlyContent(v, k)) continue;
    out[k] = v;
  }
  return out;
}

export function hasMeaningfulContent(value: unknown, kind: DynamicSectionKind, sectionLabel?: string): boolean {
  switch (kind) {
    case 'stringList':
      return filterMeaningfulListItems(Array.isArray(value) ? value : [], { sectionLabel }).length > 0;
    case 'recordList': {
      if (!Array.isArray(value)) return false;
      return value.some((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        return Object.values(entry as Record<string, unknown>).some((v) => {
          const text = String(v ?? '').trim();
          return hasMeaningfulText(text) && !isPlaceholderContent(text) && !isHeadingOnlyContent(text, sectionLabel);
        });
      });
    }
    case 'textarea': {
      const text = typeof value === 'string' ? value.trim() : '';
      return hasMeaningfulText(text) && !isPlaceholderContent(text) && !isHeadingOnlyContent(text, sectionLabel);
    }
    case 'keyValue':
      return Object.keys(filterMeaningfulKeyValue(value)).length > 0;
    default:
      return false;
  }
}

function sanitizeExtendedField(spec: DynamicSectionSpec, value: unknown): unknown {
  switch (spec.kind) {
    case 'stringList':
      return filterMeaningfulListItems(Array.isArray(value) ? value : [], { sectionLabel: spec.label });
    case 'recordList':
      return filterMeaningfulRecordList(Array.isArray(value) ? value : [], spec);
    case 'textarea': {
      const text = typeof value === 'string' ? value.trim() : '';
      return hasMeaningfulText(text) && !isPlaceholderContent(text) && !isHeadingOnlyContent(text, spec.label) ? text : '';
    }
    case 'keyValue':
      return filterMeaningfulKeyValue(value);
    default:
      return value;
  }
}

function mergeDynamicIntoStandard(
  builder: Record<string, unknown>,
  extended: ExtendedBuilderSections,
  registry: DynamicSectionSpec[]
): ExtendedBuilderSections {
  const next = { ...extended, personalDetails: { ...extended.personalDetails } };
  const userOwnsCanonical = builder._userEdited === true;

  for (const rule of DYNAMIC_MERGE_RULES) {
    const spec = registry.find((s) => s.fieldKey === rule.dynamicField);
    if (!spec || spec.kind !== 'stringList') continue;
    const dynamicItems = filterMeaningfulListItems(Array.isArray(next[rule.dynamicField]) ? next[rule.dynamicField] as string[] : [], { sectionLabel: spec.label });
    if (dynamicItems.length === 0) { (next[rule.dynamicField] as string[]) = []; continue; }

    // After the user edits the form, never revive deleted tokens from dynamic
    // buckets (technicalSkills, awards, …) into the canonical section.
    if (userOwnsCanonical) {
      (next[rule.dynamicField] as string[]) = [];
      continue;
    }

    const standardItems = extractStandardStringList(builder, rule.target);
    const overlap = overlapRatio(dynamicItems, standardItems);
    if (standardItems.length > 0 && overlap >= DUPLICATE_MERGE_THRESHOLD) {
      const unique = dynamicItems.filter((item) => !standardItems.some((e) => tokensMatch(e, item)));
      if (unique.length > 0) writeStandardStringList(builder, rule.target, mergeUniqueIntoTarget(standardItems, unique));
      (next[rule.dynamicField] as string[]) = [];
      continue;
    }
    if (standardItems.length > 0) {
      // Native sections are authoritative: always merge alias content into native and suppress duplicate dynamic section.
      writeStandardStringList(builder, rule.target, mergeUniqueIntoTarget(standardItems, dynamicItems));
      (next[rule.dynamicField] as string[]) = [];
    }
  }
  return next;
}

function sanitizeExtraSections(sections: Array<{ heading: string; body: string }>): Array<{ heading: string; body: string }> {
  const out: Array<{ heading: string; body: string }> = [];
  const seen = new Set<string>();
  for (const section of sections) {
    const heading = String(section.heading || '').trim();
    const body = String(section.body || '').trim();
    if (!heading || !body || isPlaceholderContent(body) || isHeadingOnlyContent(body, heading)) continue;
    const lines = filterMeaningfulListItems(body.split(/\n+/), { sectionLabel: heading });
    const meaningfulBody = lines.length > 0 ? lines.join('\n') : body;
    if (!hasMeaningfulText(meaningfulBody) || isHeadingOnlyContent(meaningfulBody, heading)) continue;
    const key = `${heading.toLowerCase()}|${normalizeToken(meaningfulBody)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ heading, body: meaningfulBody });
  }
  return out;
}

function syncExtendedTopLevelFields(
  builder: Record<string, unknown>,
  extended: ExtendedBuilderSections,
  registry: DynamicSectionSpec[]
): void {
  builder.extendedSections = extended;
  for (const spec of registry) {
    const sanitized = sanitizeExtendedField(spec, extended[spec.fieldKey]);
    if (hasMeaningfulContent(sanitized, spec.kind, spec.label)) {
      builder[spec.fieldKey] = sanitized;
      (extended as Record<string, unknown>)[spec.fieldKey] = sanitized;
    } else {
      delete builder[spec.fieldKey];
      if (spec.kind === 'stringList') (extended[spec.fieldKey] as string[]) = [];
      else if (spec.kind === 'recordList') (extended[spec.fieldKey] as Array<Record<string, unknown>>) = [];
      else if (spec.kind === 'textarea') extended[spec.fieldKey] = '' as never;
      else if (spec.kind === 'keyValue') extended.personalDetails = {};
    }
  }
  builder.extraSections = extended.extraSections;
  builder.unsupportedSections = extended.unsupportedSections;
}

export function isDynamicSectionVisible(
  spec: DynamicSectionSpec,
  extended: ExtendedBuilderSections,
  builder: Record<string, unknown>
): boolean {
  const value = extended[spec.fieldKey];
  if (!hasMeaningfulContent(value, spec.kind, spec.label)) return false;

  const rule = DYNAMIC_MERGE_RULES.find((r) => r.dynamicField === spec.fieldKey);
  if (!rule || spec.kind !== 'stringList') return true;

  const dynamicItems = filterMeaningfulListItems(Array.isArray(value) ? (value as string[]) : [], {
    sectionLabel: spec.label,
  });
  if (dynamicItems.length === 0) return false;

  const standardItems = extractStandardStringList(builder, rule.target);
  if (standardItems.length === 0) return true;

  const unique = dynamicItems.filter((item) => !standardItems.some((existing) => tokensMatch(existing, item)));
  return unique.length > 0;
}

/** After user edits, mirror canonical lists onto aliases so stale import snapshots cannot linger. */
function syncCanonicalAliasesForUserEdit(builder: Record<string, unknown>): void {
  if (builder._userEdited !== true) return;

  // Prefer canonical key when present (including []); never fall back to stale aliases.
  if (Object.prototype.hasOwnProperty.call(builder, 'skills') && Array.isArray(builder.skills)) {
    builder.Skills = builder.skills;
  }
  if (Object.prototype.hasOwnProperty.call(builder, 'achievements') && Array.isArray(builder.achievements)) {
    builder.Achievements = builder.achievements;
  }
  if (Object.prototype.hasOwnProperty.call(builder, 'hobbies') && Array.isArray(builder.hobbies)) {
    builder.Hobbies = builder.hobbies;
    builder['Hobbies & Interests'] = builder.hobbies;
    builder.interests = builder.hobbies;
    builder.Interests = builder.hobbies;
    builder.personalInterests = builder.hobbies;
  }
  if (Object.prototype.hasOwnProperty.call(builder, 'languages') && Array.isArray(builder.languages)) {
    builder.Languages = builder.languages;
  }
  if (Object.prototype.hasOwnProperty.call(builder, 'certifications') && Array.isArray(builder.certifications)) {
    builder.Certifications = builder.certifications;
  }
  if (Object.prototype.hasOwnProperty.call(builder, 'experience') && Array.isArray(builder.experience)) {
    builder['Work Experience'] = builder.experience;
    builder.Experience = builder.experience;
  }
  if (Object.prototype.hasOwnProperty.call(builder, 'education') && Array.isArray(builder.education)) {
    builder.Education = builder.education;
  }
  if (Object.prototype.hasOwnProperty.call(builder, 'projects') && Array.isArray(builder.projects)) {
    builder.Projects = builder.projects;
  }
}

export function pruneAndMergeDynamicSections(
  builder: Record<string, unknown>,
  registry: DynamicSectionSpec[] = []
): Record<string, unknown> {
  const next = { ...builder };
  syncCanonicalAliasesForUserEdit(next);
  let extended: ExtendedBuilderSections = {
    ...emptyExtendedBuilderSections(),
    ...(typeof next.extendedSections === 'object' ? (next.extendedSections as ExtendedBuilderSections) : {}),
    personalDetails: {
      ...emptyExtendedBuilderSections().personalDetails,
      ...(typeof next.extendedSections === 'object' ? ((next.extendedSections as ExtendedBuilderSections).personalDetails || {}) : {}),
    },
  };
  for (const spec of registry) {
    const fromExtended = extended[spec.fieldKey];
    const fromTop = next[spec.fieldKey];
    const raw = fromExtended != null && (Array.isArray(fromExtended) ? fromExtended.length > 0 : Boolean(fromExtended)) ? fromExtended : fromTop;
    (extended as Record<string, unknown>)[spec.fieldKey] = sanitizeExtendedField(spec, raw);
  }
  extended.extraSections = sanitizeExtraSections([
    ...extended.extraSections,
    ...(Array.isArray(next.extraSections) ? (next.extraSections as typeof extended.extraSections) : []),
  ]);
  extended.unsupportedSections = (extended.unsupportedSections || []).filter((entry) => {
    const body = String(entry.body || '').trim();
    return hasMeaningfulText(body) && !isPlaceholderContent(body);
  });
  extended = mergeDynamicIntoStandard(next, extended, registry);
  syncExtendedTopLevelFields(next, extended, registry);
  return next;
}
