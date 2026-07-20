/**
 * Validation — reject orphan tech lists, experience paragraphs, education noise.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import {
  isPlausibleExperienceCompany,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';

import { lineHasTechStackSignal } from './technologies';
import type { CustomExtractedProject } from './types';

const EXPERIENCE_PARAGRAPH_RE =
  /\b(managed|mentored|reported to|promoted|employer|annual|revenue|full[- ]?time|years?\s+of\s+experience|responsible\s+for\s+managing)\b/i;

const ISOLATED_TECH_LINE_RE =
  /^[A-Za-z0-9.#+\s,;/()-]{2,120}$/;

export function isValidProject(project: CustomExtractedProject): boolean {
  const hasTitle = Boolean(project.title?.trim());
  const hasDescription =
    Boolean(project.description?.trim()) || (project.achievements?.length ?? 0) > 0;

  if (!hasTitle && !hasDescription) return false;

  const combined = [project.title, project.description, ...project.achievements].join(' ');

  if (
    !hasTitle &&
    project.technologies.length >= 2 &&
    !hasDescription &&
    lineHasTechStackSignal(combined)
  ) {
    return false;
  }

  if (
    project.technologies.length >= 3 &&
    !hasDescription &&
    !project.github &&
    !project.liveUrl &&
    ISOLATED_TECH_LINE_RE.test(combined.trim())
  ) {
    return false;
  }

  if (isLikelyEducationLine(project.title) && !hasDescription) return false;
  if (isLikelyEducationLine(project.title) && isLikelyEducationLine(combined)) return false;
  // School / board / career-summary bleed must not become projects.
  if (
    /\b(?:high\s+school|higher\s+secondary|high\s+secondary|senior\s+secondary|career\s+counter|at\s+present\s*,?\s*i\s+am\s+working|madhya\s+pradesh\s+board|state\s+board)\b/i.test(
      combined
    ) &&
    !/\b(?:github|gitlab|demo|prototype|app|portal|dashboard|api)\b/i.test(combined)
  ) {
    return false;
  }
  if (project.title && isPlausibleExperienceCompany(project.title) && !hasDescription) return false;
  if (project.title && looksLikeJobTitleLine(project.title) && !hasDescription && !project.role) {
    return false;
  }

  if (EXPERIENCE_PARAGRAPH_RE.test(combined) && !hasTitle && hasDescription) {
    const words = combined.split(/\s+/).length;
    if (words > 18) return false;
  }

  if (
    project.achievements.length === 1 &&
    project.achievements[0].split(/\s+/).length > 25 &&
    !hasTitle
  ) {
    return false;
  }

  return true;
}

export function filterValidProjects(projects: CustomExtractedProject[]): CustomExtractedProject[] {
  return projects.filter(isValidProject);
}
