/**
 * Ingest parser / upload profile into canonical field nodes.
 */

import { sanitizeFieldText } from '@/lib/resume-parser/import-sanitize';
import { inferNodeTypeFromKey } from './dictionary';
import type { CanonicalFieldNode, CanonicalNodeType } from './types';
import {
  classifySectionHeading,
  STANDARD_PROFILE_KEYS,
} from '@/lib/resume-builder/semantic-registry';
import { splitBullets } from '@/lib/resume-parser/normalize-extracted';

let _nodeCounter = 0;

function nextId(prefix: string): string {
  _nodeCounter += 1;
  return `${prefix}-${_nodeCounter}`;
}

function scalarNode(
  type: CanonicalNodeType,
  value: string,
  section: string,
  source: string,
  position: number,
  confidence = 75,
  parent?: string
): CanonicalFieldNode | null {
  const v = sanitizeFieldText(value, 4000);
  if (!v) return null;
  return {
    id: nextId(type.toLowerCase()),
    type,
    value: v,
    confidence,
    section,
    position,
    parent,
    source,
  };
}

function pickPrimaryType(types: CanonicalNodeType[], section: string): CanonicalNodeType {
  if (types.length === 0) return 'UNKNOWN';
  if (section.includes('experience') && types.includes('JOB_TITLE')) return 'JOB_TITLE';
  if (section.includes('project') && types.includes('PROJECT')) return 'PROJECT';
  return types[0];
}

function ingestObject(
  obj: Record<string, unknown>,
  section: string,
  parentId?: string,
  position = 0
): CanonicalFieldNode[] {
  const nodes: CanonicalFieldNode[] = [];
  for (const [key, raw] of Object.entries(obj)) {
    if (raw == null) continue;
    if (Array.isArray(raw)) continue;
    if (typeof raw === 'object') continue;
    const types = inferNodeTypeFromKey(key, section);
    const type = pickPrimaryType(types, section);
    const node = scalarNode(type, String(raw), section, `${section}.${key}`, position, 80, parentId);
    if (node) nodes.push(node);
  }
  return nodes;
}

function ingestStringList(
  items: unknown[],
  type: CanonicalNodeType,
  section: string,
  sourcePrefix: string
): CanonicalFieldNode[] {
  const nodes: CanonicalFieldNode[] = [];
  items.forEach((item, index) => {
    const value = typeof item === 'string' ? item : String((item as { name?: string })?.name ?? item ?? '');
    const node = scalarNode(type, value, section, `${sourcePrefix}[${index}]`, index, 78);
    if (node) nodes.push(node);
  });
  return nodes;
}

function ingestExperienceEntries(experience: unknown[]): CanonicalFieldNode[] {
  const nodes: CanonicalFieldNode[] = [];
  experience.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const rec = entry as Record<string, unknown>;
    const parentId = nextId('experience');
    nodes.push({
      id: parentId,
      type: 'EXPERIENCE',
      value: `experience-${index}`,
      confidence: 85,
      section: 'experience',
      position: index,
      source: `experience[${index}]`,
    });

    nodes.push(...ingestObject(rec, `experience[${index}]`, parentId, index));

    const achievements = Array.isArray(rec.achievements) ? rec.achievements : [];
    nodes.push(
      ...ingestStringList(
        achievements,
        'ACHIEVEMENT',
        `experience[${index}].achievements`,
        `experience[${index}].achievements`
      ).map((n) => ({ ...n, parent: parentId }))
    );

    const bullets = Array.isArray(rec.bullets) ? rec.bullets : [];
    if (bullets.length > 0 && achievements.length === 0) {
      nodes.push(
        ...ingestStringList(
          bullets,
          'RESPONSIBILITY',
          `experience[${index}].bullets`,
          `experience[${index}].bullets`
        ).map((n) => ({ ...n, parent: parentId }))
      );
    }
  });
  return nodes;
}

