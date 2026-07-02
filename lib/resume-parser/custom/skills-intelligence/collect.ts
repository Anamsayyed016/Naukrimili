/**
 * Collect skill candidates from all resume sources — never auto-accept.
 */

import { extractTechnologiesFromText } from '../project-extraction/technologies';
import { normalizeSkillAlias } from './aliases';
import type { SkillCandidate, SkillSource, SkillsIntelligenceInput } from './types';

const SKILL_SUBHEADERS = new Set([
  'languages', 'language', 'programming languages', 'programming',
  'frameworks', 'framework', 'libraries', 'library',
  'databases', 'database', 'tools', 'tool', 'platforms',
  'cloud', 'devops', 'concepts', 'methodologies',
  'soft skills', 'technical skills', 'technical', 'expertise',
  'competencies', 'core competencies', 'technology stack', 'technologies',
  'testing', 'design', 'apis', 'protocols', 'skills',
]);

const SOURCE_WEIGHT: Record<SkillSource, number> = {
  skills_section: 1,
  experience: 0.85,
  project: 0.8,
  certification: 0.75,
  education: 0.65,
  summary: 0.55,
};

function pushCandidate(
  out: SkillCandidate[],
  raw: string,
  source: SkillSource
): void {
  const normalized = normalizeSkillAlias(raw);
  if (!normalized || normalized.length < 2) return;
  out.push({ raw: raw.trim(), normalized, source });
}

function splitSkillTokens(line: string): string[] {
  return line
    .split(/[,;|·•\u2022\u2023\u25aa\/]+|\s{2,}/)
    .map((s) => s.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim())
    .filter(Boolean);
}

export function collectFromSkillsSection(sectionText: string): SkillCandidate[] {
  const out: SkillCandidate[] = [];
  if (!sectionText?.trim()) return out;

  const lines = sectionText.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim());

  for (const raw of lines) {
    if (!raw) continue;

    const inline = raw.match(/^([A-Za-z][A-Za-z &/]+?)\s*:\s*(.+)$/);
    if (inline) {
      const header = inline[1].toLowerCase().replace(/\s+/g, ' ').trim();
      if (SKILL_SUBHEADERS.has(header) || /skill|expertise|competenc|technolog/i.test(header)) {
        for (const token of splitSkillTokens(inline[2])) {
          pushCandidate(out, token, 'skills_section');
        }
        continue;
      }
    }

    const normalized = raw.toLowerCase().replace(/[:\-]+$/, '').replace(/\s+/g, ' ').trim();
    if (SKILL_SUBHEADERS.has(normalized)) continue;

    for (const token of splitSkillTokens(raw)) {
      pushCandidate(out, token, 'skills_section');
    }
  }

  return out;
}

export function collectFromTechnologyLists(
  lists: string[][] | undefined,
  source: SkillSource
): SkillCandidate[] {
  const out: SkillCandidate[] = [];
  if (!lists?.length) return out;

  for (const list of lists) {
    for (const tech of list) {
      pushCandidate(out, tech, source);
    }
  }
  return out;
}

export function collectFromTextScan(text: string, source: SkillSource): SkillCandidate[] {
  const out: SkillCandidate[] = [];
  if (!text?.trim()) return out;

  for (const tech of extractTechnologiesFromText(text)) {
    pushCandidate(out, tech, source);
  }

  return out;
}

export function collectFromCertifications(names: string[] | undefined): SkillCandidate[] {
  const out: SkillCandidate[] = [];
  if (!names?.length) return out;

  for (const name of names) {
    for (const tech of extractTechnologiesFromText(name)) {
      pushCandidate(out, tech, 'certification');
    }
    if (name.length <= 40 && /\b(aws|azure|google|pmp|scrum|kubernetes|docker)\b/i.test(name)) {
      pushCandidate(out, name, 'certification');
    }
  }

  return out;
}

export function collectAllSkillCandidates(input: SkillsIntelligenceInput): SkillCandidate[] {
  const all: SkillCandidate[] = [
    ...collectFromSkillsSection(input.skillsSectionText || ''),
    ...collectFromTechnologyLists(input.experienceTechnologies, 'experience'),
    ...collectFromTechnologyLists(input.projectTechnologies, 'project'),
    ...collectFromTextScan(input.summaryText || '', 'summary'),
    ...collectFromTechnologyLists(input.educationCoursework, 'education'),
    ...collectFromCertifications(input.certificationNames),
  ];

  return all;
}

export function getSourceWeight(source: SkillSource): number {
  return SOURCE_WEIGHT[source];
}
