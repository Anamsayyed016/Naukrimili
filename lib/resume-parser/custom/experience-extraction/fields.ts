/**
 * Per-block field assembly and confidence aggregation.
 */

import { detectCompanyFromLine, looksLikeInstitutionalEmployer } from './company';
import { parseDateRangeFromText } from './dates';
import { detectDesignationFromLine, scoreDesignationCandidate } from './designation';
import { extractDescriptionFromBlock } from './description';
import { detectEmploymentTypeFromText, detectLocationFromLine } from './location';
import { extractTechnologiesFromBlock } from './technologies';
import {
  looksLikeCompanyNameLine,
  looksLikeStandaloneLocationLine,
  isPlausibleExperienceCompany,
  isExperienceBlurbFragment,
} from '@/lib/resume-parser/import-sanitize';
import { splitOnFieldSeparatorDash } from '@/lib/resume-parser/field-separator-dash';
import type {
  CustomExtractedExperience,
  ExperienceFieldConfidence,
  ExperienceRawBlock,
} from './types';

interface FieldPick<T> {
  value: T;
  confidence: number;
}

/** Parse composite header lines: "Title at Company", "Title - Company", "As Title in Company", "Title Company | Loc | Dates". */
function parseCompositeHeaderLine(line: string): {
  designation: FieldPick<string>;
  company: FieldPick<string>;
} | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // "Title Company | Location | Dates" or "Company | Location | Dates"
  const pipeParts = trimmed.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    const left = pipeParts[0];
    const words = left.split(/\s+/).filter(Boolean);
    const roleToken =
      /^(?:coordinator|manager|engineer|developer|administrator|analyst|specialist|executive|officer|intern|consultant|director|lead|head|associate|professional|secretary|assistant|recruiter|trainee)$/i;
    let roleEnd = -1;
    for (let i = 0; i < words.length; i++) {
      if (roleToken.test(words[i]) || /^(?:hr|it|senior|junior|sr|jr)$/i.test(words[i])) {
        roleEnd = i;
      }
    }
    if (roleEnd >= 0 && roleEnd < words.length - 1) {
      const role = words.slice(0, roleEnd + 1).join(' ');
      const employer = words.slice(roleEnd + 1).join(' ');
      const des = detectDesignationFromLine(role);
      const comp = detectCompanyFromLine(employer);
      if (
        (des.confidence >= 32 || scoreDesignationCandidate(role) >= 32) &&
        (comp.confidence >= 30 ||
          looksLikeInstitutionalEmployer(employer) ||
          isPlausibleExperienceCompany(employer) ||
          looksLikeCompanyNameLine(employer))
      ) {
        return {
          designation: {
            value: des.designation || role,
            confidence: Math.max(des.confidence, 58),
          },
          company: {
            value: comp.company || employer,
            confidence: Math.max(comp.confidence, 60),
          },
        };
      }
    }
  }

  // "As Company Secretary in Indian Steel Corporation Limited"
  const asInMatch = trimmed.match(/^As\s+(.+?)\s+(?:in|at|with|for)\s+(.+)$/i);
  if (asInMatch) {
    const rolePart = asInMatch[1].replace(/^working\s+/i, '').trim();
    let employerPart = asInMatch[2].trim().replace(/^["'“”]+|["'“”]+$/g, '');
    const citySplit = employerPart.match(/^(.+?),\s*([A-Za-z][A-Za-z.\s]{2,40})$/);
    if (
      citySplit &&
      !/\b(?:ltd|limited|pvt|llc|inc|corp|llp|group|associates)\b/i.test(citySplit[2])
    ) {
      employerPart = citySplit[1].trim();
    }
    const des = detectDesignationFromLine(rolePart);
    const comp = detectCompanyFromLine(employerPart);
    const roleOk = des.confidence >= 32 || scoreDesignationCandidate(rolePart) >= 32;
    const employerOk =
      comp.confidence >= 36 ||
      looksLikeInstitutionalEmployer(employerPart) ||
      isPlausibleExperienceCompany(employerPart) ||
      looksLikeCompanyNameLine(employerPart);
    if (roleOk && employerOk && employerPart.length >= 2) {
      return {
        designation: {
          value: des.designation || rolePart,
          confidence: Math.max(des.confidence, 58),
        },
        company: {
          value: comp.company || employerPart,
          confidence: Math.max(comp.confidence, 62),
        },
      };
    }
  }

  const atMatch = trimmed.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    const des = detectDesignationFromLine(atMatch[1]);
    const comp = detectCompanyFromLine(atMatch[2]);
    if (des.confidence >= 38 && comp.confidence >= 42) {
      return {
        designation: { value: des.designation, confidence: des.confidence },
        company: { value: comp.company, confidence: comp.confidence },
      };
    }
  }

  const dashSplit = splitOnFieldSeparatorDash(trimmed);
  if (dashSplit) {
    const a = dashSplit.left;
    const b = dashSplit.right;
    const desA = detectDesignationFromLine(a);
    const compA = detectCompanyFromLine(a);
    const desB = detectDesignationFromLine(b);
    const compB = detectCompanyFromLine(b);

    if (desA.confidence >= 40 && compB.confidence >= 42) {
      return {
        designation: { value: desA.designation, confidence: desA.confidence },
        company: { value: compB.company, confidence: compB.confidence },
      };
    }
    if (compA.confidence >= 42 && desB.confidence >= 40) {
      return {
        designation: { value: desB.designation, confidence: desB.confidence },
        company: { value: compA.company, confidence: compA.confidence },
      };
    }
  }

  return null;
}

