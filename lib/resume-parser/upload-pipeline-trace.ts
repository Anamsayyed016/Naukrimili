/**
 * Server-side upload pipeline trace + profile vs formData audit.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import type { ResumeDocumentProfile } from '@/lib/resume-parser/resume-document-analysis';
import { buildFieldProvenanceReport, logFieldProvenanceReport } from '@/lib/resume-parser/field-provenance';

function preview(text: string | undefined, max = 200): string {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '(empty)';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function logUploadPipelineTrace(input: {
  reqId: string;
  rawPdfText?: string;
  ocrApplied?: boolean;
  preparedText?: string;
  layout?: ResumeDocumentProfile | null;
  affinda?: ExtractedResumeData | null;
  eden?: ExtractedResumeData | null;
  recovery?: ExtractedResumeData | null;
  aiProvider?: string;
  hybridSkippedReason?: string;
}): void {
  const label = `[upload-trace:${input.reqId}]`;
  console.log(`${label} pipeline stages`, {
    ocrApplied: input.ocrApplied ?? false,
    aiProvider: input.aiProvider || 'unknown',
    hybridSkippedReason: input.hybridSkippedReason || 'none',
    layout: input.layout
      ? { primaryType: input.layout.primaryType, types: input.layout.types, signals: input.layout.signals }
      : null,
    rawPdfTextLen: input.rawPdfText?.length ?? 0,
    rawPdfPreview: preview(input.rawPdfText),
    preparedTextLen: input.preparedText?.length ?? 0,
    preparedPreview: preview(input.preparedText),
    affindaName: preview(input.affinda?.fullName, 80),
    edenName: preview(input.eden?.fullName, 80),
    recoveryName: preview(input.recovery?.fullName, 80),
  });
}

export function logProfileFormDataAudit(
  reqId: string,
  profile: Record<string, unknown>,
  formData: Record<string, unknown>
): void {
  const label = `[upload-trace:${reqId}]`;
  const scalarFields = ['firstName', 'lastName', 'fullName', 'email', 'phone', 'location', 'summary'] as const;
  const listFields = [
    'experience',
    'education',
    'skills',
    'projects',
    'achievements',
    'certifications',
    'languages',
    'hobbies',
  ] as const;

  const diffs: Array<{ field: string; profile: string; formData: string; note: string }> = [];

  for (const field of scalarFields) {
    const p =
      field === 'fullName'
        ? String(profile.fullName || profile.name || '')
        : field === 'firstName' || field === 'lastName'
          ? String((profile.fullName || profile.name || '').split(' ')[field === 'firstName' ? 0 : 1] || '')
          : String(profile[field] || '');
    const f = String(formData[field] || '');
    if (p.trim() !== f.trim()) {
      diffs.push({
        field,
        profile: p.slice(0, 80) || '(empty)',
        formData: f.slice(0, 80) || '(empty)',
        note: 'scalar mismatch',
      });
    }
  }

  for (const field of listFields) {
    const pN = Array.isArray(profile[field]) ? profile[field].length : 0;
    const fN = Array.isArray(formData[field]) ? formData[field].length : 0;
    if (pN !== fN) {
      diffs.push({
        field,
        profile: `${pN} items`,
        formData: `${fN} items`,
        note: pN > fN ? 'formData lost items' : 'formData gained items',
      });
    }
  }

  console.log(`${label} profile vs formData audit`, {
    diffCount: diffs.length,
    diffs: diffs.length ? diffs : 'no scalar/list count mismatches',
  });
}

export function logFullUploadProvenance(input: {
  reqId: string;
  affinda?: ExtractedResumeData | null;
  eden?: ExtractedResumeData | null;
  recovery?: ExtractedResumeData | null;
  final: Record<string, unknown>;
}): void {
  logFieldProvenanceReport(buildFieldProvenanceReport(input), `[resume-provenance:${input.reqId}]`);
}
