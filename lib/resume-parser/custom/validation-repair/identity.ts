/**
 * Identity validation and repair.
 */

import { isPlausiblePersonName } from '@/lib/resume-parser/import-sanitize';

import type { CustomExtractedIdentity } from '../identity-extraction/types';
import { looksLikePersonNameShape } from '../identity-extraction/name';
import type { RepairContext } from './types';
import { recordIssue, recordRepair } from './types';

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_RE = /^https?:\/\//i;

function isValidUrl(url: string): boolean {
  if (!url?.trim()) return true;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return Boolean(u.hostname);
  } catch {
    return false;
  }
}

export function validateAndRepairIdentity(
  identity: CustomExtractedIdentity | null | undefined,
  ctx: RepairContext
): CustomExtractedIdentity | null {
  if (!identity) return null;

  const fixed: CustomExtractedIdentity = { ...identity };

  if (fixed.fullName && !isPlausiblePersonName(fixed.fullName) && !looksLikePersonNameShape(fixed.fullName)) {
    recordIssue(ctx, {
      severity: 'warning',
      section: 'identity',
      field: 'fullName',
      code: 'invalid_name',
      message: 'Full name failed plausibility checks.',
    });
  }

  if (fixed.email && !EMAIL_RE.test(fixed.email)) {
    recordIssue(ctx, {
      severity: 'error',
      section: 'identity',
      field: 'email',
      code: 'invalid_email',
      message: 'Email format is invalid.',
    });
    fixed.email = '';
  }

  for (const field of ['linkedin', 'github', 'portfolio', 'website'] as const) {
    const val = fixed[field];
    if (val && !isValidUrl(val)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'identity',
        field,
        code: 'invalid_url',
        message: `${field} URL appears invalid.`,
      });
    }
  }

  if (fixed.alternatePhone && fixed.phone && fixed.alternatePhone.replace(/\D/g, '') === fixed.phone.replace(/\D/g, '')) {
    recordRepair(ctx, {
      section: 'identity',
      field: 'alternatePhone',
      originalValue: fixed.alternatePhone,
      recoveredValue: '',
      evidenceSource: 'current_section',
      confidence: 90,
      reason: 'Duplicate phone number removed.',
    });
    fixed.alternatePhone = '';
  }

  return fixed;
}

export function scoreIdentitySection(identity: CustomExtractedIdentity | null): number {
  if (!identity) return 0;
  let score = identity.confidence || 0;
  if (identity.fullName) score = Math.max(score, 40);
  if (identity.email) score = Math.max(score, 50);
  if (identity.phone) score = Math.max(score, 45);
  return Math.min(100, Math.round(score));
}