function pickCompositeFields(lines: string[]): {
  designation: FieldPick<string>;
  company: FieldPick<string>;
} {
  let designation: FieldPick<string> = { value: '', confidence: 0 };
  let company: FieldPick<string> = { value: '', confidence: 0 };

  for (const line of lines) {
    const pipeParts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    if (pipeParts.length === 2) {
      const leftDes = detectDesignationFromLine(pipeParts[0]);
      const rightComp = detectCompanyFromLine(pipeParts[1]);
      if (
        leftDes.confidence >= 38 &&
        (rightComp.confidence >= 30 || looksLikeInstitutionalEmployer(pipeParts[1]))
      ) {
        if (leftDes.confidence > designation.confidence) {
          designation = { value: leftDes.designation, confidence: leftDes.confidence };
        }
        const compPick = {
          value: rightComp.company || pipeParts[1],
          confidence: Math.max(rightComp.confidence, 58),
        };
        if (compPick.confidence > company.confidence) company = compPick;
      }
    }

    const composite = parseCompositeHeaderLine(line);
    if (!composite) continue;
    if (composite.designation.confidence > designation.confidence) {
      designation = composite.designation;
    }
    if (composite.company.confidence > company.confidence) {
      company = composite.company;
    }
  }

  return { designation, company };
}

/** Split composite header lines ("Title | Dates | Location") into classifiable segments. */
function expandHeaderSegments(lines: string[]): string[] {
  const segments: string[] = [];
  for (const line of lines) {
    // Keep date-range lines atomic — splitting on en/em dashes turns
    // "2020 – 2024" into two orphan years (lose endDate; conf falls to 55).
    if (parseDateRangeFromText(line)) {
      segments.push(line);
      continue;
    }
    // Pipe separators only. Title – employer dashes are handled by composite parse.
    const parts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) {
      segments.push(line);
      continue;
    }
    for (const part of parts) segments.push(part);
  }
  return segments;
}

