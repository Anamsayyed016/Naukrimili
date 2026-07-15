/**
 * Per-block field assembly and confidence aggregation.
 */

import { detectLocationFromLine } from '../experience-extraction/location';
import { parseEducationDates } from './dates';
import { extractDescriptionFromBlock } from './description';
import { detectDegreeFromLine, lineHasDegreeSignal } from './degree';
import { detectFieldFromLine } from './field';
import { detectInstitutionFromLine } from './institution';
import { detectPerformanceFromText } from './performance';
import type {
  CustomExtractedEducation,
  EducationFieldConfidence,
  EducationRawBlock,
} from './types';

interface FieldPick<T> {
  value: T;
  confidence: number;
}

function expandHeaderSegments(lines: string[]): string[] {
  const segments: string[] = [];
  for (const line of lines) {
    // Preserve date ranges — en/em dash must not explode "June 2015 – July 2017".
    if (parseEducationDates(line)) {
      segments.push(line);
      continue;
    }
    // Pipe separators always expand.
    if (/\s*\|\s*/.test(line)) {
      for (const part of line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean)) {
        segments.push(part);
      }
      continue;
    }
    // Comma: only expand "College, University" pairs when BOTH sides look like institutions.
    if (/,/.test(line)) {
      const parts = line.split(/\s*,\s*/).map((p) => p.trim()).filter(Boolean);
      if (
        parts.length === 2 &&
        detectInstitutionFromLine(parts[0]).confidence >= 38 &&
        detectInstitutionFromLine(parts[1]).confidence >= 38
      ) {
        segments.push(...parts);
        continue;
      }
    }
    segments.push(line);
  }
  return segments;
}

/** Compact ATS form: "M.Com – BU Bhopal (2025)" / "MBA in Business Economics – A.B.V.H.V., Bhopal (2016)". */
function parseDegreeDashInstitutionLine(line: string): {
  degree: string;
  institution: string;
  yearText: string;
} | null {
  const cleaned = line.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, '');
  if (!cleaned) return null;
  const m = cleaned.match(
    /^(.+?)\s*[–—\-]\s*(.+?)(?:\s*[\(\[]\s*((?:19|20)\d{2}|present|current|ongoing)\s*[\)\]])?\s*$/i
  );
  if (!m) return null;
  const degreePart = m[1].trim();
  const institutionPart = m[2].trim().replace(/\s*[\(\[]\s*(?:19|20)\d{2}\s*[\)\]]\s*$/i, '').trim();
  const yearText = (m[3] || '').trim();
  if (!degreePart || !institutionPart) return null;
  if (detectDegreeFromLine(degreePart).confidence < 30 && !lineHasDegreeSignal(degreePart)) {
    return null;
  }
  return { degree: degreePart, institution: institutionPart, yearText };
}

function pickBestInstitution(lines: string[]): FieldPick<string> {
  // Prefer the institution line immediately under the degree (college before affiliating uni).
  let degreeIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (detectDegreeFromLine(lines[i]).confidence >= 38) {
      degreeIdx = i;
      break;
    }
  }
  if (degreeIdx >= 0) {
    // "Degree From Institution" on the same line.
    const fromInst = lines[degreeIdx].match(/\bfrom\s+(.+)$/i);
    if (fromInst) {
      const det = detectInstitutionFromLine(fromInst[1].trim());
      if (det.confidence >= 35) {
        return { value: det.institution || fromInst[1].trim(), confidence: Math.max(det.confidence, 70) };
      }
      return { value: fromInst[1].trim(), confidence: 68 };
    }
    for (let i = degreeIdx + 1; i < Math.min(lines.length, degreeIdx + 3); i++) {
      const next = lines[i];
      // Next line is another degree entry — not this entry's institution.
      if (lineHasDegreeSignal(next) || detectDegreeFromLine(next).confidence >= 38) {
        continue;
      }
      const det = detectInstitutionFromLine(next);
      if (det.confidence >= 40) {
        return { value: det.institution, confidence: Math.min(100, det.confidence + 6) };
      }
      // "(M.P) affiliated to University …"
      const aff = next.match(/\baffiliated\s+to\s+([^,]+)/i);
      if (aff) {
        return { value: aff[1].trim(), confidence: 72 };
      }
    }
  }

  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectInstitutionFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.institution, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDegree(lines: string[]): {
  degree: string;
  fieldFromDegree: string;
  confidence: number;
} {
  let best = { degree: '', fieldFromDegree: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    if (parseEducationDates(line)) continue;
    const inst = detectInstitutionFromLine(line);
    const det = detectDegreeFromLine(line);
    if (inst.confidence >= 42 && inst.confidence > det.confidence + 8) continue;
    if (det.confidence > best.confidence) {
      best = {
        degree: det.degree,
        fieldFromDegree: det.fieldOfStudy,
        confidence: det.confidence,
      };
    }
  }
  return best;
}

function pickBestField(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectFieldFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.fieldOfStudy, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDates(lines: string[]): {
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  confidence: number;
} {
  let best: ReturnType<typeof parseEducationDates> = null;
  for (const line of expandHeaderSegments(lines)) {
    const parsed = parseEducationDates(line);
    if (parsed && (!best || parsed.confidence > best.confidence)) {
      best = parsed;
    }
  }
  if (!best) {
    return { startDate: null, endDate: null, current: false, confidence: 0 };
  }
  return {
    startDate: best.startDate,
    endDate: best.endDate,
    current: best.current,
    confidence: best.confidence,
  };
}

function pickBestPerformance(lines: string[]): ReturnType<typeof detectPerformanceFromText> {
  let best = detectPerformanceFromText('');
  for (const line of [...lines]) {
    const det = detectPerformanceFromText(line);
    if (det.confidence > best.confidence) best = det;
  }
  return best;
}

function pickBestLocation(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectLocationFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.location, confidence: det.confidence };
    }
  }
  return best;
}

