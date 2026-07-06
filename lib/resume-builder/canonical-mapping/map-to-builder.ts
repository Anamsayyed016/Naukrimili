/**
 * Map validated canonical nodes onto Builder form fields.
 */

import { sanitizeFieldText, sanitizeExperienceCompanyValue, preferWholeExperienceField, sanitizePersonName, isValidatedContactName } from '@/lib/resume-parser/import-sanitize';
import { bestNodeValue, findNodes } from './ingest';
import type { CanonicalFieldNode, CanonicalNodeType } from './types';

function hasText(value: unknown): boolean {
  return sanitizeFieldText(value, 4000).length > 0;
}

function setIfEmpty(target: Record<string, unknown>, key: string, value: string): boolean {
  if (!value || hasText(target[key])) return false;
  target[key] = value;
  return true;
}

function buildExperienceFromNodes(
  nodes: CanonicalFieldNode[],
  existing: unknown[]
): Record<string, unknown>[] {
  const parents = findNodes(nodes, { types: ['EXPERIENCE'] }).sort(
    (a, b) => a.position - b.position
  );
  const existingList = Array.isArray(existing)
    ? existing.filter((e) => e && typeof e === 'object') as Record<string, unknown>[]
    : [];

  const count = Math.max(parents.length, existingList.length);
  return Array.from({ length: count }, (_, index) => {
    const base = { ...(existingList[index] || {}) } as Record<string, unknown>;
    const parent = parents[index];
    if (!parent) return base;

    const company = sanitizeExperienceCompanyValue(
      bestNodeValue(nodes, ['COMPANY', 'ORGANIZATION', 'EMPLOYER'], parent.id) ||
        String(base.company || '')
    );
    const title = preferWholeExperienceField(
      base.title || base.position || base.designation,
      bestNodeValue(nodes, ['JOB_TITLE'], parent.id)
    );
    const location =
      bestNodeValue(nodes, ['LOCATION', 'ADDRESS'], parent.id) || String(base.location || '');
    const description =
      bestNodeValue(nodes, ['RESPONSIBILITY'], parent.id) ||
      String(base.description || '');
    const achievements = findNodes(nodes, {
      types: ['ACHIEVEMENT'],
      parent: parent.id,
    }).map((n) => n.value);
    const startDate =
      findNodes(nodes, { parent: parent.id }).find((n) => n.source.includes('startDate'))?.value ||
      String(base.startDate || '');
    const endDate =
      findNodes(nodes, { parent: parent.id }).find((n) => n.source.includes('endDate'))?.value ||
      String(base.endDate || '');

    const existingId =
      typeof base._id === 'string' && base._id.trim() ? base._id.trim() : '';
    const entryId =
      existingId ||
      `exp_${index}_${parent.id.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`;

    return {
      ...base,
      _id: entryId,
      company,
      Company: company,
      title,
      position: title,
      designation: title,
      location,
      Location: location,
      description,
      Description: description,
      achievements: achievements.length ? achievements : base.achievements || [],
      bullets: achievements.length ? achievements : base.bullets || [],
      startDate,
      endDate,
      current: base.current === true,
    };
  });
}

