/**
 * Pre-autofill validation and repair for parsed resume data.
 * Runs at import-transform time — keeps normalize-extracted free of circular imports.
 */

import {
  isLikelyCertificationLine,
  isLikelyEducationLine,
  shouldKeepAsGlobalAchievement,
} from '@/lib/resume-parser/field-classification';
import {
  dedupeAdjacentExperienceEntries,
  dedupeExperienceBodyLines,
  normalizeSkillsList,
  pruneExperienceBodyFields,
  reconcileExperienceHeaderFields,
} from '@/lib/resume-parser/import-sanitize';
import { cleanString } from '@/lib/resume-parser/normalize-extracted';
import {
  isImportFieldTraceEnabled,
  traceImportStageTransform,
} from '@/lib/resume-parser/import-field-trace';

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
  const traceInput = { ...input };
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
      const pruned = pruneExperienceBodyFields(
        String(exp.description || exp.Description || ''),
        keptBullets.map((b) => String(b))
      );
      const deduped = dedupeExperienceBodyLines(pruned.description, pruned.achievements);
      exp.description = deduped.description;
      exp.Description = deduped.description;
      exp.achievements = deduped.achievements;
      return reconcileExperienceHeaderFields(exp);
    })
    .filter(Boolean);

  const placedResponsibility = new Set<number>();
  if (responsibilityLines.length && repairedExperience.length) {
    const scoreResponsibilityTarget = (raw: unknown, line: string): number => {
      if (!raw || typeof raw !== 'object') return 0;
      const exp = raw as Record<string, unknown>;
      const company = cleanString(exp.company || exp.Company || exp.organization).toLowerCase();
      const title = cleanString(exp.position || exp.title || exp.role).toLowerCase();
      const desc = String(exp.description || '').toLowerCase();
      const ach = Array.isArray(exp.achievements)
        ? (exp.achievements as unknown[]).map((a) => String(a)).join(' ').toLowerCase()
        : '';
      const body = `${desc} ${ach}`.trim();
      const lineLower = line.toLowerCase();
      let score = 0;
      if (!body) score += 18;
      if (company && lineLower.includes(company.split(/\s+/)[0])) score += 22;
      if (title) {
        for (const w of title.split(/\s+/).filter((w) => w.length >= 4)) {
          if (lineLower.includes(w)) score += 10;
        }
      }
      for (const w of lineLower.split(/\s+/).filter((w) => w.length >= 5)) {
        if (body.includes(w)) score += 6;
      }
      return score;
    };

    for (const line of responsibilityLines) {
      let bestIdx = -1;
      let bestScore = 0;
      for (let i = 0; i < repairedExperience.length; i++) {
        if (placedResponsibility.has(i)) continue;
        const score = scoreResponsibilityTarget(repairedExperience[i], line);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      if (bestIdx < 0 || bestScore < 18) {
        let idx = repairedExperience.findIndex((raw, i) => {
          if (placedResponsibility.has(i)) return false;
          const exp = raw as Record<string, unknown>;
          const company = cleanString(exp.company || exp.Company || exp.organization);
          const title = cleanString(exp.position || exp.title || exp.role);
          if (!company || !title) return false;
          const desc = String(exp.description || '').trim();
          const ach = Array.isArray(exp.achievements) ? exp.achievements.length : 0;
          return !desc && ach === 0;
        });
        if (idx < 0) {
          idx = repairedExperience.findIndex((raw) => {
            const exp = raw as Record<string, unknown>;
            return !!cleanString(exp.company || exp.Company || exp.organization);
          });
        }
        bestIdx = idx;
      }
      if (bestIdx < 0) {
        keptAchievements.push(line);
        report.repairs.push(`Kept unplaced responsibility in achievements: ${line.slice(0, 60)}`);
        continue;
      }
      placedResponsibility.add(bestIdx);
      const target = repairedExperience[bestIdx] as Record<string, unknown>;
      const existingDesc = String(target.description || '').trim();
      const existingAch = Array.isArray(target.achievements)
        ? (target.achievements as unknown[]).map((a) => String(a))
        : [];
      const deduped = dedupeExperienceBodyLines(
        existingDesc ? `${existingDesc}\n${line}` : line,
        [...existingAch, line]
      );
      target.description = deduped.description;
      target.Description = deduped.description;
      target.achievements = deduped.achievements;
      report.repairs.push(`Attached responsibility to experience ${bestIdx + 1}: ${line.slice(0, 60)}`);
    }
    achievements = keptAchievements;
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

  const rawSkills = Array.isArray(data.skills) ? (data.skills as unknown[]) : [];
  const normalizedSkills = normalizeSkillsList(rawSkills);
  if (normalizedSkills.length !== rawSkills.length) {
    report.repairs.push(
      `Normalized skills list: ${rawSkills.length} input tokens → ${normalizedSkills.length} retained`
    );
  }
  data.skills = normalizedSkills;

  data.experience = dedupeAdjacentExperienceEntries(
    repairedExperience as Array<Record<string, unknown>>
  );
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

  if (isImportFieldTraceEnabled()) {
    traceImportStageTransform(
      '9_validate_and_repair_resume_extraction',
      traceInput,
      data,
      'extraction-repair'
    );
  }

  return { data: data as T, report };
}
