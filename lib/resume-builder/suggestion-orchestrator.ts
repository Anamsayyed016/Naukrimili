/**
 * Lightweight resume-builder suggestion orchestration (no parallel AI engine).
 * Used by form-suggestions API + hybrid services for routing, dedupe, cache keys, and safe fallbacks.
 */

import {
  getProjectNameSuggestions,
  getProjectDescriptionSuggestions,
  getProjectTechnologySuggestions,
} from '@/lib/resume-builder/project-aware-suggestions';

export const SUGGESTION_LIMIT_DEFAULT = 6;
export const SUGGESTION_LIMIT_SUMMARY = 8;

const JOB_POSTING_PATTERNS = [
  /\bwe are seeking\b/i,
  /\bjoin (our|the) team\b/i,
  /\bwe are hiring\b/i,
  /\blooking for a talented\b/i,
  /\bwe are looking for someone\b/i,
  /\bthis role offers\b/i,
  /\bcompetitive salary\b/i,
  /\bapply now\b/i,
];

const VARIATION_TONES = [
  'ATS-optimized with measurable outcomes',
  'concise recruiter-friendly professional tone',
  'achievement-focused with metrics and impact',
  'technical depth emphasizing stack and architecture',
  'leadership and cross-functional collaboration',
  'results-driven with business outcomes',
] as const;

export function isJobPostingText(text: string): boolean {
  const t = text.trim();
  if (t.length < 20) return false;
  return JOB_POSTING_PATTERNS.some((p) => p.test(t));
}

export function normalizeForCompare(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function dedupeSuggestions(
  suggestions: string[],
  exclude: string[] = [],
  max = SUGGESTION_LIMIT_DEFAULT
): string[] {
  const seen = new Set<string>();
  const excludeNorm = new Set(exclude.map(normalizeForCompare).filter(Boolean));
  const out: string[] = [];

  for (const raw of suggestions) {
    const s = String(raw || '').trim();
    if (!s || s.length < 2) continue;
    const norm = normalizeForCompare(s);
    if (!norm || seen.has(norm) || excludeNorm.has(norm)) continue;
    if (isJobPostingText(s) && !norm.includes('developed') && !norm.includes('built')) continue;
    seen.add(norm);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

export function getVariationTone(regenerateIndex = 0): string {
  return VARIATION_TONES[regenerateIndex % VARIATION_TONES.length];
}

const GENERIC_PATTERNS = [
  /^experienced professional with strong/i,
  /^results[- ]driven professional/i,
  /^passionate developer/i,
  /^motivated individual/i,
  /^dedicated and passionate/i,
  /^add more details to get/i,
  /^try typing at least/i,
];

export function rotatePool<T>(pool: T[], startIndex: number, count: number): T[] {
  if (!pool.length) return [];
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(startIndex + i) % pool.length]);
  }
  return out;
}