function pickBestCompany(lines: string[], excludeDesignation = ''): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  const exclude = excludeDesignation.toLowerCase().trim();

  for (const line of lines) {
    const pipeParts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    if (pipeParts.length >= 3) {
      const des = detectDesignationFromLine(pipeParts[0]);
      const comp = detectCompanyFromLine(pipeParts[1]);
      if (des.confidence >= 38 && comp.confidence >= 35) {
        const pick = {
          value: comp.company || pipeParts[1],
          confidence: Math.max(comp.confidence, 62),
        };
        if (pick.confidence > best.confidence) best = pick;
      }
      continue;
    }
    if (pipeParts.length === 2) {
      const leftDes = detectDesignationFromLine(pipeParts[0]);
      const rightDes = detectDesignationFromLine(pipeParts[1]);
      const leftComp = detectCompanyFromLine(pipeParts[0]);
      const rightComp = detectCompanyFromLine(pipeParts[1]);
      const rightIsLocation =
        looksLikeStandaloneLocationLine(pipeParts[1]) &&
        !looksLikeInstitutionalEmployer(pipeParts[1]) &&
        !isPlausibleExperienceCompany(pipeParts[1]);

      if (
        leftDes.confidence >= 38 &&
        (rightComp.confidence >= 30 || looksLikeInstitutionalEmployer(pipeParts[1])) &&
        !rightIsLocation
      ) {
        const pick = {
          value: rightComp.company || pipeParts[1],
          confidence: Math.max(rightComp.confidence, looksLikeInstitutionalEmployer(pipeParts[1]) ? 60 : 55),
        };
        if (pick.confidence > best.confidence) best = pick;
      } else if (rightDes.confidence >= 38 && leftComp.confidence >= 35) {
        const pick = {
          value: leftComp.company || pipeParts[0],
          confidence: Math.max(leftComp.confidence, 58),
        };
        if (pick.confidence > best.confidence) best = pick;
      }
    }
  }

  for (const line of expandHeaderSegments(lines)) {
    if (parseDateRangeFromText(line)) continue;
    if (isExperienceBlurbFragment(line)) continue;
    const det = detectCompanyFromLine(line);
    if (!det.company) continue;
    if (isExperienceBlurbFragment(det.company)) continue;
    if (exclude && det.company.toLowerCase().trim() === exclude) continue;
    if (det.confidence > best.confidence) {
      best = { value: det.company, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDesignation(lines: string[], exclude: string): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of lines) {
    const pipeParts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    if (pipeParts.length === 2) {
      const leftDes = detectDesignationFromLine(pipeParts[0]);
      const rightComp = detectCompanyFromLine(pipeParts[1]);
      if (
        leftDes.confidence >= 38 &&
        (rightComp.confidence >= 30 || looksLikeInstitutionalEmployer(pipeParts[1]))
      ) {
        const pick = { value: leftDes.designation, confidence: leftDes.confidence };
        if (pick.confidence > best.confidence) best = pick;
      }
    }
  }
  for (const line of expandHeaderSegments(lines)) {
    if (parseDateRangeFromText(line)) continue;
    const det = detectDesignationFromLine(line);
    if (det.designation === exclude) continue;
    if (det.confidence > best.confidence) {
      best = { value: det.designation, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestLocation(lines: string[], excludeCompany = ''): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  const exclude = excludeCompany.toLowerCase().trim();

  for (const line of lines) {
    const pipeParts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
    if (pipeParts.length >= 3) {
      const loc = detectLocationFromLine(pipeParts[pipeParts.length - 1]);
      if (loc.confidence > best.confidence) {
        best = { value: loc.location, confidence: loc.confidence };
      }
    }
  }

  for (const line of expandHeaderSegments(lines)) {
    if (parseDateRangeFromText(line)) continue;
    if (exclude && line.toLowerCase().trim() === exclude) continue;
    if (isPlausibleExperienceCompany(line)) continue;
    if (looksLikeInstitutionalEmployer(line)) continue;
    if (looksLikeCompanyNameLine(line) && !looksLikeStandaloneLocationLine(line)) continue;

    const companyDet = detectCompanyFromLine(line);
    const det = detectLocationFromLine(line);
    if (companyDet.confidence >= 45 && companyDet.confidence > det.confidence) continue;
    if (det.confidence > best.confidence) {
      best = { value: det.location, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDateRange(lines: string[], bodyLines: string[] = []): {
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  startConf: number;
  endConf: number;
} {
  let best: ReturnType<typeof parseDateRangeFromText> = null;
  const scanLines = [...expandHeaderSegments(lines), ...bodyLines.slice(0, 2).map((l) => l.trim()).filter(Boolean)];
  for (const line of scanLines) {
    const parsed = parseDateRangeFromText(line);
    if (parsed && (!best || parsed.confidence > best.confidence)) {
      best = parsed;
    }
  }
  if (!best) {
    return { startDate: null, endDate: null, current: false, startConf: 0, endConf: 0 };
  }
  return {
    startDate: best.startDate,
    endDate: best.endDate,
    current: best.current,
    startConf: best.startDate ? best.confidence : 0,
    endConf: best.current || best.endDate ? best.confidence : 0,
  };
}

function pickEmploymentType(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectEmploymentTypeFromText(line);
    if (det.confidence > best.confidence) {
      best = { value: det.type, confidence: det.confidence };
    }
  }
  return best;
}

function computeOverallConfidence(fc: ExperienceFieldConfidence, hasBullets: boolean): number {
  const weights = {
    company: 0.18,
    designation: 0.18,
    location: 0.08,
    employmentType: 0.04,
    startDate: 0.14,
    endDate: 0.1,
    description: 0.28,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, w] of Object.entries(weights)) {
    const val = fc[key as keyof ExperienceFieldConfidence];
    sum += val * w;
    weightSum += w;
  }

  let overall = weightSum > 0 ? sum / weightSum : 0;
  if (hasBullets && fc.description < 40) overall = Math.max(overall, fc.description + 15);
  return Math.min(100, Math.round(overall));
}

export function buildExperienceFromBlock(block: ExperienceRawBlock): CustomExtractedExperience {
  const headerLines = block.headerText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const compositePick = pickCompositeFields(headerLines);
  const designationPick = pickBestDesignation(headerLines, '');
  const companyPick = pickBestCompany(headerLines, designationPick.value);

  // Prefer a complete title+employer composite over a date-token company miss.
  const compositeComplete =
    Boolean(compositePick.designation.value) && Boolean(compositePick.company.value);
  const finalDesignation =
    compositeComplete &&
    compositePick.designation.confidence + 8 >= designationPick.confidence
      ? compositePick.designation
      : compositePick.designation.confidence > designationPick.confidence
        ? compositePick.designation
        : designationPick;
  const finalCompany =
    compositeComplete &&
    compositePick.company.confidence + 8 >= companyPick.confidence
      ? compositePick.company
      : compositePick.company.confidence > companyPick.confidence
        ? compositePick.company
        : companyPick;

  const locationPick = pickBestLocation(headerLines, finalCompany.value);
  const datePick = pickBestDateRange(headerLines, block.bodyLines);
  const employmentPick = pickEmploymentType(headerLines);

  let { description, bulletPoints, confidence: descConf } = extractDescriptionFromBlock(
    block.bodyLines
  );
  if (!description && bulletPoints.length > 0) {
    descConf = Math.max(descConf, Math.min(90, 40 + bulletPoints.length * 8));
  }
  const technologies = extractTechnologiesFromBlock(description, bulletPoints);

  const fieldConfidence: ExperienceFieldConfidence = {
    company: finalCompany.confidence,
    designation: finalDesignation.confidence,
    location: locationPick.confidence,
    employmentType: employmentPick.confidence,
    startDate: datePick.startConf,
    endDate: datePick.endConf,
    description: descConf,
  };

  const confidence = computeOverallConfidence(fieldConfidence, bulletPoints.length > 0);

  return {
    company: finalCompany.value,
    designation: finalDesignation.value,
    location: locationPick.value,
    employmentType: employmentPick.value,
    startDate: datePick.startDate,
    endDate: datePick.endDate,
    current: datePick.current,
    description,
    bulletPoints,
    technologies,
    confidence,
    fieldConfidence,
  };
}
