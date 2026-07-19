/**
 * Project validation and evidence-based repair.
 */

import { isPlausibleExperienceCompany, looksLikeJobTitleLine } from '@/lib/resume-parser/import-sanitize';

import { isValidProject } from '../project-extraction/validate';
import type { CustomExtractedProject } from '../project-extraction/types';
import type { RepairContext } from './types';
import { recordIssue, recordRepair } from './types';

function projectKey(p: CustomExtractedProject): string {
  return [p.title?.toLowerCase() || '', p.github || '', p.liveUrl || ''].join('|');
}

function isValidHttpUrl(url: string): boolean {
  if (!url?.trim()) return true;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return Boolean(u.hostname && u.hostname.includes('.'));
  } catch {
    return false;
  }
}

function recoverTitleFromSection(
  project: CustomExtractedProject,
  sectionText: string
): { title: string; confidence: number } {
  if (!sectionText || project.title) return { title: '', confidence: 0 };

  const firstAchievement = project.achievements[0]?.trim();
  if (firstAchievement && firstAchievement.length <= 80 && !looksLikeJobTitleLine(firstAchievement)) {
    const inSection = sectionText.toLowerCase().includes(firstAchievement.toLowerCase().slice(0, 30));
    if (inSection) return { title: firstAchievement, confidence: 65 };
  }

  return { title: '', confidence: 0 };
}

export function repairProjectEntry(
  project: CustomExtractedProject,
  index: number,
  ctx: RepairContext
): CustomExtractedProject {
  const fixed: CustomExtractedProject = { ...project };

  if (!fixed.title) {
    const recovered = recoverTitleFromSection(fixed, ctx.sectionTexts.projects || '');
    if (recovered.title) {
      recordRepair(ctx, {
        section: 'projects',
        field: 'title',
        index,
        originalValue: '',
        recoveredValue: recovered.title,
        evidenceSource: 'section_metadata',
        confidence: recovered.confidence,
        reason: 'Recovered project title from section context.',
      });
      fixed.title = recovered.title;
    } else {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'projects',
        field: 'title',
        index,
        code: 'missing_title',
        message: 'Project missing title.',
      });
    }
  }

  if (fixed.title && looksLikeJobTitleLine(fixed.title) && !fixed.role && !fixed.github) {
    recordIssue(ctx, {
      severity: 'manual_review',
      section: 'projects',
      field: 'title',
      index,
      code: 'experience_as_project',
      message: 'Job title may indicate experience misclassified as project.',
    });
  }

  if (fixed.title && isPlausibleExperienceCompany(fixed.title) && !fixed.description) {
    recordIssue(ctx, {
      severity: 'manual_review',
      section: 'projects',
      index,
      code: 'company_as_project',
      message: 'Company name may indicate misclassified project.',
    });
  }

  for (const field of ['github', 'liveUrl'] as const) {
    const val = fixed[field];
    if (val && !isValidHttpUrl(val)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'projects',
        field,
        index,
        code: 'broken_url',
        message: `${field} URL appears invalid.`,
      });
      recordRepair(ctx, {
        section: 'projects',
        field,
        index,
        originalValue: val,
        recoveredValue: '',
        evidenceSource: 'current_section',
        confidence: 88,
        reason: 'Cleared invalid URL.',
      });
      fixed[field] = '';
    }
  }

  if (!fixed.technologies.length && fixed.description) {
    const techMatch = fixed.description.match(
      /(?:technologies?|tech\s*stack|built\s+with|using)\s*:?\s*([A-Za-z0-9.,+#/ ]{3,120})/i
    );
    if (techMatch?.[1]) {
      const techs = techMatch[1]
        .split(/[,;|/]/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2 && t.length <= 40);
      if (techs.length) {
        recordRepair(ctx, {
          section: 'projects',
          field: 'technologies',
          index,
          originalValue: '',
          recoveredValue: techs.join(', '),
          evidenceSource: 'current_section',
          confidence: 70,
          reason: 'Recovered technologies from description evidence.',
        });
        fixed.technologies = techs;
      }
    }
  }

  return fixed;
}

function looksLikeMisclassifiedEmploymentProject(p: CustomExtractedProject): boolean {
  const title = (p.title || '').trim();
  const blob = [title, p.description, ...(p.achievements || [])].join('\n');
  if (/^(?:role|team\s*size|key\s+responsibilit|processes?|suppliers?)\b/i.test(title)) return true;
  if (/^\s*(?:role|designation|position)\s*:/im.test(blob) && /\bteam\s*size\s*:/i.test(blob)) {
    return true;
  }
  if (isPlausibleExperienceCompany(title) && /\brole\s*:/i.test(blob)) return true;
  return false;
}

export function validateAndRepairProjects(
  projects: CustomExtractedProject[] | undefined,
  ctx: RepairContext
): CustomExtractedProject[] {
  if (!projects?.length) return [];

  const repaired = projects.map((p, i) => repairProjectEntry(p, i, ctx));
  const seen = new Map<string, number>();
  const deduped: CustomExtractedProject[] = [];

  for (let i = 0; i < repaired.length; i++) {
    const p = repaired[i];
    if (looksLikeMisclassifiedEmploymentProject(p)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'projects',
        index: i,
        code: 'employment_as_project',
        message: 'Dropped employment-shaped block misclassified as project.',
      });
      continue;
    }
    if (!isValidProject(p)) {
      recordIssue(ctx, {
        severity: 'error',
        section: 'projects',
        index: i,
        code: 'invalid_project',
        message: 'Project entry rejected by validation rules.',
      });
      continue;
    }

    const key = projectKey(p);
    if (seen.has(key) && key !== '||') {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'projects',
        index: i,
        code: 'duplicate_project',
        message: 'Duplicate project entry detected.',
      });
      continue;
    }
    seen.set(key, i);
    deduped.push(p);
  }

  return deduped;
}

export function scoreProjectsSection(projects: CustomExtractedProject[]): number {
  if (!projects.length) return 0;
  const avg = projects.reduce((sum, p) => sum + (p.confidence || 0), 0) / projects.length;
  return Math.min(100, Math.round(avg));
}
