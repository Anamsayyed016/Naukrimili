/**
 * Experience Extraction Engine — converts detected experience section text into structured entries.
 */

import { isPlausibleExperienceCompany } from '@/lib/resume-parser/import-sanitize';

import { partitionExperienceBlocks } from './boundaries';
import { looksLikeSentenceNotCompany } from './company';
import { buildExperienceFromBlock } from './fields';
import { buildExperienceLines, truncateExperienceSectionAtEmbeddedHeadings } from './lines';
import { parseTenureExperienceLine } from './tenure';
import type { CanonicalExperience, CustomExtractedExperience } from './types';
import { toCanonicalExperience } from './types';
import { filterValidExperiences } from './validate';

/** When one employer has multiple roles, inherit company from the previous entry. */
function inheritCompanyAcrossExperiences(
  experiences: CustomExtractedExperience[]
): CustomExtractedExperience[] {
  let lastCompany = '';
  return experiences.map((exp) => {
    const company = exp.company?.trim() || '';
    if (company) {
      lastCompany = company;
      return exp;
    }
    if (exp.designation?.trim() && lastCompany) {
      return { ...exp, company: lastCompany };
    }
    return exp;
  });
}

function experienceHasBody(exp: CustomExtractedExperience): boolean {
  return Boolean(exp.description?.trim()) || (exp.bulletPoints?.length ?? 0) > 0;
}

function experienceHasIdentity(exp: CustomExtractedExperience): boolean {
  return (
    (Boolean(exp.company?.trim()) && isPlausibleExperienceCompany(exp.company)) ||
    Boolean(exp.designation?.trim())
  );
}

function looksLikeRolesResponsibilityLabel(text: string): boolean {
  return /\broles?\s*(?:&|and)\s*responsibilit/i.test(String(text || ''));
}

/**
 * Duty / R&R blocks that lack a plausible employer (even if a role title was
 * parsed from a "… Roles & Responsibilities" heading).
 */
function isOrphanDutyBody(exp: CustomExtractedExperience): boolean {
  if (!experienceHasBody(exp)) return false;
  const company = exp.company?.trim() || '';
  const companyLooksProse =
    Boolean(company) &&
    (looksLikeSentenceNotCompany(company) || !isPlausibleExperienceCompany(company));
  const companyOk = Boolean(company) && isPlausibleExperienceCompany(company) && !companyLooksProse;
  if (companyOk) return false;

  const designation = exp.designation?.trim() || '';
  if (!designation) return true;
  if (looksLikeRolesResponsibilityLabel(designation)) return true;
  // Role-title-only blocks with no employer / dates are duty sections, not jobs.
  if (!exp.startDate && !exp.endDate && !(exp as { years?: number }).years) {
    return true;
  }
  return false;
}

/**
 * Attach orphan duty bodies (Roles & Responsibilities blocks with no employer)
 * onto the nearest preceding sparse tenure/header row.
 */
function mergeOrphanBodiesIntoSparseHeaders(
  experiences: CustomExtractedExperience[]
): CustomExtractedExperience[] {
  if (experiences.length <= 1) return experiences;

  const out: CustomExtractedExperience[] = [];
  for (const exp of experiences) {
    const prev = out[out.length - 1];
    const companyLooksProse =
      Boolean(exp.company?.trim()) &&
      (looksLikeSentenceNotCompany(exp.company) || !isPlausibleExperienceCompany(exp.company));
    const orphanBody = isOrphanDutyBody(exp);

    if (prev && orphanBody && experienceHasIdentity(prev) && !experienceHasBody(prev)) {
      const orphanText = [exp.description, ...(exp.bulletPoints || [])]
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .join('\n');
      const proseCompany =
        companyLooksProse && exp.company?.trim() ? exp.company.trim() : '';
      const mergedBody = [proseCompany, orphanText].filter(Boolean).join('\n');
      out[out.length - 1] = {
        ...prev,
        description: [prev.description, mergedBody].filter(Boolean).join('\n').trim(),
        bulletPoints: [
          ...(prev.bulletPoints || []),
          ...(exp.bulletPoints || []).filter((b) => b && b !== proseCompany),
        ],
        fieldConfidence: {
          ...prev.fieldConfidence,
          description: Math.max(prev.fieldConfidence?.description ?? 0, 70),
        },
      };
      continue;
    }

    if (orphanBody) {
      continue;
    }

    out.push(exp);
  }
  return out;
}

/**
 * Pair sequential orphan duty bodies with sequential sparse tenure headers
 * (Quality R&R → Quality tenure, Project R&R → Project tenure).
 */
