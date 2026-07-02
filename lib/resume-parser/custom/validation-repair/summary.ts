/**
 * Summary validation — ensure summary-only content.
 */

import { isSuspectSummary } from '@/lib/resume-parser/map-to-upload-profile';

import { isValidSummaryContent } from '../summary-extraction/validate';
import type { CustomExtractedSummary } from '../summary-extraction/types';
import type { RepairContext } from './types';
import { recordIssue } from './types';

const CONTACT_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const SKILL_LIST_RE =
  /^(?:python|java|react|javascript|sql|aws)(?:\s*,\s*(?:python|java|react|javascript|sql|aws)){3,}$/i;

export function validateAndRepairSummary(
  summary: CustomExtractedSummary | null | undefined,
  ctx: RepairContext
): CustomExtractedSummary | null {
  if (!summary?.summary?.trim()) return summary || null;

  const fixed: CustomExtractedSummary = { ...summary };

  if (!isValidSummaryContent(fixed.summary)) {
    recordIssue(ctx, {
      severity: 'error',
      section: 'summary',
      field: 'summary',
      code: 'invalid_summary',
      message: 'Summary failed content validation.',
    });
    fixed.summary = '';
    fixed.confidence = 0;
    return fixed;
  }

  if (isSuspectSummary(fixed.summary)) {
    recordIssue(ctx, {
      severity: 'manual_review',
      section: 'summary',
      field: 'summary',
      code: 'suspect_summary',
      message: 'Summary may contain non-summary content (cover letter, embedded sections).',
    });
  }

  if (CONTACT_RE.test(fixed.summary) && fixed.summary.length < 200) {
    recordIssue(ctx, {
      severity: 'warning',
      section: 'summary',
      code: 'contact_in_summary',
      message: 'Contact information detected inside summary.',
    });
  }

  const firstLine = fixed.summary.split('\n')[0]?.trim() || '';
  if (SKILL_LIST_RE.test(firstLine)) {
    recordIssue(ctx, {
      severity: 'error',
      section: 'summary',
      code: 'skills_in_summary',
      message: 'Skill list detected where summary expected.',
    });
    fixed.summary = '';
  }

  return fixed;
}

export function scoreSummarySection(summary: CustomExtractedSummary | null): number {
  if (!summary?.summary?.trim()) return 0;
  return Math.min(100, summary.confidence || 0);
}
