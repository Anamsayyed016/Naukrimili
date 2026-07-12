/**
 * Dynamic Content Composition Engine
 *
 * Shared by Gallery, Live Preview, Editor preview, and PDF.
 * Reshapes render copies only — never mutates editor formData, templates, or parser output.
 *
 * Responsibilities:
 * - compose readable summaries (paragraph flow)
 * - select/merge experience bullets for visual rhythm
 * - compose project descriptions into concise bullets
 * - cap achievements without hiding sections
 * - proportional content budgets across experience count
 */

import {
  collectExperienceBodyFields,
  dedupeExperienceBodyLines,
  scoreBulletQuality,
} from '@/lib/resume-parser/import-sanitize';
import { splitBullets } from '@/lib/resume-parser/normalize-extracted';

export interface ContentCompositionBudget {
  maxSummaryWords: number;
  maxSummarySentences: number;
  maxBulletsPerExperience: number;
  maxProjects: number;
  maxProjectBullets: number;
  maxAchievements: number;
  maxSkills: number;
  /** Soft mode keeps slightly more content for imported resumes */
  soft: boolean;
}

export interface ResolveCompositionBudgetInput {
  experienceCount: number;
  projectCount: number;
  baseMaxSkills: number;
  baseMaxBullets: number;
  baseMaxProjects: number;
  baseMaxSummaryWords: number;
  soft?: boolean;
}

const LEADING_VERB_GROUPS: Array<{ id: string; pattern: RegExp }> = [
  {
    id: 'leadership',
    pattern:
      /^(led|managed|mentored|supervised|coordinated|directed|spearheaded|oversaw|guided)\b/i,
  },
  {
    id: 'impact',
    pattern:
      /^(increased|reduced|improved|optimized|accelerated|saved|grew|decreased|boosted|cut)\b/i,
  },
  {
    id: 'build',
    pattern:
      /^(implemented|developed|built|created|engineered|delivered|launched|shipped|coded|programmed)\b/i,
  },
  {
    id: 'design',
    pattern: /^(designed|architected|modeled|prototyped|drafted)\b/i,
  },
  {
    id: 'ops',
    pattern:
      /^(configured|deployed|migrated|automated|maintained|monitored|secured|integrated)\b/i,
  },
];