function ingestEducationEntries(education: unknown[]): CanonicalFieldNode[] {
  const nodes: CanonicalFieldNode[] = [];
  education.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const parentId = nextId('education');
    nodes.push({
      id: parentId,
      type: 'EDUCATION',
      value: `education-${index}`,
      confidence: 85,
      section: 'education',
      position: index,
      source: `education[${index}]`,
    });
    nodes.push(...ingestObject(entry as Record<string, unknown>, `education[${index}]`, parentId, index));
  });
  return nodes;
}

function ingestProjectEntries(projects: unknown[]): CanonicalFieldNode[] {
  const nodes: CanonicalFieldNode[] = [];
  projects.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const parentId = nextId('project');
    nodes.push({
      id: parentId,
      type: 'PROJECT',
      value: String((entry as { name?: string }).name || (entry as { title?: string }).title || `project-${index}`),
      confidence: 82,
      section: 'projects',
      position: index,
      source: `projects[${index}]`,
    });
    nodes.push(...ingestObject(entry as Record<string, unknown>, `projects[${index}]`, parentId, index));
    const tech = (entry as { technologies?: unknown }).technologies;
    if (Array.isArray(tech)) {
      nodes.push(
        ...ingestStringList(
          tech,
          'TOOLS',
          `projects[${index}].technologies`,
          `projects[${index}].technologies`
        ).map((n) => ({ ...n, parent: parentId }))
      );
    }
  });
  return nodes;
}

function ingestCertificationEntries(certs: unknown[]): CanonicalFieldNode[] {
  const nodes: CanonicalFieldNode[] = [];
  certs.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const parentId = nextId('certification');
    nodes.push({
      id: parentId,
      type: 'CERTIFICATION',
      value: String((entry as { name?: string }).name || `cert-${index}`),
      confidence: 82,
      section: 'certifications',
      position: index,
      source: `certifications[${index}]`,
    });
    nodes.push(...ingestObject(entry as Record<string, unknown>, `certifications[${index}]`, parentId, index));
  });
  return nodes;
}

function ingestLanguageEntries(languages: unknown[]): CanonicalFieldNode[] {
  const nodes: CanonicalFieldNode[] = [];
  languages.forEach((entry, index) => {
    if (typeof entry === 'string') {
      const node = scalarNode('LANGUAGE', entry, 'languages', `languages[${index}]`, index, 80);
      if (node) nodes.push(node);
      return;
    }
    if (!entry || typeof entry !== 'object') return;
    const rec = entry as Record<string, unknown>;
    const name = String(rec.name || rec.language || rec.Language || '');
    const parentId = nextId('language');
    nodes.push({
      id: parentId,
      type: 'LANGUAGE',
      value: name,
      confidence: 80,
      section: 'languages',
      position: index,
      source: `languages[${index}]`,
    });
    nodes.push(...ingestObject(rec, `languages[${index}]`, parentId, index));
  });
  return nodes;
}

const IDENTITY_KEYS = [
  'fullName',
  'name',
  'firstName',
  'lastName',
  'email',
  'phone',
  'location',
  'address',
  'linkedin',
  'portfolio',
  'github',
  'headline',
  'jobTitle',
  'designation',
];

const SUMMARY_KEYS = [
  'summary',
  'bio',
  'objective',
  'professionalSummary',
  'executiveSummary',
  'careerSummary',
  'aboutMe',
];

function ingestSemanticSectionBlock(
  nodes: CanonicalFieldNode[],
  heading: string,
  body: string,
  sourcePrefix: string,
  position: number
): void {
  const classified = classifySectionHeading(heading);
  const sectionId = nextId('semantic');
  const headingNode: CanonicalFieldNode = {
    id: sectionId,
    type: 'SEMANTIC_SECTION',
    value: heading,
    confidence: classified?.confidence ?? 65,
    section: classified?.definition.id ?? 'semantic',
    position,
    source: `${sourcePrefix}.heading`,
  };
  nodes.push(headingNode);

  const lines = splitBullets(body)
    .map((l) => l.replace(/^[\s\-–—*•·]+/, '').trim())
    .filter((l) => l.length >= 2);

  const primaryType: CanonicalNodeType =
    classified?.definition.nodeTypes[0] ?? 'UNKNOWN';

  if (lines.length === 0 && body.trim()) {
    const node = scalarNode(primaryType, body.trim(), headingNode.section, `${sourcePrefix}.body`, position, 72, sectionId);
    if (node) nodes.push(node);
    return;
  }

  lines.forEach((line, i) => {
    const node = scalarNode(primaryType, line, headingNode.section, `${sourcePrefix}.body[${i}]`, i, 74, sectionId);
    if (node) nodes.push(node);
  });
}

