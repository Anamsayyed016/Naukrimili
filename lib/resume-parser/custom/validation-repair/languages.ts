/**
 * Languages and certifications validation.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

import type { RepairContext } from './types';
import { recordIssue } from './types';

export function validateLanguages(
  languages: ExtractedResumeData['languages'] | undefined,
  ctx: RepairContext
): ExtractedResumeData['languages'] {
  if (!languages?.length) return [];

  const seen = new Set<string>();
  const kept: ExtractedResumeData['languages'] = [];

  for (let i = 0; i < languages.length; i++) {
    const lang = languages[i];
    const name =
      typeof lang === 'string' ? lang.trim() : (lang.name || (lang as { language?: string }).language || '').trim();
    if (!name || name.length > 40) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'languages',
        index: i,
        code: 'invalid_language',
        message: 'Invalid language entry.',
      });
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'languages',
        index: i,
        code: 'duplicate_language',
        message: `Duplicate language: ${name}.`,
      });
      continue;
    }
    seen.add(key);
    kept.push(lang);
  }

  return kept;
}

export function validateCertifications(
  certifications: ExtractedResumeData['certifications'] | undefined,
  ctx: RepairContext
): ExtractedResumeData['certifications'] {
  if (!certifications?.length) return [];

  const seen = new Set<string>();
  const kept: ExtractedResumeData['certifications'] = [];

  for (let i = 0; i < certifications.length; i++) {
    const cert = certifications[i];
    const name = (cert.name || '').trim();
    if (!name) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'certifications',
        index: i,
        code: 'missing_cert_name',
        message: 'Certification missing name.',
      });
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'certifications',
        index: i,
        code: 'duplicate_certification',
        message: `Duplicate certification: ${name}.`,
      });
      continue;
    }
    seen.add(key);
    kept.push(cert);
  }

  return kept;
}

export function scoreLanguagesSection(languages: ExtractedResumeData['languages']): number {
  if (!languages?.length) return 0;
  return Math.min(100, 40 + languages.length * 15);
}

export function scoreCertificationsSection(
  certifications: ExtractedResumeData['certifications']
): number {
  if (!certifications?.length) return 0;
  return Math.min(100, 40 + certifications.length * 12);
}
