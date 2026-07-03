/**
 * Collect skill candidates from all resume sources — never auto-accept.
 */

import { extractTechnologiesFromText } from '../project-extraction/technologies';
import {
  isPlausiblePersonName,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import { normalizeSkillAlias } from './aliases';
import { isValidSkillCandidate } from './validate';
import type { SkillCandidate, SkillSource, SkillsIntelligenceInput } from './types';

const SKILL_SUBHEADERS = new Set([
  'programming languages', 'programming language', 'programming',
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

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:linkedin|github|gitlab)\.com\/\S+/gi;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;

function pushCandidate(
  out: SkillCandidate[],
  raw: string,
  source: SkillSource
): void {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 2) return;
  if (!isValidSkillCandidate(trimmed)) return;
  const normalized = normalizeSkillAlias(trimmed);
  if (!normalized || normalized.length < 2) return;
  out.push({ raw: trimmed, normalized, source });
}

function splitSkillTokens(line: string): string[] {
  return line
    .split(/[,;|·•\u2022\u2023\u25aa\/]+|\s{2,}/)
    .map((s) => s.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim())
    .filter(Boolean);
}

function stripContactNoise(line: string): string {
  return line
    .replace(EMAIL_RE, ' ')
    .replace(URL_RE, ' ')
    .replace(PHONE_RE, ' ')
    .replace(/\blinkedin\b\.?\s*com\S*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lineLooksSkillList(line: string): boolean {
  const cleaned = stripContactNoise(line);
  if (!cleaned || cleaned.length < 4) return false;
  const tokens = splitSkillTokens(cleaned);
  return tokens.length >= 2 && tokens.every((t) => t.length <= 40);
}

function collectTokensFromLine(line: string, source: SkillSource, out: SkillCandidate[]): void {
  const cleaned = stripContactNoise(line);
  if (!cleaned) return;
  for (const token of splitSkillTokens(cleaned)) {
    pushCandidate(out, token, source);
  }
}

function isSkillTableHeader(cell: string): boolean {
  const lower = cell.toLowerCase().trim();
  return /^(?:skill|skills|technology|technologies|tool|tools|competency|level|proficiency)$/i.test(
    lower
  );
}

function isTableSeparatorRow(line: string): boolean {
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
  return cells.length > 0 && cells.every((c) => /^[-:]+$/.test(c));
}

function collectFromTableRows(lines: string[], source: SkillSource, out: SkillCandidate[]): void {
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!/^\|?.+\|/.test(trimmed)) continue;

    const cells = trimmed
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length < 2) continue;
    if (isTableSeparatorRow(trimmed)) continue;
    if (cells.every((c) => /^[-:]+$/.test(c))) continue;

    const skillCell = isSkillTableHeader(cells[0]) ? cells[1] : cells[0];
    if (!skillCell || isSkillTableHeader(skillCell)) continue;
    pushCandidate(out, skillCell, source);
  }
}

export function collectFromSkillsSection(sectionText: string): SkillCandidate[] {
  const out: SkillCandidate[] = [];
  if (!sectionText?.trim()) return out;

  const lines = sectionText.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim());

  collectFromTableRows(lines, 'skills_section', out);

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
    if (isPlausiblePersonName(raw)) continue;
    if (looksLikeJobTitleLine(raw) && !raw.includes(',')) continue;

    const afterContact = stripContactNoise(raw);
    if (!afterContact) continue;

    const tokens = splitSkillTokens(afterContact);
    if (tokens.length >= 2) {
      collectTokensFromLine(raw, 'skills_section', out);
      continue;
    }

    if (
      !lineLooksSkillList(raw) &&
      tokens.length < 2 &&
      !/:/.test(raw)
    ) {
      continue;
    }

    collectTokensFromLine(raw, 'skills_section', out);
  }

  return out;
}

/** Recover sidebar / preamble comma skill lists when no explicit SKILLS section exists. */
export function collectFromPreambleText(preambleText: string): SkillCandidate[] {
  const out: SkillCandidate[] = [];
  if (!preambleText?.trim()) return out;

  const lines = preambleText.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (/^(skills?|technical\s+skills|core\s+skills|expertise)\s*:?\s*$/i.test(line)) continue;
    if (lineLooksSkillList(line)) {
      collectTokensFromLine(line, 'skills_section', out);
      continue;
    }
    // Mixed contact + skill lines (e.g. email | phone  JavaScript, Node.js)
    const afterContact = stripContactNoise(line);
    if (afterContact.includes(',') && splitSkillTokens(afterContact).length >= 2) {
      collectTokensFromLine(line, 'skills_section', out);
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

export function collectFromEducationTexts(texts: string[] | undefined): SkillCandidate[] {
  const out: SkillCandidate[] = [];
  if (!texts?.length) return out;

  for (const text of texts) {
    if (!text?.trim()) continue;
    for (const tech of extractTechnologiesFromText(text)) {
      pushCandidate(out, tech, 'education');
    }
    const fieldMatch = text.match(
      /\b(?:computer\s+science|information\s+technology|data\s+science|electrical|mechanical|electronics)\b/i
    );
    if (fieldMatch) {
      pushCandidate(out, fieldMatch[0], 'education');
    }
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
  const skillsSection = input.skillsSectionText?.trim() || '';
  const preamble = input.preambleText?.trim() || '';

  const fromSection = collectFromSkillsSection(skillsSection);
  const fromPreamble =
    !skillsSection || fromSection.length < 3 ? collectFromPreambleText(preamble) : [];
  const hasRichSkillsSection = fromSection.length >= 3;

  const crossSectionMining: SkillCandidate[] = hasRichSkillsSection
    ? []
    : [
        ...collectFromTechnologyLists(input.experienceTechnologies, 'experience'),
        ...(input.experienceTexts || []).flatMap((t) => collectFromTextScan(t, 'experience')),
        ...collectFromTechnologyLists(input.projectTechnologies, 'project'),
        ...(input.projectTexts || []).flatMap((t) => collectFromTextScan(t, 'project')),
      ];

  const all: SkillCandidate[] = [
    ...fromSection,
    ...fromPreamble,
    ...crossSectionMining,
    ...collectFromTextScan(input.summaryText || '', 'summary'),
    ...collectFromEducationTexts(input.educationTexts),
    ...collectFromTechnologyLists(input.educationCoursework, 'education'),
    ...collectFromCertifications(input.certificationNames),
  ];

  return all;
}

export function getSourceWeight(source: SkillSource): number {
  return SOURCE_WEIGHT[source];
}