function ingestSemanticProfileSections(
  profile: Record<string, unknown>,
  nodes: CanonicalFieldNode[]
): void {
  const topLevelArrays: Array<{ keys: string[]; type: CanonicalNodeType }> = [
    { keys: ['references'], type: 'REFERENCE' },
    { keys: ['training', 'trainings'], type: 'TRAINING' },
    { keys: ['internships'], type: 'INTERNSHIP' },
    { keys: ['strengths'], type: 'STRENGTH' },
    { keys: ['professionalHighlights', 'careerHighlights'], type: 'ACHIEVEMENT' },
    { keys: ['professionalQualifications'], type: 'CERTIFICATION' },
    { keys: ['coreCompetencies'], type: 'CORE_SKILL' },
    { keys: ['softSkills'], type: 'SOFT_SKILL' },
    { keys: ['technicalSkills'], type: 'TECHNICAL_SKILL' },
    { keys: ['industryExpertise'], type: 'INDUSTRY_EXPERTISE' },
    { keys: ['seminars'], type: 'TRAINING' },
    { keys: ['memberships'], type: 'MEMBERSHIP' },
    { keys: ['research'], type: 'RESEARCH' },
    { keys: ['publications'], type: 'PUBLICATION' },
    { keys: ['patents'], type: 'PATENT' },
    { keys: ['volunteer', 'volunteerWork'], type: 'VOLUNTEER' },
  ];

  for (const { keys, type } of topLevelArrays) {
    for (const key of keys) {
      const raw = profile[key];
      if (!Array.isArray(raw)) continue;
      nodes.push(...ingestStringList(raw, type, key, key));
    }
  }

  if (typeof profile.declaration === 'string' && profile.declaration.trim()) {
    const node = scalarNode('DECLARATION', profile.declaration, 'declaration', 'declaration', nodes.length, 80);
    if (node) nodes.push(node);
  }

  let semanticIndex = 0;
  for (const [key, raw] of Object.entries(profile)) {
    if (STANDARD_PROFILE_KEYS.has(key)) continue;
    if (raw == null) continue;

    if (typeof raw === 'string' && raw.trim()) {
      ingestSemanticSectionBlock(nodes, key, raw, `profile.${key}`, semanticIndex++);
      continue;
    }

    if (Array.isArray(raw)) {
      const classified = classifySectionHeading(key);
      if (classified) {
        const body = raw
          .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
          .join('\n');
        ingestSemanticSectionBlock(nodes, classified.definition.label, body, `profile.${key}`, semanticIndex++);
      }
    }
  }

  const customSections = profile.customSections;
  if (Array.isArray(customSections)) {
    for (let i = 0; i < customSections.length; i++) {
      const block = customSections[i];
      if (!block || typeof block !== 'object') continue;
      const rec = block as { rawHeading?: string; heading?: string; content?: string; body?: string };
      const heading = String(rec.rawHeading || rec.heading || `Section ${i + 1}`);
      const body = String(rec.content || rec.body || '');
      ingestSemanticSectionBlock(nodes, heading, body, `customSections[${i}]`, semanticIndex++);
    }
  }
}