function buildStringListFromNodes(
  nodes: CanonicalFieldNode[],
  types: CanonicalNodeType[],
  existing: unknown[]
): string[] {
  const fromNodes = findNodes(nodes, { types }).map((n) => n.value);
  const fromExisting = Array.isArray(existing)
    ? existing.map((x) => (typeof x === 'string' ? x : String((x as { name?: string })?.name ?? ''))).filter(Boolean)
    : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of [...fromExisting, ...fromNodes]) {
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function setValidatedIdentity(
  target: Record<string, unknown>,
  key: string,
  value: string,
  locationHint = ''
): boolean {
  const v = sanitizePersonName(value, 120);
  if (!v || !isValidatedContactName(v, locationHint)) return false;
  if (hasText(target[key])) return false;
  target[key] = v;
  return true;
}

export function mapCanonicalNodesToBuilder(
  nodes: CanonicalFieldNode[],
  builderDraft: Record<string, unknown>
): { builder: Record<string, unknown>; matched: string[] } {
  const builder = { ...builderDraft };
  const matched: string[] = [];
  const locationHint = String(builder.location || builder.address || '');

  const identityMap: Array<{ key: string; types: CanonicalNodeType[] }> = [
    { key: 'fullName', types: ['PERSON_NAME'] },
    { key: 'email', types: ['EMAIL'] },
    { key: 'phone', types: ['PHONE'] },
    { key: 'location', types: ['LOCATION', 'ADDRESS'] },
    { key: 'linkedin', types: ['LINKEDIN'] },
    { key: 'portfolio', types: ['PORTFOLIO'] },
    { key: 'github', types: ['GITHUB'] },
    { key: 'summary', types: ['SUMMARY', 'OBJECTIVE', 'PROFILE'] },
    { key: 'jobTitle', types: ['JOB_TITLE'] },
  ];

  for (const { key, types } of identityMap) {
    if (key === 'fullName') {
      const value = bestNodeValue(nodes, types);
      if (setValidatedIdentity(builder, key, value, locationHint)) matched.push(`identity:${key}`);
      continue;
    }
    const value = bestNodeValue(nodes, types);
    if (setIfEmpty(builder, key, value)) matched.push(`identity:${key}`);
  }

  const nameNode = bestNodeValue(nodes, ['PERSON_NAME']);
  const safeName = sanitizePersonName(nameNode, 120);
  if (safeName && isValidatedContactName(safeName, locationHint) && !hasText(builder.firstName)) {
    const parts = safeName.split(/\s+/);
    if (parts.length >= 2) {
      builder.firstName = parts[0];
      builder.lastName = parts.slice(1).join(' ');
      builder.name = safeName;
      matched.push('identity:name-split');
    }
  }

  const experience = buildExperienceFromNodes(nodes, builder.experience as unknown[]);
  if (experience.length > 0) {
    builder.experience = experience;
    builder['Work Experience'] = experience;
    builder.Experience = experience;
    matched.push(`experience:${experience.length}`);
  }

  const skills = buildStringListFromNodes(nodes, ['TECHNICAL_SKILL', 'CORE_SKILL', 'SOFT_SKILL'], builder.skills as unknown[]);
  if (skills.length > 0) {
    builder.skills = skills;
    builder.Skills = skills;
    matched.push(`skills:${skills.length}`);
  }

  const achievements = buildStringListFromNodes(nodes, ['ACHIEVEMENT'], builder.achievements as unknown[]);
  if (achievements.length > 0) {
    builder.achievements = achievements;
    builder.Achievements = achievements;
    matched.push(`achievements:${achievements.length}`);
  }

  const hobbies = buildStringListFromNodes(nodes, ['HOBBY', 'INTEREST'], builder.hobbies as unknown[]);
  if (hobbies.length > 0) {
    builder.hobbies = hobbies;
    builder.Hobbies = hobbies;
    matched.push(`hobbies:${hobbies.length}`);
  }

  const langParents = nodes
    .filter((n) => n.type === 'LANGUAGE' && /^languages\[\d+\]$/.test(n.source))
    .sort((a, b) => a.position - b.position);
  if (langParents.length > 0) {
    const existingLangs = Array.isArray(builder.languages) ? builder.languages : [];
    const built = langParents.map((parent, index) => {
      const base =
        existingLangs[index] && typeof existingLangs[index] === 'object'
          ? (existingLangs[index] as Record<string, unknown>)
          : {};
      const name = parent.value || String(base.language || base.name || '');
      const profNode = nodes.find(
        (n) =>
          n.parent === parent.id &&
          /\.(proficiency|level|fluency)/i.test(n.source)
      );
      const proficiency =
        profNode?.value ||
        String(base.proficiency || base.level || '').trim() ||
        'Fluent';
      return { name, language: name, proficiency };
    });
    const merged = [...built];
    if (existingLangs.length > built.length) {
      merged.push(...existingLangs.slice(built.length));
    }
    builder.languages = merged;
    builder.Languages = merged;
    matched.push(`languages:${merged.length}`);
  }

  if (builder.summary) {
    builder.bio = builder.summary;
    builder.objective = builder.summary;
  }

  return { builder, matched };
}
