/**
 * Pre-builder validation gate — runs before Resume Builder receives import data.
 * Composes existing extraction-repair + unified confidence checks.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { validateAndRepairResumeExtraction } from '@/lib/resume-parser/extraction-repair';
import {
  isPersonalMetadataResumeLine,
  isPlaceholderProjectTitle,
  isPlausibleExperienceCompany,
  isPlausibleProjectName,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import {
  computeUnifiedSectionConfidence,
  type UnifiedSectionConfidence,
} from '@/lib/resume-parser/unified-confidence-engine';

export interface PreBuilderValidationIssue {
  section: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface PreBuilderValidationResult {
  data: Record<string, unknown>;
  issues: PreBuilderValidationIssue[];
  scores: UnifiedSectionConfidence;
  ok: boolean;
}

function validateExperienceRows(
  experience: unknown[],
  issues: PreBuilderValidationIssue[]
): void {
  for (let i = 0; i < experience.length; i++) {
    const row = experience[i] as Record<string, unknown>;
    const company = String(row.company || '').trim();
    const position = String(row.position || row.title || row.designation || '').trim();
    if (!company && !position) {
      issues.push({
        section: 'experience',
        code: 'missing-company-and-designation',
        message: `Experience row ${i + 1} has no company or designation`,
        severity: 'error',
      });
    } else if (company && !isPlausibleExperienceCompany(company) && !position) {
      issues.push({
        section: 'experience',
        code: 'implausible-company-only',
        message: `Experience row ${i + 1} company looks implausible without designation`,
        severity: 'warning',
      });
    }
  }
}

function validateProjects(projects: unknown[], issues: PreBuilderValidationIssue[]): void {
  for (let i = 0; i < projects.length; i++) {
    const row = projects[i] as Record<string, unknown>;
    const name = String(row.name || row.title || '').trim();
    if (!name || isPlaceholderProjectTitle(name) || isPersonalMetadataResumeLine(name)) {
      issues.push({
        section: 'projects',
        code: 'invalid-project-title',
        message: `Project row ${i + 1} lacks a real title`,
        severity: 'error',
      });
    } else if (!isPlausibleProjectName(name)) {
      issues.push({
        section: 'projects',
        code: 'weak-project-title',
        message: `Project row ${i + 1} title may not be a real project name`,
        severity: 'warning',
      });
    }
  }
}

function validateEducation(education: unknown[], issues: PreBuilderValidationIssue[]): void {
  for (let i = 0; i < education.length; i++) {
    const row = education[i] as Record<string, unknown>;
    const institution = String(row.institution || row.school || '').trim();
    const degree = String(row.degree || '').trim();
    if (!institution && !degree) {
      issues.push({
        section: 'education',
        code: 'missing-institution-and-degree',
        message: `Education row ${i + 1} has no institution or degree`,
        severity: 'error',
      });
    }
  }
}

function validateAchievements(achievements: unknown[], issues: PreBuilderValidationIssue[]): void {
  for (const raw of achievements) {
    const text = String(
      typeof raw === 'string' ? raw : (raw as Record<string, unknown>)?.title || ''
    ).trim();
    if (text.length > 400) {
      issues.push({
        section: 'achievements',
        code: 'achievement-paragraph',
        message: 'Achievement entry looks like a full paragraph, not a bullet',
        severity: 'warning',
      });
    }
  }
}

function validateLanguageSkillLeak(
  languages: unknown[],
  skills: unknown[],
  issues: PreBuilderValidationIssue[]
): void {
  const langSet = new Set(
    languages.map((l) =>
      String(typeof l === 'string' ? l : (l as { name?: string })?.name || '')
        .trim()
        .toLowerCase()
    )
  );
  for (const s of skills) {
    const skill = String(typeof s === 'string' ? s : (s as { name?: string })?.name || '')
      .trim()
      .toLowerCase();
    if (langSet.has(skill) && skill.length >= 3) {
      issues.push({
        section: 'skills',
        code: 'language-as-skill',
        message: `"${skill}" appears in both languages and skills`,
        severity: 'warning',
      });
    }
  }
}

/**
 * Validate and lightly repair profile before builder transform.
 */
export function runPreBuilderValidation(
  profile: Record<string, unknown>,
  options: { rawText?: string } = {}
): PreBuilderValidationResult {
  const { data, report } = validateAndRepairResumeExtraction(profile);
  const issues: PreBuilderValidationIssue[] = [];

  for (const r of report.repairs) {
    issues.push({
      section: 'repair',
      code: 'auto-repair',
      message: r,
      severity: 'warning',
    });
  }
  for (const w of report.warnings) {
    issues.push({
      section: 'validation',
      code: 'warning',
      message: w,
      severity: 'warning',
    });
  }

  const experience = Array.isArray(data.experience) ? data.experience : [];
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const education = Array.isArray(data.education) ? data.education : [];
  const achievements = Array.isArray(data.achievements) ? data.achievements : [];
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const languages = Array.isArray(data.languages) ? data.languages : [];

  validateExperienceRows(experience, issues);
  validateProjects(projects, issues);
  validateEducation(education, issues);
  validateAchievements(achievements, issues);
  validateLanguageSkillLeak(languages, skills, issues);

  const asExtracted: ExtractedResumeData = {
    fullName: String(data.fullName || data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    location: String(data.location || data.address || ''),
    summary: String(data.summary || ''),
    skills: skills as string[],
    experience: experience as ExtractedResumeData['experience'],
    education: education as ExtractedResumeData['education'],
    projects: projects as ExtractedResumeData['projects'],
    certifications: Array.isArray(data.certifications)
      ? (data.certifications as ExtractedResumeData['certifications'])
      : [],
    languages: languages as ExtractedResumeData['languages'],
    achievements: achievements as string[],
    rawText: options.rawText || '',
    confidence: Number(data.confidence || 0),
  };

  const scores = computeUnifiedSectionConfidence(asExtracted, {
    rawText: options.rawText,
    customSectionScores: data._sectionConfidence as Record<string, number> | undefined,
  });

  const errors = issues.filter((i) => i.severity === 'error');
  return {
    data,
    issues,
    scores,
    ok: errors.length === 0,
  };
}