function normalizeWhitespace(text: string): string {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function stripBulletPrefix(line: string): string {
  return String(line || '')
    .replace(/^[\s\u2022\u25aa\u2023*\-–—•·▪‣]+/, '')
    .trim();
}

function leadingVerbGroup(line: string): string {
  const cleaned = stripBulletPrefix(line);
  for (const group of LEADING_VERB_GROUPS) {
    if (group.pattern.test(cleaned)) return group.id;
  }
  return 'other';
}

function tokenizeForSimilarity(line: string): Set<string> {
  return new Set(
    stripBulletPrefix(line)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const left = tokenizeForSimilarity(a);
  const right = tokenizeForSimilarity(b);
  if (left.size === 0 || right.size === 0) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / (left.size + right.size - overlap);
}

/** Merge very short lines, drop accidental breaks, keep sentence flow. */
export function composeParagraph(text: string, maxWords = 120): string {
  const normalized = normalizeWhitespace(text)
    .replace(/\n+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([.!?])\s+/g, '$1 ')
    .trim();
  if (!normalized) return '';

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return normalized;

  const truncated = words.slice(0, maxWords).join(' ');
  const sentenceEnd = truncated.match(/^([\s\S]*[.!?])(?:\s+[^.!?]*)?$/);
  if (sentenceEnd) {
    const sentenceWords = sentenceEnd[1].trim().split(/\s+/).filter(Boolean);
    if (sentenceWords.length >= Math.min(40, Math.floor(maxWords * 0.55))) {
      return sentenceEnd[1].trim();
    }
  }
  return truncated.trim();
}

/** Group sentences into 1–2 clean paragraphs (3–5 sentences target). */
export function composeSummary(
  text: string,
  options?: { maxWords?: number; maxSentences?: number }
): string {
  const maxWords = options?.maxWords ?? 90;
  const maxSentences = options?.maxSentences ?? 5;
  const flat = composeParagraph(text, maxWords * 2);
  if (!flat) return '';

  const sentences = flat
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 20);

  if (sentences.length === 0) {
    return composeParagraph(flat, maxWords);
  }

  const kept = sentences.slice(0, maxSentences);
  // Two short paragraphs when enough sentences; otherwise one flowing paragraph.
  if (kept.length >= 4) {
    const mid = Math.ceil(kept.length / 2);
    const first = kept.slice(0, mid).join(' ');
    const second = kept.slice(mid).join(' ');
    return `${composeParagraph(first, maxWords)}\n\n${composeParagraph(second, Math.max(35, maxWords - 35))}`.trim();
  }

  return composeParagraph(kept.join(' '), maxWords);
}

/**
 * Select strongest bullets, drop near-duplicates, optionally merge short related lines.
 * Never fabricates content — only composes existing lines.
 */
export function composeBulletList(
  bullets: string[],
  maxBullets: number
): string[] {
  const cleaned = bullets
    .map(stripBulletPrefix)
    .map((line) => normalizeWhitespace(line).replace(/\n+/g, ' '))
    .filter((line) => line.length >= 3);

  if (cleaned.length === 0) return [];

  // Drop near-duplicates (keep higher quality / earlier).
  const unique: string[] = [];
  for (const line of cleaned) {
    const duplicate = unique.some((kept) => jaccardSimilarity(kept, line) >= 0.72);
    if (!duplicate) unique.push(line);
  }

  if (unique.length <= 2) return unique.slice(0, Math.max(1, maxBullets));

  // Soft-merge short same-verb bullets before ranking (reduces repetitive walls).
  const merged: string[] = [];
  const used = new Set<number>();
  for (let i = 0; i < unique.length; i++) {
    if (used.has(i)) continue;
    const current = unique[i];
    const group = leadingVerbGroup(current);
    let combined = current;

    if (current.length <= 110 && group !== 'other') {
      for (let j = i + 1; j < unique.length; j++) {
        if (used.has(j)) continue;
        const candidate = unique[j];
        if (leadingVerbGroup(candidate) !== group) continue;
        if (candidate.length > 110) continue;
        if (jaccardSimilarity(current, candidate) < 0.22) continue;
        const joined = `${combined.replace(/[.]*$/, '')}; ${stripBulletPrefix(candidate).replace(/^[a-z]/, (ch) => ch.toLowerCase())}`;
        if (joined.length > 210) continue;
        combined = joined;
        used.add(j);
        break;
      }
    }

    used.add(i);
    merged.push(combined);
  }

  const ranked = merged
    .map((text) => ({ text, score: scoreBulletQuality(text) }))
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  const qualityPool = ranked.filter((entry) => entry.score >= 12);
  const pool = qualityPool.length > 0 ? qualityPool : ranked;
  const keep = Math.max(1, Math.min(maxBullets, pool.length));

  // Preserve original chronological preference among top scores: re-sort by first appearance.
  const selected = pool.slice(0, keep).map((entry) => entry.text);
  const order = new Map(merged.map((line, index) => [line, index]));
  return selected.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function extractBodyBullets(entry: Record<string, unknown>): string[] {
  const body = collectExperienceBodyFields(entry);
  const explicit = body.achievements.map(stripBulletPrefix).filter((line) => line.length >= 3);
  const fromDescription = splitBullets(String(body.description || ''))
    .map(stripBulletPrefix)
    .filter((line) => line.length >= 3);
  const merged = dedupeExperienceBodyLines(body.description, [...explicit, ...fromDescription]);
  return merged.achievements.length > 0 ? merged.achievements : fromDescription;
}

export function composeExperienceDescription(
  experience: Record<string, unknown>,
  maxBullets: number
): Record<string, unknown> {
  const exp = { ...experience };
  const bullets = extractBodyBullets(exp);
  const selected = composeBulletList(bullets, maxBullets);

  if (selected.length === 0) {
    const description = String(exp.description ?? exp.Description ?? '').trim();
    if (!description) return exp;
    return {
      ...exp,
      description: composeParagraph(description, 85),
      Description: composeParagraph(description, 85),
      achievements: [],
      bullets: [],
      bulletPoints: [],
      Achievements: [],
      __renderComposed: true,
    };
  }

  // Clear prose description so HTML emitters don't re-dump the original wall.
  return {
    ...exp,
    achievements: selected,
    bullets: selected,
    bulletPoints: selected,
    Achievements: selected,
    description: '',
    Description: '',
    __renderComposed: true,
  };
}

export function composeProjectDescription(
  project: Record<string, unknown>,
  maxBullets: number
): Record<string, unknown> {
  const item = { ...project };
  const bullets = extractBodyBullets(item);
  const selected = composeBulletList(bullets, maxBullets);

  if (selected.length === 0) {
    const description = String(
      item.description ?? item.Description ?? item.summary ?? item.Summary ?? ''
    ).trim();
    if (!description) return item;
    const asBullets = composeBulletList(splitBullets(description), maxBullets);
    if (asBullets.length > 0) {
      return {
        ...item,
        achievements: asBullets,
        bullets: asBullets,
        description: asBullets.join('\n'),
        Description: asBullets.join('\n'),
        __renderComposed: true,
      };
    }
    const shortened = composeParagraph(description, 70);
    return {
      ...item,
      description: shortened,
      Description: shortened,
      summary: shortened,
      Summary: shortened,
      __renderComposed: true,
    };
  }

  return {
    ...item,
    achievements: selected,
    bullets: selected,
    description: selected.join('\n'),
    Description: selected.join('\n'),
    __renderComposed: true,
  };
}

function composeAchievementItem(
  item: string | Record<string, unknown>
): string | Record<string, unknown> {
  if (typeof item === 'string') {
    return composeParagraph(item, 28);
  }
  if (!item || typeof item !== 'object') return item;
  const rec = { ...item };
  const title = String(rec.title ?? rec.Title ?? '').trim();
  const description = String(rec.description ?? rec.Description ?? '').trim();
  if (title) {
    rec.title = composeParagraph(title, 22);
    rec.Title = rec.title;
  }
  if (description) {
    rec.description = composeParagraph(description, 36);
    rec.Description = rec.description;
  }
  return rec;
}

/**
 * Dynamic budget: more experiences → fewer bullets each.
 * Soft mode (imports) keeps slightly more while still composing.
 */
export function resolveContentCompositionBudget(
  input: ResolveCompositionBudgetInput
): ContentCompositionBudget {
  const soft = input.soft === true;
  const experienceCount = Math.max(0, input.experienceCount);
  const projectCount = Math.max(0, input.projectCount);

  let maxBullets = input.baseMaxBullets;
  if (experienceCount <= 1) maxBullets = soft ? 8 : 7;
  else if (experienceCount === 2) maxBullets = soft ? 7 : 6;
  else if (experienceCount <= 4) maxBullets = soft ? 6 : 5;
  else if (experienceCount <= 6) maxBullets = soft ? 5 : 4;
  else maxBullets = soft ? 4 : 3;

  maxBullets = Math.min(8, Math.max(3, maxBullets));

  let maxProjects = Math.min(input.baseMaxProjects, soft ? 5 : 4);
  if (experienceCount >= 5) maxProjects = Math.min(maxProjects, soft ? 4 : 3);
  if (projectCount > 0) maxProjects = Math.max(1, maxProjects); // never starve projects entirely when present

  let maxSummaryWords = input.baseMaxSummaryWords;
  if (experienceCount >= 5) maxSummaryWords = Math.min(maxSummaryWords, soft ? 80 : 70);
  if (soft) maxSummaryWords = Math.max(maxSummaryWords, 75);

  return {
    maxSummaryWords,
    maxSummarySentences: soft ? 5 : 4,
    maxBulletsPerExperience: maxBullets,
    maxProjects,
    maxProjectBullets: soft ? 4 : 3,
    maxAchievements: soft ? 5 : 4,
    maxSkills: input.baseMaxSkills,
    soft,
  };
}

function scoreProject(project: Record<string, unknown>): number {
  const name = String(project.name ?? project.Name ?? project.title ?? project.Title ?? '').trim();
  const description = String(
    project.description ?? project.Description ?? project.summary ?? ''
  ).trim();
  let score = name ? 40 : 0;
  if (description) score += Math.min(30, description.length / 8);
  if (/\d+[%xX]?|\$\d|₹/.test(`${name} ${description}`)) score += 20;
  return score;
}

/**
 * Compose a full render copy. Editor formData must remain untouched by the caller.
 */
export function composeResumeDataForRender(
  formData: Record<string, unknown>,
  budget: ContentCompositionBudget
): Record<string, unknown> {
  const experienceSource = Array.isArray(formData.experience) ? formData.experience : [];
  const experience = experienceSource.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw as Record<string, unknown>;
    return composeExperienceDescription(
      raw as Record<string, unknown>,
      budget.maxBulletsPerExperience
    );
  });

  const projectsSource = Array.isArray(formData.projects) ? formData.projects : [];
  let projects = projectsSource.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    return composeProjectDescription(raw as Record<string, unknown>, budget.maxProjectBullets);
  });

  if (projects.length > budget.maxProjects) {
    projects = [...projects]
      .map((item, index) => ({
        item,
        index,
        score:
          item && typeof item === 'object'
            ? scoreProject(item as Record<string, unknown>)
            : 0,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, budget.maxProjects)
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.item);
  }

  const achievementsSource = Array.isArray(formData.achievements) ? formData.achievements : [];
  const achievements = achievementsSource
    .map((item) => composeAchievementItem(item as string | Record<string, unknown>))
    .filter((item) => {
      if (typeof item === 'string') return item.trim().length > 0;
      if (!item || typeof item !== 'object') return false;
      const rec = item as Record<string, unknown>;
      return Boolean(String(rec.title ?? rec.Title ?? rec.description ?? '').trim());
    })
    .slice(0, budget.maxAchievements);

  const summary = composeSummary(
    String(
      formData.summary ||
        formData.professionalSummary ||
        formData['Professional Summary'] ||
        formData['Career Objective'] ||
        formData.Objective ||
        ''
    ),
    {
      maxWords: budget.maxSummaryWords,
      maxSentences: budget.maxSummarySentences,
    }
  );

  const composed: Record<string, unknown> = {
    ...formData,
    experience,
    projects,
    achievements,
    Experience: experience,
    'Work Experience': experience,
    Projects: projects,
    Achievements: achievements,
    __contentComposed: true,
  };

  if (summary) {
    composed.summary = summary;
    composed.professionalSummary = summary;
    composed['Professional Summary'] = summary;
  }

  return composed;
}
