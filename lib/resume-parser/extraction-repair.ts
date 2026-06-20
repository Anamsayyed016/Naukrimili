/**
 * Pre-autofill validation and repair for parsed resume data.
 * Runs at import-transform time — keeps normalize-extracted free of circular imports.
 */

import {
  isLikelyCertificationLine,
  isLikelyEducationLine,
  shouldKeepAsGlobalAchievement,
} from '@/lib/resume-parser/field-classification';
import { cleanString, dedupeStrings } from '@/lib/resume-parser/normalize-extracted';

export interface ResumeExtractionValidationReport {
  warnings: string[];
  repairs: string[];
}

function splitCompoundLanguageNames(name: string): string[] {
  const s = cleanString(name);
  if (!s) return [];
  const parts = s
    .split(/\s*(?:&|\/|\||\band\b)\s*/i)
    .map((p) => p.trim().replace(/[.,;]+$/, ''))
    .filter((p) => p.length >= 2 && p.length <= 40);
  if (parts.length > 1 && parts.every((p) => /^[A-Za-z]/.test(p))) {
    return parts;
  }
  return [s];
}

/** Pre-autofill validation — logs issues and returns a repaired copy. */
export function validateAndRepairResumeExtraction<T extends Record<string, unknown>>(
  input: T
): { data: T; report: ResumeExtractionValidationReport } {
  const report: ResumeExtractionValidationReport = { warnings: [], repairs: [] };
  const data = { ...input };

  const experience = Array.isArray(data.experience)
    ? [...(data.experience as unknown[])]
    : Array.isArray(data.workExperience)
      ? [...(data.workExperience as unknown[])]
      : [];
  let education = Array.isArray(data.education) ? [...(data.education as unknown[])] : [];
  let certifications = Array.isArray(data.certifications)
    ? [...(data.certifications as unknown[])]
    : [];
  let achievements = Array.isArray(data.achievements) ? [...(data.achievements as unknown[])] : [];
  let languages = Array.isArray(data.languages) ? [...(data.languages as unknown[])] : [];

  const keptAchievements: unknown[] = [];
  const responsibilityLines: string[] = [];

  for (const raw of achievements) {
    const line =
      typeof raw === 'string'
        ? cleanString(raw)
        : cleanString(
            (raw as Record<string, unknown>)?.title ??
              (raw as Record<string, unknown>)?.description ??
              (raw as Record<string, unknown>)?.text ??
              ''
          );
    if (!line) continue;
    if (isLikelyEducationLine(line)) {
      education.push({ degree: line, institution: '', school: '' });
      report.repairs.push(`Moved education line out of achievements: ${line.slice(0, 60)}`);
      continue;
    }
    if (isLikelyCertificationLine(line)) {
      certifications.push(typeof raw === 'string' ? raw : line);
      report.repairs.push(`Moved certification out of achievements: ${line.slice(0, 60)}`);
      continue;
    }
    if (shouldKeepAsGlobalAchievement(line)) {
      keptAchievements.push(raw);
    } else {
      responsibilityLines.push(line);
      report.repairs.push(`Reclassified responsibility from achievements: ${line.slice(0, 60)}`);
    }
  }
  achievements = keptAchievements;

  const keptEducation: unknown[] = [];
  for (const raw of education) {
    if (!raw || typeof raw !== 'object') {
      keptEducation.push(raw);
      continue;
    }
    const rec = raw as Record<string, unknown>;
    const degree = cleanString(rec.degree || rec.Degree);
    const institution = cleanString(rec.institution || rec.school || rec.Institution);
    const combined = `${degree} ${institution}`.trim();
    if (isLikelyCertificationLine(combined) || isLikelyCertificationLine(degree)) {
      certifications.push(degree || institution || combined);
      report.repairs.push(`Moved professional qualification from education: ${combined.slice(0, 60)}`);
      continue;
    }
    keptEducation.push(raw);
  }
  education = keptEducation;

  const repairedExperience = experience
    .map((raw) => {
      if (!raw || typeof raw !== 'object') return raw;
      const exp = { ...(raw as Record<string, unknown>) };
      const company = cleanString(exp.company || exp.Company || exp.organization);
      const position = cleanString(exp.position || exp.title || exp.role || exp.Position);
      const combined = `${company} ${position}`.trim();

      if (isLikelyEducationLine(combined) && !company) {
        education.push({ degree: position || company, institution: company, school: company });
        report.repairs.push(`Removed education entry from experience: ${combined.slice(0, 60)}`);
        return null;
      }

      const bullets = Array.isArray(exp.achievements) ? [...(exp.achievements as unknown[])] : [];
      const keptBullets: unknown[] = [];
      for (const b of bullets) {
        const line =
          typeof b === 'string'
            ? cleanString(b)
            : cleanString(
                (b as Record<string, unknown>)?.title ??
                  (b as Record<string, unknown>)?.description ??
                  ''
              );
        if (!line) continue;
        if (isLikelyEducationLine(line)) {
          education.push({ degree: line, institution: '', school: '' });
          report.repairs.push(`Moved education bullet from experience: ${line.slice(0, 60)}`);
          continue;
        }
        keptBullets.push(b);
      }
      exp.achievements = keptBullets;
      return exp;
    })
    .filter(Boolean);

  if (responsibilityLines.length && repairedExperience.length) {
    const target = repairedExperience[0] as Record<string, unknown>;
    const existing = Array.isArray(target.achievements) ? (target.achievements as unknown[]) : [];
    target.achievements = dedupeStrings([
      ...existing.map((a) => (typeof a === 'string' ? a : String(a))),
      ...responsibilityLines,
    ]);
  }

  for (let i = 0; i < repairedExperience.length; i++) {
    const exp = repairedExperience[i] as Record<string, unknown>;
    const company = cleanString(exp.company || exp.Company);
    const title = cleanString(exp.position || exp.title || exp.role);
    if (!company) report.warnings.push(`Experience entry ${i + 1} missing company name`);
    if (!title) report.warnings.push(`Experience entry ${i + 1} missing job title`);
  }

  const expandedLanguages: unknown[] = [];
  for (const raw of languages) {
    if (typeof raw === 'string') {
      for (const part of splitCompoundLanguageNames(raw)) {
        expandedLanguages.push(part);
      }
      continue;
    }
    if (raw && typeof raw === 'object') {
      const rec = { ...(raw as Record<string, unknown>) };
      const name = cleanString(rec.name ?? rec.language ?? rec.Language);
      const parts = splitCompoundLanguageNames(name);
      if (parts.length > 1) {
        for (const part of parts) {
          expandedLanguages.push({ ...rec, name: part, language: part });
        }
        report.repairs.push(`Split compound language: ${name}`);
      } else {
        expandedLanguages.push(rec);
      }
    }
  }
  languages = expandedLanguages;

  data.experience = repairedExperience;
  data.education = education;
  data.certifications = certifications;
  data.achievements = achievements;
  data.languages = languages;

  if (report.warnings.length || report.repairs.length) {
    console.log('[resume-extraction-validation]', {
      warnings: report.warnings.length,
      repairs: report.repairs.length,
    });
  }

  return { data: data as T, report };
}