export function ingestCanonicalNodes(profile: Record<string, unknown>): CanonicalFieldNode[] {
  _nodeCounter = 0;
  const nodes: CanonicalFieldNode[] = [];

  for (const key of IDENTITY_KEYS) {
    if (profile[key] == null) continue;
    const types = inferNodeTypeFromKey(key, 'identity');
    const node = scalarNode(
      pickPrimaryType(types, 'identity'),
      String(profile[key]),
      'identity',
      `identity.${key}`,
      nodes.length,
      85
    );
    if (node) nodes.push(node);
  }

  for (const key of SUMMARY_KEYS) {
    if (!profile[key]) continue;
    const node = scalarNode('SUMMARY', String(profile[key]), 'summary', `summary.${key}`, nodes.length, 82);
    if (node) nodes.push(node);
  }

  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  nodes.push(...ingestStringList(skills, 'TECHNICAL_SKILL', 'skills', 'skills'));

  const experience = Array.isArray(profile.experience)
    ? profile.experience
    : Array.isArray(profile['Work Experience'])
      ? profile['Work Experience']
      : [];
  nodes.push(...ingestExperienceEntries(experience));

  const education = Array.isArray(profile.education) ? profile.education : [];
  nodes.push(...ingestEducationEntries(education));

  const projects = Array.isArray(profile.projects) ? profile.projects : [];
  nodes.push(...ingestProjectEntries(projects));

  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  nodes.push(...ingestCertificationEntries(certifications));

  const languages = Array.isArray(profile.languages) ? profile.languages : [];
  nodes.push(...ingestLanguageEntries(languages));

  const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
  nodes.push(...ingestStringList(achievements, 'ACHIEVEMENT', 'achievements', 'achievements'));

  const hobbies = Array.isArray(profile.hobbies)
    ? profile.hobbies
    : Array.isArray(profile.interests)
      ? profile.interests
      : [];
  nodes.push(...ingestStringList(hobbies, 'HOBBY', 'hobbies', 'hobbies'));

  const awards = Array.isArray(profile.awards) ? profile.awards : [];
  nodes.push(...ingestStringList(awards, 'AWARD', 'awards', 'awards'));

  const additional = profile.additionalResumeData;
  if (additional && typeof additional === 'object') {
    const add = additional as Record<string, unknown>;
    for (const [key, raw] of Object.entries(add)) {
      if (!Array.isArray(raw)) continue;
      const section = `additional.${key}`;
      if (key === 'publications') {
        nodes.push(...ingestStringList(raw, 'PUBLICATION', section, section));
      } else if (key === 'patents') {
        nodes.push(...ingestStringList(raw, 'PATENT', section, section));
      } else if (key === 'volunteerWork') {
        nodes.push(...ingestStringList(raw, 'VOLUNTEER', section, section));
      } else if (key === 'memberships') {
        nodes.push(...ingestStringList(raw, 'MEMBERSHIP', section, section));
      } else if (key === 'achievements') {
        nodes.push(...ingestStringList(raw, 'ACHIEVEMENT', section, section));
      } else if (key === 'awards') {
        nodes.push(...ingestStringList(raw, 'AWARD', section, section));
      } else if (key === 'references') {
        for (let i = 0; i < raw.length; i++) {
          const item = raw[i];
          if (typeof item === 'string') {
            const node = scalarNode('REFERENCE', item, section, `${section}[${i}]`, i, 75);
            if (node) nodes.push(node);
          } else if (item && typeof item === 'object') {
            const parentId = nextId('reference');
            nodes.push({
              id: parentId,
              type: 'REFERENCE',
              value: String((item as { name?: string }).name || `reference-${i}`),
              confidence: 75,
              section,
              position: i,
              source: `${section}[${i}]`,
            });
            nodes.push(
              ...ingestObject(item as Record<string, unknown>, `${section}[${i}]`, parentId, i)
            );
          }
        }
      }
    }
  }

  ingestSemanticProfileSections(profile, nodes);

  return nodes;
}

export function findNodes(
  nodes: CanonicalFieldNode[],
  filter: {
    types?: CanonicalNodeType[];
    parent?: string;
    section?: string;
  }
): CanonicalFieldNode[] {
  return nodes.filter((n) => {
    if (filter.types && !filter.types.includes(n.type)) return false;
    if (filter.parent && n.parent !== filter.parent) return false;
    if (filter.section && !n.section.includes(filter.section)) return false;
    return true;
  });
}

export function bestNodeValue(
  nodes: CanonicalFieldNode[],
  types: CanonicalNodeType[],
  parent?: string
): string {
  const candidates = findNodes(nodes, { types, parent }).sort(
    (a, b) => b.confidence - a.confidence || b.value.length - a.value.length
  );
  return candidates[0]?.value || '';
}