function computeOverallConfidence(fc: EducationFieldConfidence): number {
  const requiredWeights: Array<[keyof EducationFieldConfidence, number]> = [
    ['institution', 0.35],
    ['degree', 0.35],
    ['startDate', 0.15],
    ['endDate', 0.15],
  ];
  const optionalWeights: Array<[keyof EducationFieldConfidence, number]> = [
    ['fieldOfStudy', 0.12],
    ['performance', 0.1],
    ['description', 0.08],
    ['specialization', 0.03],
    ['location', 0.03],
  ];

  let sum = 0;
  let weightSum = 0;
  for (const [key, w] of requiredWeights) {
    sum += fc[key] * w;
    weightSum += w;
  }
  for (const [key, w] of optionalWeights) {
    if (fc[key] > 0) {
      sum += fc[key] * w;
      weightSum += w;
    }
  }

  return Math.min(100, Math.round(weightSum > 0 ? sum / weightSum : 0));
}

export function buildEducationFromBlock(block: EducationRawBlock): CustomExtractedEducation {
  const headerLines = block.headerText
    .split('\n')
    .map((l) => l.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, ''))
    .filter(Boolean);
  const allLines = [...headerLines, ...block.bodyLines.map((l) => l.trim()).filter(Boolean)];

  let institutionPick = pickBestInstitution(headerLines);
  let degreePick = pickBestDegree(headerLines);
  let datePick = pickBestDates(allLines);

  for (const line of headerLines) {
    const compact = parseDegreeDashInstitutionLine(line);
    if (!compact) continue;
    const deg = detectDegreeFromLine(compact.degree);
    const compactDegree = deg.degree || compact.degree;
    if (
      !degreePick.degree ||
      deg.confidence > degreePick.confidence ||
      (deg.confidence >= 38 && compactDegree.length + 8 < degreePick.degree.length)
    ) {
      degreePick = {
        degree: compactDegree,
        fieldFromDegree: deg.fieldOfStudy || '',
        confidence: Math.max(deg.confidence, 72),
      };
    }
    const inst = detectInstitutionFromLine(compact.institution);
    // Prefer RHS of Degree – School even when detectors score abbrev schools as 0.
    if (
      !institutionPick.value ||
      inst.confidence > institutionPick.confidence ||
      (compact.institution && institutionPick.confidence < 68)
    ) {
      institutionPick = {
        value:
          (inst.confidence >= 38 ? inst.institution : '') ||
          compact.institution ||
          institutionPick.value,
        confidence: Math.max(inst.confidence, compact.institution ? 68 : institutionPick.confidence),
      };
    }
    if (compact.yearText && datePick.confidence < 60) {
      const yearParsed = parseEducationDates(compact.yearText);
      if (yearParsed) {
        datePick = {
          startDate: yearParsed.startDate,
          endDate: yearParsed.endDate,
          current: yearParsed.current,
          confidence: Math.max(yearParsed.confidence, 70),
        };
      } else if (/^(?:19|20)\d{2}$/.test(compact.yearText)) {
        datePick = {
          startDate: null,
          endDate: compact.yearText,
          current: false,
          confidence: 72,
        };
      }
    }
    break;
  }

  const fieldPick = pickBestField([...headerLines, ...block.bodyLines.slice(0, 2)]);
  const performance = pickBestPerformance(allLines);
  const locationPick = pickBestLocation(headerLines);

  let institution = institutionPick.value;
  let institutionConf = institutionPick.confidence;
  let degree = degreePick.degree;
  let degreeConf = degreePick.confidence;

  const INSTITUTION_MARKERS_RE =
    /\b(university|college|institute|institution|school|academy|polytechnic|campus|vidyalaya|iit|nit|iiit|bits)\b/i;

  if (
    institution &&
    lineHasDegreeSignal(institution) &&
    !INSTITUTION_MARKERS_RE.test(institution)
  ) {
    if (!degree) {
      degree = institution;
      degreeConf = Math.max(degreeConf, institutionConf);
    }
    let bestInst = { value: '', confidence: 0 };
    for (const line of allLines) {
      const det = detectInstitutionFromLine(line);
      if (
        det.confidence > bestInst.confidence &&
        !lineHasDegreeSignal(det.institution)
      ) {
        bestInst = { value: det.institution, confidence: det.confidence };
      }
    }
    institution = bestInst.value;
    institutionConf = bestInst.confidence;
  }

  const fieldOfStudy = fieldPick.value || degreePick.fieldFromDegree;
  const { description, achievements, coursework, confidence: descConf } =
    extractDescriptionFromBlock(block.bodyLines);

  const perfConf = performance.confidence;
  const fieldConfidence: EducationFieldConfidence = {
    institution: institutionConf,
    degree: degreeConf,
    fieldOfStudy: Math.max(fieldPick.confidence, degreePick.fieldFromDegree ? 70 : 0),
    specialization: fieldPick.confidence,
    startDate: datePick.startDate ? datePick.confidence : 0,
    endDate: datePick.endDate || datePick.current ? datePick.confidence : 0,
    performance: perfConf,
    location: locationPick.confidence,
    description: descConf,
  };

  return {
    institution,
    degree,
    fieldOfStudy,
    specialization: fieldPick.value,
    startDate: datePick.startDate,
    endDate: datePick.endDate,
    current: datePick.current,
    cgpa: performance.cgpa,
    gpa: performance.gpa,
    percentage: performance.percentage,
    grade: performance.grade || performance.honours,
    location: locationPick.value,
    description,
    achievements,
    coursework,
    confidence: computeOverallConfidence(fieldConfidence),
    fieldConfidence,
  };
}
