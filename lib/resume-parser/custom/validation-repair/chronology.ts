/**
 * Chronology validation — experience, education, project timelines.
 */

import { parseDateRangeFromText } from '../experience-extraction/dates';
import type { CustomExtractedEducation } from '../education-extraction/types';
import type { CustomExtractedExperience } from '../experience-extraction/types';
import type { CustomExtractedProject } from '../project-extraction/types';
import type { RepairContext } from './types';
import { recordIssue } from './types';

const CURRENT_YEAR = new Date().getFullYear();

interface DateSpan {
  start: number;
  end: number;
  current: boolean;
  label: string;
  section: string;
  index: number;
}

function yearFromIsoOrText(date: string | null | undefined): number | null {
  if (!date) return null;
  const m = date.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

function spanFromDates(
  startDate: string | null,
  endDate: string | null,
  current: boolean,
  label: string,
  section: string,
  index: number
): DateSpan | null {
  const start = yearFromIsoOrText(startDate);
  if (start === null) return null;

  let end = current ? CURRENT_YEAR : yearFromIsoOrText(endDate);
  if (end === null && !current) end = start;
  if (end !== null && end < start) {
    return { start, end: start, current, label, section, index };
  }

  return { start, end: end ?? start, current, label, section, index };
}

function collectExperienceSpans(experiences: CustomExtractedExperience[]): DateSpan[] {
  const spans: DateSpan[] = [];
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const span = spanFromDates(
      exp.startDate,
      exp.endDate,
      exp.current,
      `${exp.company || exp.designation || 'role'}`,
      'experience',
      i
    );
    if (span) spans.push(span);
  }
  return spans;
}

function collectEducationSpans(educations: CustomExtractedEducation[]): DateSpan[] {
  const spans: DateSpan[] = [];
  for (let i = 0; i < educations.length; i++) {
    const edu = educations[i];
    const span = spanFromDates(
      edu.startDate,
      edu.endDate,
      edu.current,
      `${edu.institution || edu.degree || 'education'}`,
      'education',
      i
    );
    if (span) spans.push(span);
  }
  return spans;
}

function collectProjectSpans(projects: CustomExtractedProject[]): DateSpan[] {
  const spans: DateSpan[] = [];
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const parsed = p.duration ? parseDateRangeFromText(p.duration) : null;
    if (!parsed) continue;
    const span = spanFromDates(
      parsed.startDate,
      parsed.endDate,
      parsed.current,
      p.title || 'project',
      'projects',
      i
    );
    if (span) spans.push(span);
  }
  return spans;
}

function spansOverlap(a: DateSpan, b: DateSpan): boolean {
  if (a.section !== 'experience' || b.section !== 'experience') return false;
  return a.start <= b.end && b.start <= a.end;
}

export function validateChronology(
  experiences: CustomExtractedExperience[],
  educations: CustomExtractedEducation[],
  projects: CustomExtractedProject[],
  ctx: RepairContext
): void {
  const expSpans = collectExperienceSpans(experiences);

  for (const span of expSpans) {
    if (span.start > CURRENT_YEAR + 1) {
      recordIssue(ctx, {
        severity: 'error',
        section: 'experience',
        index: span.index,
        code: 'future_start_date',
        message: `Experience start date in the future: ${span.label}.`,
      });
    }
    if (!span.current && span.end > CURRENT_YEAR && span.section === 'experience') {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'experience',
        index: span.index,
        code: 'future_end_date',
        message: `Experience end date in the future: ${span.label}.`,
      });
    }
  }

  for (const span of collectEducationSpans(educations)) {
    if (span.start > CURRENT_YEAR + 6) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'education',
        index: span.index,
        code: 'future_education_start',
        message: `Education start date unusually far in the future: ${span.label}.`,
      });
    }
    if (!span.current && span.end > CURRENT_YEAR + 2) {
      recordIssue(ctx, {
        severity: 'manual_review',
        section: 'education',
        index: span.index,
        code: 'future_graduation',
        message: `Expected graduation date in the future: ${span.label}.`,
      });
    }
  }

  for (let i = 0; i < expSpans.length; i++) {
    for (let j = i + 1; j < expSpans.length; j++) {
      if (spansOverlap(expSpans[i], expSpans[j])) {
        recordIssue(ctx, {
          severity: 'warning',
          section: 'experience',
          index: expSpans[j].index,
          code: 'overlapping_employment',
          message: `Overlapping employment: "${expSpans[i].label}" and "${expSpans[j].label}".`,
        });
      }
    }
  }

  for (const span of collectProjectSpans(projects)) {
    if (span.start > CURRENT_YEAR + 1) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'projects',
        index: span.index,
        code: 'future_project_date',
        message: `Project date in the future: ${span.label}.`,
      });
    }
  }
}