function distributeOrphanBodiesAcrossSparseHeaders(
  experiences: CustomExtractedExperience[]
): CustomExtractedExperience[] {
  const sparseIdx: number[] = [];
  const orphanIdx: number[] = [];

  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const companyOk =
      Boolean(exp.company?.trim()) && isPlausibleExperienceCompany(exp.company);
    if (companyOk && exp.designation?.trim() && !experienceHasBody(exp)) {
      sparseIdx.push(i);
    }
    if (isOrphanDutyBody(exp)) {
      orphanIdx.push(i);
    }
  }

  if (sparseIdx.length === 0 || orphanIdx.length === 0) {
    return mergeOrphanBodiesIntoSparseHeaders(experiences);
  }

  const next = experiences.map((e) => ({ ...e }));
  const usedOrphans = new Set<number>();

  const attachOrphan = (headerIdx: number, orphan: number) => {
    const bodyExp = next[orphan];
    const header = next[headerIdx];
    const proseCompany =
      bodyExp.company?.trim() &&
      (looksLikeSentenceNotCompany(bodyExp.company) ||
        !isPlausibleExperienceCompany(bodyExp.company))
        ? bodyExp.company.trim()
        : '';
    const mergedBody = [proseCompany, bodyExp.description, ...(bodyExp.bulletPoints || [])]
      .map((x) => String(x || '').trim())
      .filter(Boolean)
      .join('\n');
    next[headerIdx] = {
      ...header,
      description: mergedBody,
      bulletPoints: bodyExp.bulletPoints?.length
        ? [...bodyExp.bulletPoints]
        : mergedBody
            .split(/\n+/)
            .map((l) => l.trim())
            .filter((l) => l.length >= 12)
            .slice(0, 24),
      fieldConfidence: {
        ...header.fieldConfidence,
        description: Math.max(header.fieldConfidence?.description ?? 0, 72),
      },
    };
    usedOrphans.add(orphan);
  };

  for (let s = 0; s < sparseIdx.length; s++) {
    const headerIdx = sparseIdx[s];
    const nextHeaderIdx = sparseIdx[s + 1] ?? Number.POSITIVE_INFINITY;
    const prevHeaderIdx = s > 0 ? sparseIdx[s - 1] : -1;

    const orphan =
      orphanIdx.find(
        (oi) => !usedOrphans.has(oi) && oi > headerIdx && oi < nextHeaderIdx
      ) ??
      [...orphanIdx]
        .reverse()
        .find((oi) => !usedOrphans.has(oi) && oi > prevHeaderIdx && oi < headerIdx);

    if (orphan == null) continue;
    attachOrphan(headerIdx, orphan);
  }

  // Remaining sparse headers ↔ remaining orphan bodies in document order
  // (covers OCR layouts where all R&R blocks trail every tenure line).
  const remainingSparse = sparseIdx.filter((i) => !experienceHasBody(next[i]));
  const remainingOrphans = orphanIdx.filter((i) => !usedOrphans.has(i));
  for (let i = 0; i < Math.min(remainingSparse.length, remainingOrphans.length); i++) {
    attachOrphan(remainingSparse[i], remainingOrphans[i]);
  }

  return next.filter((_, i) => !usedOrphans.has(i));
}

export interface ExperienceExtractionResult {
  experiences: CustomExtractedExperience[];
  canonical: CanonicalExperience[];
  rejectedCount: number;
  blockCount: number;
}

/**
 * Extract structured experiences from a detected experience section (raw text).
 */
export function extractExperiencesFromSection(
  experienceSectionText: string,
  boundaryOptions?: import('./boundaries').ExperienceBoundaryOptions
): CustomExtractedExperience[] {
  const result = extractExperiencesWithMeta(experienceSectionText, boundaryOptions);
  return result.experiences;
}

export function extractExperiencesWithMeta(
  experienceSectionText: string,
  boundaryOptions?: import('./boundaries').ExperienceBoundaryOptions
): ExperienceExtractionResult {
  const trimmedSection = truncateExperienceSectionAtEmbeddedHeadings(experienceSectionText || '');
  const lines = buildExperienceLines(trimmedSection);
  const blocks = partitionExperienceBlocks(lines, boundaryOptions);
  const built = blocks.map(buildExperienceFromBlock);
  // Merge duty bodies onto sparse tenure headers BEFORE company inheritance.
  // Inheritance would otherwise stamp the previous employer onto Roles &
  // Responsibilities blocks, hiding them from orphan-body detection.
  const merged = inheritCompanyAcrossExperiences(
    distributeOrphanBodiesAcrossSparseHeaders(built)
  );
  const experiences = filterValidExperiences(merged);

  return {
    experiences,
    canonical: experiences.map(toCanonicalExperience),
    rejectedCount: built.length - experiences.length,
    blockCount: blocks.length,
  };
}

export function extractCanonicalExperiences(
  experienceSectionText: string
): CanonicalExperience[] {
  return extractExperiencesWithMeta(experienceSectionText).canonical;
}

/** Re-export for tests / callers that need tenure detection. */
export { parseTenureExperienceLine };
