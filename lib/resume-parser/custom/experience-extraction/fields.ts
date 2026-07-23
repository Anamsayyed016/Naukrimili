/**
 * Per-block field assembly and confidence aggregation.
 */

import { detectCompanyFromLine, looksLikeInstitutionalEmployer, isIndustrySectorTagline, isEmployerAffiliationTagline, stripCompanyLineEmploymentMeta } from './company';
import { isTenureOrDateOnlyHeaderLine, parseDateRangeFromText } from './dates';
import { detectDesignationFromLine, scoreDesignationCandidate, stripTrailingEmploymentDates } from './designation';
import { extractDescriptionFromBlock } from './description';
import { detectEmploymentTypeFromText, detectLocationFromLine } from './location';
import { extractTechnologiesFromBlock } from './technologies';
import {
  parseTenureExperienceLine,
  lineLooksLikeTenureExperience,
  stripRolesResponsibilitiesSuffix,
} from './tenure';
import {
  looksLikeCompanyNameLine,
  looksLikeStandaloneLocationLine,
  looksLikeJobTitleLine,
  isPlausibleExperienceCompany,
  isExperienceBlurbFragment,
  isExperienceDateOrDurationToken,
  isCondensedTenureExperienceLine,
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

  // "Title Company | Location | Dates" or "Company Title | Dates"
  const pipeParts = trimmed.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length >= 2) {
    const left = pipeParts[0];
    // Company-first: "Acme Pvt. Ltd. (Brand) Executive – Accounts & Finance | Dates"
    const companyFirst = left.match(
      /^(.+?\b(?:pvt\.?\s*ltd\.?|private\s+limited|ltd\.?|limited|llc|inc\.?|corp\.?|corporation|llp|gmbh|plc|co\.?)\b\.?(?:\s*\([^)]+\))?)\s+(.+)$/i
    );
    if (companyFirst) {
      const employer = companyFirst[1].trim();
      const role = companyFirst[2].replace(/^[\s–—\-|:]+/, '').trim();
      const des = detectDesignationFromLine(role);
      const comp = detectCompanyFromLine(employer);
      if (
        employer.length >= 3 &&
        role.length >= 2 &&
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
            confidence: Math.max(comp.confidence, 62),
          },
        };
      }
    }
    const words = left.split(/\s+/).filter(Boolean);
    const roleToken =
      /^(?:coordinator|manager|engineer|developer|administrator|analyst|specialist|executive|officer|intern|consultant|director|lead|head|associate|professional|secretary|assistant|recruiter|trainee|accountant)$/i;
    let roleEnd = -1;
    for (let i = 0; i < words.length; i++) {
      if (roleToken.test(words[i]) || /^(?:hr|it|senior|junior|sr|jr)$/i.test(words[i])) {
        roleEnd = i;
      }
    }
    // Only use Title→Employer split when the employer side looks institutional
    // and the title side does NOT look like a company (avoids "Co Ltd Executive…").
    if (roleEnd >= 0 && roleEnd < words.length - 1) {
      const role = words.slice(0, roleEnd + 1).join(' ');
      const employer = words.slice(roleEnd + 1).join(' ');
      const des = detectDesignationFromLine(role);
      const comp = detectCompanyFromLine(employer);
      const roleLooksCompany =
        looksLikeInstitutionalEmployer(role) || looksLikeCompanyNameLine(role);
      if (
        !roleLooksCompany &&
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
      const rightIsDate =
        Boolean(parseDateRangeFromText(pipeParts[1])) ||
        isExperienceDateOrDurationToken(pipeParts[1]);
      if (rightIsDate) {
        // "Title | Dates" or "Company Title | Dates" — never treat the date side as company.
        const leftDes = detectDesignationFromLine(pipeParts[0]);
        if (leftDes.confidence >= 38 && leftDes.confidence > designation.confidence) {
          designation = { value: leftDes.designation, confidence: leftDes.confidence };
        }
      } else {
        const leftDes = detectDesignationFromLine(pipeParts[0]);
        const rightComp = detectCompanyFromLine(pipeParts[1]);
        if (
          leftDes.confidence >= 38 &&
          (rightComp.confidence >= 30 || looksLikeInstitutionalEmployer(pipeParts[1])) &&
          !isExperienceDateOrDurationToken(pipeParts[1])
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
    // Pipe separators first — a line may contain a date range AND a title/company
    // ("Assistant Manager | October 2024 – Present"). Splitting preserves both.
    if (/\s*\|\s*/.test(line)) {
      for (const part of line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean)) {
        segments.push(part);
      }
      continue;
    }
    // Keep standalone date-range lines atomic — en/em dashes must not explode
    // "2020 – 2024" into two orphan years.
    if (parseDateRangeFromText(line)) {
      segments.push(line);
      continue;
    }
    segments.push(line);
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
      const rightIsDate =
        Boolean(parseDateRangeFromText(pipeParts[1])) ||
        isExperienceDateOrDurationToken(pipeParts[1]);
      const leftIsDate =
        Boolean(parseDateRangeFromText(pipeParts[0])) ||
        isExperienceDateOrDurationToken(pipeParts[0]);
      if (rightIsDate || leftIsDate) {
        // Date sides are never companies.
        continue;
      }
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
    if (isTenureOrDateOnlyHeaderLine(line)) continue;
    if (lineLooksLikeTenureExperience(line) || isCondensedTenureExperienceLine(line)) continue;
    // Dated title lines are not employers — but "Company: tagline (ISO 9001:2015)"
    // must still yield the left-side employer (year tokens in certifications/taglines
    // must not suppress company detection).
    const companyDetEarly = detectCompanyFromLine(line);
    if (parseDateRangeFromText(line) && companyDetEarly.confidence < 50) continue;
    if (isExperienceDateOrDurationToken(line)) continue;
    if (isExperienceBlurbFragment(line) && companyDetEarly.confidence < 50) continue;
    if (/^responsibilit(?:y|ies)\s*[-–—:]/i.test(line.trim())) continue;
    if (/^(?:designation|role|position|title|post)\s*[:\-–—]/i.test(line.trim())) continue;
    const det = companyDetEarly.confidence >= 38 ? companyDetEarly : detectCompanyFromLine(line);
    if (!det.company) continue;
    if (isExperienceDateOrDurationToken(det.company)) continue;
    if (isExperienceBlurbFragment(det.company)) continue;
    if (isCondensedTenureExperienceLine(det.company)) continue;
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
      const rightIsDate =
        Boolean(parseDateRangeFromText(pipeParts[1])) ||
        isExperienceDateOrDurationToken(pipeParts[1]);
      const leftDes = detectDesignationFromLine(pipeParts[0]);
      if (rightIsDate) {
        if (leftDes.confidence >= 38 && leftDes.confidence > best.confidence) {
          best = { value: leftDes.designation, confidence: leftDes.confidence };
        }
        continue;
      }
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
    // Do not skip dated title lines ("Associate Apr 2025 – Jan 2026") —
    // detectDesignationFromLine already strips trailing employment ranges.
    if (isExperienceDateOrDurationToken(line)) continue;
    // Condensed tenure headers are parsed separately — avoid mangled titles.
    if (lineLooksLikeTenureExperience(line) || isCondensedTenureExperienceLine(line)) continue;
    const det = detectDesignationFromLine(line);
    if (!det.designation || det.designation === exclude) continue;
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
    if (isIndustrySectorTagline(line) || isEmployerAffiliationTagline(line)) continue;
    if (isPlausibleExperienceCompany(line)) continue;
    if (looksLikeInstitutionalEmployer(line)) continue;
    if (looksLikeCompanyNameLine(line) && !looksLikeStandaloneLocationLine(line)) continue;

    const companyDet = detectCompanyFromLine(line);
    const det = detectLocationFromLine(line);
    if (companyDet.confidence >= 45 && companyDet.confidence > det.confidence) continue;
    // Sector / affiliation descriptors must never become locations.
    if (det.location && (isIndustrySectorTagline(det.location) || isEmployerAffiliationTagline(det.location))) {
      continue;
    }
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

function cleanDesignationValue(value: string): string {
  return stripTrailingEmploymentDates(
    stripRolesResponsibilitiesSuffix(
      value
        .replace(/,\s*role\s*[-–—:]\s*/i, ' – ')
        .replace(/\(\s*\d+\s*$/g, '') // OCR-broken "(3" from "(3rd P)"
        .replace(/\(\s*$/g, '')
        .replace(/,\s*$/, '')
        .replace(/\s+,/g, ',')
        .trim()
    )
  );
}

/** Labeled Company / Designation: / Tenure / Responsibilities blocks. */
function extractLabeledExperienceFields(headerLines: string[], bodyLines: string[]): {
  company: FieldPick<string>;
  designation: FieldPick<string>;
  startDate: string;
  endDate: string | null;
  current: boolean;
  startConf: number;
  endConf: number;
  descriptionBoost: string;
} {
  let company: FieldPick<string> = { value: '', confidence: 0 };
  let designation: FieldPick<string> = { value: '', confidence: 0 };
  let startDate = '';
  let endDate: string | null = null;
  let current = false;
  let startConf = 0;
  let endConf = 0;
  let descriptionBoost = '';

  const allLines = [...headerLines, ...bodyLines.slice(0, 6)];
  for (const raw of allLines) {
    const line = raw.trim();
    if (!line) continue;

    const desLabel = line.match(/^(?:designation|role|position|title|post)\s*[:\-–—]\s*(.+)$/i);
    if (desLabel) {
      const title = cleanDesignationValue(desLabel[1]);
      if (title.length >= 2) {
        designation = { value: title, confidence: Math.max(designation.confidence, 78) };
      }
      continue;
    }

    if (isTenureOrDateOnlyHeaderLine(line) || /^tenure\b/i.test(line)) {
      const range = parseDateRangeFromText(line);
      if (range && range.confidence >= startConf) {
        startDate = range.startDate || startDate;
        endDate = range.endDate;
        current = range.current;
        startConf = range.confidence;
        endConf = range.endDate || range.current ? range.confidence : endConf;
      }
      continue;
    }

    const resp = line.match(/^responsibilit(?:y|ies)\s*[-–—:]\s*(.+)$/i);
    if (resp) {
      descriptionBoost = resp[1].trim();
      continue;
    }

    if (
      !company.value &&
      !isExperienceDateOrDurationToken(line) &&
      !isTenureOrDateOnlyHeaderLine(line) &&
      !lineLooksLikeTenureExperience(line) &&
      !isCondensedTenureExperienceLine(line) &&
      !/^responsibilit/i.test(line) &&
      !(looksLikeJobTitleLine(line) && detectDesignationFromLine(line).confidence >= 40) &&
      (looksLikeCompanyNameLine(line) ||
        looksLikeInstitutionalEmployer(line) ||
        isPlausibleExperienceCompany(line) ||
        detectCompanyFromLine(line).confidence >= 40)
    ) {
      const det = detectCompanyFromLine(line);
      const cleaned = stripCompanyLineEmploymentMeta(det.company || line);
      company = {
        value: cleaned || det.company || line,
        confidence: Math.max(det.confidence, looksLikeInstitutionalEmployer(line) ? 70 : 58),
      };
    }
  }

  return { company, designation, startDate, endDate, current, startConf, endConf, descriptionBoost };
}

export function buildExperienceFromBlock(block: ExperienceRawBlock): CustomExtractedExperience {
  const headerLines = block.headerText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const labeled = extractLabeledExperienceFields(headerLines, block.bodyLines);

  // Prefer explicit "N years experience as Title at Company" tenure headers.
  let tenureDesignation: FieldPick<string> = { value: '', confidence: 0 };
  let tenureCompany: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of headerLines) {
    const tenure = parseTenureExperienceLine(line);
    if (tenure && tenure.confidence > tenureDesignation.confidence) {
      tenureDesignation = { value: tenure.designation, confidence: tenure.confidence };
      tenureCompany = { value: tenure.company, confidence: tenure.confidence };
    }
  }

  const compositePick = pickCompositeFields(headerLines);
  const designationPick = pickBestDesignation(headerLines, '');
  const companyPick = pickBestCompany(headerLines, designationPick.value);

  // Prefer a complete title+employer composite over a date-token company miss.
  const compositeComplete =
    Boolean(compositePick.designation.value) && Boolean(compositePick.company.value);
  let finalDesignation =
    labeled.designation.confidence >= 70
      ? labeled.designation
      : tenureDesignation.confidence >= 70
        ? tenureDesignation
        : compositeComplete &&
            compositePick.designation.confidence + 8 >= designationPick.confidence
          ? compositePick.designation
          : compositePick.designation.confidence > designationPick.confidence
            ? compositePick.designation
            : designationPick;
  let finalCompany =
    tenureCompany.confidence >= 70
      ? tenureCompany
      : labeled.company.confidence >= 55
        ? labeled.company
        : compositeComplete &&
            compositePick.company.confidence + 8 >= companyPick.confidence
          ? compositePick.company
          : compositePick.company.confidence > companyPick.confidence
            ? compositePick.company
            : companyPick;

  finalDesignation = {
    ...finalDesignation,
    value: cleanDesignationValue(finalDesignation.value),
  };
  // Strong condensed-tenure parses always own both title and employer.
  if (tenureDesignation.confidence >= 70 && tenureCompany.confidence >= 70) {
    finalDesignation = {
      value: cleanDesignationValue(tenureDesignation.value),
      confidence: tenureDesignation.confidence,
    };
    finalCompany = {
      value: tenureCompany.value,
      confidence: tenureCompany.confidence,
    };
  }

  // If designation still contains the employer name (Company Title mash), prefer the
  // composite title or strip the embedded company prefix.
  if (finalCompany.value && finalDesignation.value) {
    const companyNorm = finalCompany.value.toLowerCase().trim();
    const desNorm = finalDesignation.value.toLowerCase().trim();
    if (desNorm.includes(companyNorm) || companyNorm.includes(desNorm)) {
      if (
        compositePick.designation.value &&
        !compositePick.designation.value.toLowerCase().includes(companyNorm)
      ) {
        finalDesignation = compositePick.designation;
      } else {
        const escapedCompany = finalCompany.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const stripped = finalDesignation.value
          .replace(new RegExp(`^${escapedCompany}\\s*`, 'i'), '')
          .replace(/^[\s–—\-|:]+/, '')
          .trim();
        if (stripped.length >= 2) {
          const strippedDes = detectDesignationFromLine(stripped);
          if (strippedDes.confidence >= 28 || scoreDesignationCandidate(stripped) >= 28) {
            finalDesignation = {
              value: strippedDes.designation || stripped,
              confidence: Math.max(finalDesignation.confidence, 64),
            };
          }
        }
      }
    }
  }

  // Never keep date tokens as company.
  if (finalCompany.value && isExperienceDateOrDurationToken(finalCompany.value)) {
    finalCompany = { value: '', confidence: 0 };
    if (labeled.company.value && !isExperienceDateOrDurationToken(labeled.company.value)) {
      finalCompany = labeled.company;
    } else if (compositePick.company.value && !isExperienceDateOrDurationToken(compositePick.company.value)) {
      finalCompany = compositePick.company;
    } else if (companyPick.value && !isExperienceDateOrDurationToken(companyPick.value)) {
      finalCompany = companyPick;
    }
  }

  // Sector / affiliation taglines are never locations or employers.
  if (finalCompany.value && (isIndustrySectorTagline(finalCompany.value) || isEmployerAffiliationTagline(finalCompany.value))) {
    finalCompany = { value: '', confidence: 0 };
  }

  // Clean ATS meta from whichever company source won.
  if (finalCompany.value) {
    const cleaned = stripCompanyLineEmploymentMeta(finalCompany.value);
    if (cleaned && cleaned !== finalCompany.value) {
      finalCompany = { value: cleaned, confidence: Math.max(finalCompany.confidence, 62) };
    }
  }

  // Job-title string in company slot with empty designation — swap / recover employer from headers.
  if (
    finalCompany.value &&
    (!finalDesignation.value || finalDesignation.confidence < 28) &&
    ((looksLikeJobTitleLine(finalCompany.value) && !looksLikeCompanyNameLine(finalCompany.value)) ||
      detectDesignationFromLine(finalCompany.value).confidence >= 40 ||
      scoreDesignationCandidate(finalCompany.value) >= 40)
  ) {
    const misplacedTitle = finalCompany.value;
    finalDesignation = {
      value: cleanDesignationValue(misplacedTitle),
      confidence: Math.max(finalDesignation.confidence, 70),
    };
    finalCompany = { value: '', confidence: 0 };
    for (const line of headerLines) {
      if (lineLooksLikeTenureExperience(line) || isCondensedTenureExperienceLine(line)) continue;
      const cleanedLine = stripCompanyLineEmploymentMeta(line);
      if (!cleanedLine || cleanedLine.toLowerCase() === misplacedTitle.toLowerCase()) continue;
      if (looksLikeJobTitleLine(cleanedLine) && !looksLikeCompanyNameLine(cleanedLine)) continue;
      const det = detectCompanyFromLine(cleanedLine);
      if (
        det.confidence >= 38 ||
        looksLikeInstitutionalEmployer(cleanedLine) ||
        isPlausibleExperienceCompany(cleanedLine) ||
        looksLikeCompanyNameLine(cleanedLine)
      ) {
        finalCompany = {
          value: stripCompanyLineEmploymentMeta(det.company || cleanedLine),
          confidence: Math.max(det.confidence, 60),
        };
        break;
      }
    }
  }

  const locationPick = pickBestLocation(headerLines, finalCompany.value);
  // Employer names misfiled as location (e.g. "Raj Security Force") — promote back.
  if (
    !finalCompany.value &&
    locationPick.value &&
    detectCompanyFromLine(locationPick.value).confidence >= 50
  ) {
    finalCompany = {
      value: detectCompanyFromLine(locationPick.value).company || locationPick.value,
      confidence: Math.max(detectCompanyFromLine(locationPick.value).confidence, 60),
    };
  }
  const datePick = pickBestDateRange(headerLines, block.bodyLines);
  const employmentPick = pickEmploymentType(headerLines);

  let startDate = datePick.startDate;
  let endDate = datePick.endDate;
  let current = datePick.current;
  let startConf = datePick.startConf;
  let endConf = datePick.endConf;
  if (labeled.startConf >= startConf && labeled.startDate) {
    startDate = labeled.startDate;
    endDate = labeled.endDate;
    current = labeled.current;
    startConf = labeled.startConf;
    endConf = labeled.endConf;
  }

  let { description, bulletPoints, confidence: descConf } = extractDescriptionFromBlock(
    block.bodyLines
  );
  if (labeled.descriptionBoost && !description) {
    description = labeled.descriptionBoost;
    descConf = Math.max(descConf, 55);
  } else if (labeled.descriptionBoost && description && !description.includes(labeled.descriptionBoost.slice(0, 40))) {
    description = `${labeled.descriptionBoost}\n${description}`.trim();
  }
  if (!description && bulletPoints.length > 0) {
    descConf = Math.max(descConf, Math.min(90, 40 + bulletPoints.length * 8));
  }
  const technologies = extractTechnologiesFromBlock(description, bulletPoints);

  const fieldConfidence: ExperienceFieldConfidence = {
    company: finalCompany.confidence,
    designation: finalDesignation.confidence,
    location: locationPick.confidence,
    employmentType: employmentPick.confidence,
    startDate: startConf,
    endDate: endConf,
    description: descConf,
  };

  const confidence = computeOverallConfidence(fieldConfidence, bulletPoints.length > 0);

  return {
    company: finalCompany.value,
    designation: finalDesignation.value,
    location:
      finalCompany.value &&
      locationPick.value &&
      locationPick.value.toLowerCase().trim() === finalCompany.value.toLowerCase().trim()
        ? ''
        : locationPick.value,
    employmentType: employmentPick.value,
    startDate,
    endDate,
    current,
    description,
    bulletPoints,
    technologies,
    confidence,
    fieldConfidence,
  };
}
