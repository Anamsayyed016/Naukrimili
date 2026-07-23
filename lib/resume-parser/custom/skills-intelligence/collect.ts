/**
 * Collect skill candidates from all resume sources — never auto-accept.
 */

import { extractTechnologiesFromText } from '../project-extraction/technologies';
import {
  isPlausiblePersonName,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import { normalizeSkillAlias } from './aliases';
import { isValidSkillCandidate, MULTI_WORD_SKILL_ALLOW_RE, SOFT_SKILL_SINGLE_RE } from './validate';
import type { SkillCandidate, SkillSource, SkillsIntelligenceInput } from './types';

const SKILL_SUBHEADERS = new Set([
  'programming languages', 'programming language', 'programming',
  'languages', 'language',
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
  const trimmed = raw.trim().replace(/[.:]+$/g, '').trim();
  if (!trimmed || trimmed.length < 2) return;
  if (MULTI_WORD_SKILL_ALLOW_RE.test(trimmed.toLowerCase())) {
    const normalized = normalizeSkillAlias(trimmed);
    if (normalized) out.push({ raw: trimmed, normalized, source });
    return;
  }
  if (SOFT_SKILL_SINGLE_RE.test(trimmed)) {
    const normalized = normalizeSkillAlias(trimmed);
    if (normalized) out.push({ raw: trimmed, normalized, source });
    return;
  }
  // Strengths / competency bullets from an explicit skills section.
  if (
    source === 'skills_section' &&
    trimmed.length <= 90 &&
    trimmed.split(/\s+/).length <= 12 &&
    /[A-Za-z]/.test(trimmed) &&
    !RESPONSIBILITY_LIKE_SKILL_RE.test(trimmed)
  ) {
    const normalized = normalizeSkillAlias(trimmed) || trimmed;
    out.push({ raw: trimmed, normalized, source });
    return;
  }
  if (!isValidSkillCandidate(trimmed)) return;
  const normalized = normalizeSkillAlias(trimmed);
  if (!normalized || normalized.length < 2) return;
  out.push({ raw: trimmed, normalized, source });
}

const RESPONSIBILITY_LIKE_SKILL_RE =
  /\b(?:responsible for|managed|mentored|developed|implemented|designed|delivered|led migration|worked across)\b/i;

function splitSkillTokens(line: string): string[] {
  // Do not split on commas inside parentheses — "Entity Formation (Pvt Ltd, LLP, OPC)"
  // is one skill phrase, not four tokens.
  const parts: string[] = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '(' || ch === '[' || ch === '{') {
      depth += 1;
      buf += ch;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth = Math.max(0, depth - 1);
      buf += ch;
      continue;
    }
    if (depth === 0 && /[,;|·•\u2022\u2023\u25aa]/.test(ch)) {
      const token = buf.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim();
      if (token) parts.push(token);
      buf = '';
      continue;
    }
    if (depth === 0 && /\s{2,}/.test(line.slice(i, i + 2))) {
      const token = buf.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim();
      if (token) parts.push(token);
      buf = '';
      while (i + 1 < line.length && /\s/.test(line[i + 1])) i += 1;
      continue;
    }
    // Slash splits only outside parentheses and when both sides look like short tokens.
    if (depth === 0 && ch === '/') {
      const left = buf.trim();
      const rightPeek = line.slice(i + 1).split(/[,;|]/)[0]?.trim() || '';
      if (left.length <= 24 && rightPeek.length <= 24 && !/\s{2,}/.test(left)) {
        const token = buf.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim();
        if (token) parts.push(token);
        buf = '';
        continue;
      }
    }
    buf += ch;
  }
  const last = buf.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim();
  if (last) parts.push(last);
  return parts.filter(Boolean);
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

    const withoutBullet = raw.replace(/^[\s•●\-–—*·▪○]+\s*/, '').trim();
    const inline = withoutBullet.match(/^([A-Za-z][A-Za-z &/+\-]{1,40}?)\s*:\s*(.+)$/);
    if (inline) {
      const header = inline[1].toLowerCase().replace(/\s+/g, ' ').trim();
      if (SKILL_SUBHEADERS.has(header) || /skill|expertise|competenc|technolog|operations|taxation|banking|software|tools|reporting|compliance/i.test(header)) {
        for (const token of splitSkillTokens(inline[2])) {
          pushCandidate(out, token, 'skills_section');
        }
        continue;
      }
    }

    const normalized = withoutBullet.toLowerCase().replace(/[:\-]+$/, '').replace(/\s+/g, ' ').trim();
    if (SKILL_SUBHEADERS.has(normalized)) continue;
    if (isPlausiblePersonName(withoutBullet)) continue;
    // Job-title shaped lines are skipped unless they look like competency bullets
    // (short Strengths/IT Skills entries often resemble titles).
    const competencyBullet =
      withoutBullet.length <= 90 &&
      withoutBullet.split(/\s+/).length <= 12 &&
      !/\b(?:at|with|for)\s+[A-Z]/.test(withoutBullet) &&
      !/\b(?:19|20)\d{2}\b/.test(withoutBullet);
    if (looksLikeJobTitleLine(withoutBullet) && !withoutBullet.includes(',') && !competencyBullet) {
      continue;
    }

    const afterContact = stripContactNoise(withoutBullet);
    if (!afterContact) continue;

    const tokens = splitSkillTokens(afterContact);
    if (tokens.length >= 2) {
      collectTokensFromLine(withoutBullet, 'skills_section', out);
      continue;
    }

    if (
      !lineLooksSkillList(withoutBullet) &&
      tokens.length < 2 &&
      !/:/.test(withoutBullet)
    ) {
      const single = tokens[0] || afterContact.replace(/[.:]+$/, '').trim();
      if (single && (isValidSkillCandidate(single) || competencyBullet)) {
        pushCandidate(out, single, 'skills_section');
      }
      continue;
    }

    collectTokensFromLine(withoutBullet, 'skills_section', out);
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
    // Skip narrative / summary bullets — they pollute skills with prose fragments.
    if (/^[-–—•·▪‣●○◦✓✔]\s+/.test(line) && (line.split(/\s+/).length > 12 || /[.!?]$/.test(line))) {
      continue;
    }
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

  const crossSectionMining: SkillCandidate[] = [
    ...collectFromTechnologyLists(input.experienceTechnologies, 'experience'),
    ...collectFromTechnologyLists(input.projectTechnologies, 'project'),
    ...(hasRichSkillsSection
      ? []
      : [
          ...(input.experienceTexts || []).flatMap((t) => collectFromTextScan(t, 'experience')),
          ...(input.projectTexts || []).flatMap((t) => collectFromTextScan(t, 'project')),
        ]),
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