export function scoreSuggestionQuality(
  field: string,
  text: string,
  context: Record<string, unknown>
): number {
  const t = text.trim();
  if (!t || t.length < 8) return 0;
  let score = 50;

  if (isJobPostingText(t)) return 0;
  if (GENERIC_PATTERNS.some((p) => p.test(t))) score -= 35;

  const role = String(context.role || context.jobTitle || '').toLowerCase();
  const skills = (context.skills as string[]) || [];
  const jdSkills = (context.jdSkills as string[]) || [];
  const jdKw = (context.extractedJDKeywords as string[]) || [];
  const projectName = String(context.currentProjectName || context.projectName || '').toLowerCase();
  const userInput = String(context.userInput || '').toLowerCase();

  const haystack = `${role} ${skills.join(' ')} ${jdSkills.join(' ')} ${jdKw.join(' ')} ${projectName} ${userInput}`;

  if (role && t.toLowerCase().includes(role.split(' ')[0])) score += 8;
  for (const skill of [...skills, ...jdSkills].slice(0, 8)) {
    if (skill && t.toLowerCase().includes(skill.toLowerCase())) score += 6;
  }
  if (projectName && /portal|job|hire|recruit|ats|resume/i.test(projectName)) {
    if (/recruit|ats|resume|hiring|candidate|employer|job seek/i.test(t)) score += 12;
    if (/sales forecast|customer segment|data analytics dashboard/i.test(t)) score -= 25;
  }
  if (field === 'summary' && t.length >= 80 && t.length <= 600) score += 10;
  if ((field === 'title' || field === 'jobTitle') && t.length >= 5 && t.length <= 80) score += 20;
  if ((field === 'experience' || field === 'bullet') && /^\s*[•\-]?\s*\w+ed\b/i.test(t)) score += 8;
  if (/\d+%|\d+\+|\d{1,2}k\+?/i.test(t)) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function rankSuggestionsByQuality(
  field: string,
  suggestions: string[],
  context: Record<string, unknown>
): string[] {
  return [...suggestions]
    .map((s) => ({ s, score: scoreSuggestionQuality(field, s, context) }))
    .filter((x) => x.score >= 25)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}

export function buildSuggestionCacheFingerprint(
  field: string,
  value: string,
  context: Record<string, unknown>
): string {
  const skills = Array.isArray(context.skills)
    ? (context.skills as string[]).slice(0, 8).join('|')
    : '';
  const jd = String(context.jobDescription || '').slice(0, 80).toLowerCase();
  return [
    field.toLowerCase(),
    (value || '').substring(0, 120).toLowerCase(),
    String(context.role || context.jobTitle || '').toLowerCase(),
    String(context.experienceLevel || '').toLowerCase(),
    String(context.currentProjectName || context.projectName || '').toLowerCase(),
    String(context.currentSection || '').toLowerCase(),
    context.isProjectDescription ? 'proj-desc' : '',
    skills,
    jd,
    context.regenerate ? `r${context.regenerateNonce || Date.now()}` : '',
  ].join('::');
}

export function enhanceContextForRequest(
  field: string,
  context: Record<string, unknown>,
  options?: { regenerate?: boolean; excludeSuggestions?: string[] }
): Record<string, unknown> {
  const regenerate = !!options?.regenerate;
  const regenerateIndex =
    typeof context.regenerateIndex === 'number' ? context.regenerateIndex : 0;
  const nextIndex = regenerate ? regenerateIndex + 1 : regenerateIndex;

  return {
    ...context,
    regenerate,
    regenerateNonce: regenerate
      ? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      : context.regenerateNonce,
    regenerateIndex: nextIndex,
    variationTone: getVariationTone(nextIndex),
    excludeSuggestions: options?.excludeSuggestions || context.excludeSuggestions || [],
    suggestionDomain: context.isProjectDescription
      ? 'resume-project'
      : fieldToDomain(field || String(context.currentField || context.currentSection || '')),
  };
}

function fieldToDomain(field: string): string {
  const f = field.toLowerCase();
  if (f.includes('project')) return 'resume-project';
  if (f === 'summary' || f === 'bio') return 'resume-summary';
  if (f === 'experience' || f === 'bullet' || f === 'description') return 'resume-experience';
  if (f === 'skills') return 'resume-skills';
  if (f === 'jobtitle' || f === 'title') return 'resume-job-title';
  return 'resume-general';
}

export function getExperienceBulletSuggestions(input: {
  userInput: string;
  jobTitle?: string;
  skills?: string[];
  technologies?: string[];
  jdSkills?: string[];
  jdResponsibilities?: string[];
  regenerateIndex?: number;
}): string[] {
  const role = (input.jobTitle || 'Software Developer').trim();
  const tech = mergeSkillsForBullets(input);
  const stack = tech.length ? tech.join(', ') : 'React, Node.js, PostgreSQL';
  const draft = (input.userInput || '').toLowerCase();

  const portal = /portal|job|hire|recruit|ats|resume/i.test(draft) || /portal|recruit/i.test(role);
  const bullets: string[] = portal
    ? [
        `Developed scalable REST APIs and recruiter dashboards for a hiring platform using ${stack}, improving application throughput and resume parsing accuracy.`,
        `Implemented ATS-friendly resume workflows, candidate matching, and role-based authentication for job seekers and employers.`,
        `Optimized database queries and caching for job search and application tracking, reducing average page load time by 35%.`,
        `Integrated AI-assisted resume parsing and semantic job recommendations, increasing relevant applicant matches.`,
        `Built secure multi-tenant employer workflows with audit logging and admin analytics for recruitment teams.`,
        `Led end-to-end feature delivery from design to deployment with automated testing and CI/CD pipelines.`,
      ]
    : [
        `Developed and maintained production features using ${stack}, delivering reliable APIs and responsive user interfaces.`,
        `Improved application performance and code quality through refactoring, profiling, and automated test coverage.`,
        `Collaborated with cross-functional teams to ship features on schedule with measurable impact on user engagement.`,
        `Designed RESTful services and data models supporting high-traffic workflows with strong error handling.`,
        `Reduced deployment risk by introducing CI/CD, monitoring, and structured logging across services.`,
        `Mentored peers on best practices for code review, system design, and incremental delivery.`,
      ];

  const idx = input.regenerateIndex || 0;
  return rotatePool(bullets, idx, SUGGESTION_LIMIT_DEFAULT);
}

function mergeSkillsForBullets(input: {
  technologies?: string[];
  skills?: string[];
  jdSkills?: string[];
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...(input.jdSkills || []), ...(input.technologies || []), ...(input.skills || [])]) {
    const t = String(s).trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

export function getSummarySuggestions(input: {
  jobTitle?: string;
  skills?: string[];
  experienceLevel?: string;
  projects?: string[];
  userInput?: string;
  jdSkills?: string[];
  jdKeywords?: string[];
  regenerateIndex?: number;
}): string[] {
  const role = input.jobTitle || 'Full Stack Developer';
  const level = input.experienceLevel || 'experienced';
  const mergedSkills = [...(input.jdSkills || []), ...(input.skills || [])];
  const topSkills = mergedSkills.slice(0, 5).join(', ') || 'React, Node.js, and modern web technologies';
  const jdClause =
    input.jdKeywords && input.jdKeywords.length > 0
      ? ` Aligned with target role requirements including ${input.jdKeywords.slice(0, 4).join(', ')}.`
      : '';
  const projectHint =
    (input.projects || []).find((p) => /portal|job|recruit|ats/i.test(p)) ||
    (input.projects || [])[0] ||
    '';
  const projectClause = projectHint
    ? ` Proven experience building ${projectHint.includes('portal') ? 'recruitment and ATS-driven platforms' : 'production-grade applications'}.`
    : '';

  const summaries = [
    `${level === 'senior' ? 'Accomplished' : 'Experienced'} ${role} with expertise in ${topSkills}.${projectClause}${jdClause} Strong track record of delivering scalable web applications, optimizing performance, and collaborating in agile teams to ship recruiter-ready, ATS-friendly solutions.`,
    `Results-oriented ${role} specializing in ${topSkills}. Skilled at translating requirements into maintainable architecture, writing clean APIs, and improving user-facing workflows with measurable outcomes.${projectClause}${jdClause}`,
    `Professional ${role} focused on full-stack delivery using ${topSkills}. Combines technical depth with clear communication to build reliable platforms and drive continuous improvement.${jdClause}`,
    `Detail-oriented ${role} with hands-on experience in ${topSkills}. Delivers end-to-end features—from database design to UI—with strong code quality, security, and deployment practices.${projectClause}`,
    `Technical ${role} leveraging ${topSkills} to ship high-impact software. Strengths include system design, performance optimization, and cross-functional delivery in fast-paced environments.${jdClause}`,
    `ATS-focused ${role} experienced in ${topSkills} and modern engineering practices. Demonstrates consistent delivery, measurable outcomes, and clear stakeholder communication.${jdClause}`,
    `Leadership-oriented ${role} with depth in ${topSkills}. Experienced mentoring teams, driving technical decisions, and aligning engineering output with business goals.${projectClause}`,
    `Concise profile: ${role} · ${topSkills}.${projectClause ? ` ${projectClause.trim()}` : ''}${jdClause}`.trim(),
  ];

  const idx = input.regenerateIndex || 0;
  return rotatePool(summaries, idx, SUGGESTION_LIMIT_SUMMARY);
}

/**
 * Deterministic, section-aware suggestions (used before / alongside AI).
 */
export function resolveDeterministicSuggestions(
  field: string,
  value: string,
  context: Record<string, unknown>
): string[] | null {
  const skills = Array.isArray(context.skills) ? (context.skills as string[]) : [];
  const jobTitle = String(context.jobTitle || '');
  const isProjectDesc = !!context.isProjectDescription;
  const projectName = String(context.currentProjectName || value || '');
  const tech = Array.isArray(context.projectTechnologies)
    ? (context.projectTechnologies as string[])
    : [];

  const regIdx = Number(context.regenerateIndex) || 0;

  if (field === 'project') {
    return getProjectNameSuggestions({
      userInput: value,
      jobTitle,
      skills,
      projectName,
      regenerateIndex: regIdx,
    });
  }

  if (field === 'description' && isProjectDesc) {
    return getProjectDescriptionSuggestions({
      userInput: value,
      jobTitle,
      skills,
      projectName,
      technologies: tech,
      isDescription: true,
      regenerateIndex: regIdx,
    });
  }

  if (field === 'description' || field === 'bullet' || field === 'experience') {
    if (isProjectDesc) {
      return getProjectDescriptionSuggestions({
        userInput: value,
        jobTitle,
        skills,
        projectName,
        technologies: tech,
        isDescription: true,
        regenerateIndex: regIdx,
      });
    }
    return getExperienceBulletSuggestions({
      userInput: value,
      jobTitle,
      skills,
      technologies: tech.length ? tech : skills,
      jdSkills: (context.jdSkills as string[]) || [],
      jdResponsibilities: (context.jdResponsibilities as string[]) || [],
      regenerateIndex: Number(context.regenerateIndex) || 0,
    });
  }

  if (field === 'summary' || field === 'bio') {
    const projects = Array.isArray(context.existingProjects)
      ? (context.existingProjects as string[])
      : [];
    return getSummarySuggestions({
      jobTitle,
      skills,
      experienceLevel: String(context.experienceLevel || ''),
      projects,
      userInput: value,
      jdSkills: (context.jdSkills as string[]) || [],
      jdKeywords: (context.extractedJDKeywords as string[]) || [],
      regenerateIndex: Number(context.regenerateIndex) || 0,
    });
  }

  if (field === 'skills' && value.trim().length >= 1) {
    const themed = getProjectTechnologySuggestions({
      userInput: projectName || value,
      jobTitle,
      skills,
      projectName,
    });
    if (themed.length) return themed;
  }

  return null;
}

export function filterSuggestionsForResumeField(
  field: string,
  suggestions: string[],
  context: Record<string, unknown>
): string[] {
  const isProject =
    field === 'project' ||
    !!context.isProjectDescription ||
    context.suggestionDomain === 'resume-project';

  return suggestions.filter((s) => {
    const t = s.trim();
    if (!t) return false;
    if (isProject || field === 'summary' || field === 'experience' || field === 'bullet') {
      if (isJobPostingText(t)) return false;
    }
    if (field === 'project' && t.length > 80) return false;
    return true;
  });
}

export function mergeSuggestionSets(
  primary: string[],
  secondary: string[],
  exclude: string[] = [],
  max = SUGGESTION_LIMIT_DEFAULT
): string[] {
  return dedupeSuggestions([...primary, ...secondary], exclude, max);
}

/**
 * Final merge: quality rank, regenerate rotation, AI-first on regen.
 */
export function finalizeSuggestionResponse(
  field: string,
  context: Record<string, unknown>,
  aiSuggestions: string[],
  deterministicPool: string[] | null,
  exclude: string[] = []
): string[] {
  const limit = field === 'summary' || field === 'bio' ? SUGGESTION_LIMIT_SUMMARY : SUGGESTION_LIMIT_DEFAULT;
  const allExclude = [
    ...exclude,
    ...((context.previousSuggestions as string[]) || []),
    ...((context.rejectedSuggestions as string[]) || []),
  ];
  const regIndex = Number(context.regenerateIndex) || 0;

  let det = deterministicPool || [];
  if (det.length) {
    det = rotatePool(det, regIndex, Math.max(limit, det.length));
  }

  const rankedAi = rankSuggestionsByQuality(
    field,
    filterSuggestionsForResumeField(field, aiSuggestions, context),
    context
  );

  const merged = context.regenerate
    ? mergeSuggestionSets(rankedAi, det, allExclude, limit)
    : mergeSuggestionSets(det, rankedAi, allExclude, limit);

  if (merged.length >= Math.min(3, limit)) return merged;

  return dedupeSuggestions(
    [...rankedAi, ...det, ...aiSuggestions],
    allExclude,
    limit
  );
}
