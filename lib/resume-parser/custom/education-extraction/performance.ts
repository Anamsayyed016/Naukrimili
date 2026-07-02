/**
 * Academic performance detection — GPA, CGPA, percentage, grade.
 */

export interface PerformanceDetection {
  cgpa: string;
  gpa: string;
  percentage: string;
  grade: string;
  honours: string;
  confidence: number;
}

const CGPA_RE = /(?:cgpa|c\.g\.p\.a\.?)\s*[:–-]?\s*([\d.]+(?:\s*\/\s*[\d.]+)?)/i;
const GPA_RE = /(?:gpa|g\.p\.a\.?)\s*[:–-]?\s*([\d.]+(?:\s*\/\s*[\d.]+)?)/i;
const PERCENT_RE = /([\d.]+)\s*%/;
const GRADE_RE = /(?:grade|class)\s*[:–-]?\s*([A-F][+-]?|first\s+class|second\s+class|distinction)/i;
const HONOURS_RE = /\b(?:with\s+honou?rs?|honou?rs?|distinction|dean'?s\s+list|gold\s+medal|silver\s+medal|rank\s+\d+)\b/i;

export function detectPerformanceFromText(text: string): PerformanceDetection {
  const trimmed = text.trim();
  const out: PerformanceDetection = {
    cgpa: '',
    gpa: '',
    percentage: '',
    grade: '',
    honours: '',
    confidence: 0,
  };

  if (!trimmed) return out;

  const cgpa = trimmed.match(CGPA_RE);
  if (cgpa?.[1]) {
    out.cgpa = cgpa[1].trim();
    out.confidence = 90;
  }

  const gpa = trimmed.match(GPA_RE);
  if (gpa?.[1] && !out.cgpa) {
    out.gpa = gpa[1].trim();
    out.confidence = Math.max(out.confidence, 85);
  }

  const pct = trimmed.match(PERCENT_RE);
  if (pct?.[1] && parseFloat(pct[1]) <= 100) {
    out.percentage = `${pct[1]}%`;
    out.confidence = Math.max(out.confidence, 82);
  }

  const grade = trimmed.match(GRADE_RE);
  if (grade?.[1]) {
    out.grade = grade[1].trim();
    out.confidence = Math.max(out.confidence, 78);
  }

  const honours = trimmed.match(HONOURS_RE);
  if (honours?.[0]) {
    out.honours = honours[0].trim();
    out.confidence = Math.max(out.confidence, 72);
  }

  return out;
}
