/**
 * Field-level provenance logging for resume upload pipeline (server-side only).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { isPlausiblePersonName } from '@/lib/resume-parser/import-sanitize';

export interface FieldProvenanceEntry {
  field: string;
  affinda: string;
  eden: string;
  recovery: string;
  final: string;
  sourceSelected: string;
  reasonSelected: string;
  reasonRejected: string;
}

function previewScalar(value: unknown, max = 120): string {
  const s = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return '(empty)';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function previewList(items: unknown[] | undefined, label: string): string {
  const n = items?.length ?? 0;
  if (!n) return '(empty)';
  return `${n} ${label}`;
}

function pickScalarSource(
  affinda: string,
  eden: string,
  recovery: string,
  final: string
): { source: string; reason: string; rejected: string } {
  const parts: string[] = [];
  if (affinda && affinda !== final) parts.push(`affinda="${affinda}"`);
  if (eden && eden !== final && eden !== affinda) parts.push(`eden="${eden}"`);
  if (recovery && recovery !== final && recovery !== affinda && recovery !== eden) {
    parts.push(`recovery="${recovery}"`);
  }

  if (!final || final === '(empty)') {
    return {
      source: 'none',
      reason: 'no valid value after merge',
      rejected: parts.join('; ') || 'all sources empty',
    };
  }
  if (final === affinda && affinda) {
    return { source: 'affinda', reason: 'affinda populated', rejected: parts.join('; ') || 'none' };
  }
  if (final === eden && eden) {
    return { source: 'eden', reason: 'eden filled gap or won confidence', rejected: parts.join('; ') || 'none' };
  }
  if (final === recovery && recovery) {
    return { source: 'recovery', reason: 'text-recovery filled gap', rejected: parts.join('; ') || 'none' };
  }
  return {
    source: 'merged',
    reason: 'combined or post-processed',
    rejected: parts.filter((p) => !final.includes(p.split('=')[1]?.replace(/"/g, '') || '')).join('; ') || 'none',
  };
}

export function buildFieldProvenanceReport(input: {
  affinda?: ExtractedResumeData | null;
  eden?: ExtractedResumeData | null;
  recovery?: ExtractedResumeData | null;
  final: Record<string, unknown>;
}): FieldProvenanceEntry[] {
  const a = input.affinda;
  const e = input.eden;
  const r = input.recovery;
  const f = input.final;

  const scalarFields: Array<{
    field: string;
    affinda: string;
    eden: string;
    recovery: string;
    final: string;
  }> = [
    {
      field: 'fullName',
      affinda: previewScalar(a?.fullName),
      eden: previewScalar(e?.fullName),
      recovery: previewScalar(r?.fullName),
      final: previewScalar(f.fullName || f.name),
    },
    {
      field: 'email',
      affinda: previewScalar(a?.email),
      eden: previewScalar(e?.email),
      recovery: previewScalar(r?.email),
      final: previewScalar(f.email),
    },
    {
      field: 'phone',
      affinda: previewScalar(a?.phone),
      eden: previewScalar(e?.phone),
      recovery: previewScalar(r?.phone),
      final: previewScalar(f.phone),
    },
    {
      field: 'location',
      affinda: previewScalar(a?.location),
      eden: previewScalar(e?.location),
      recovery: previewScalar(r?.location),
      final: previewScalar(f.location || f.address),
    },
    {
      field: 'summary',
      affinda: previewScalar(a?.summary, 80),
      eden: previewScalar(e?.summary, 80),
      recovery: previewScalar(r?.summary, 80),
      final: previewScalar(f.summary, 80),
    },
  ];

  const entries: FieldProvenanceEntry[] = scalarFields.map((row) => {
    const pick = pickScalarSource(row.affinda, row.eden, row.recovery, row.final);
    if (row.field === 'fullName') {
      if (row.affinda !== '(empty)' && !isPlausiblePersonName(row.affinda.replace(/…$/, ''))) {
        pick.rejected = [pick.rejected, `affinda name failed plausibility: "${row.affinda}"`]
          .filter(Boolean)
          .join('; ');
      }
    }
    return {
      field: row.field,
      affinda: row.affinda,
      eden: row.eden,
      recovery: row.recovery,
      final: row.final,
      sourceSelected: pick.source,
      reasonSelected: pick.reason,
      reasonRejected: pick.rejected,
    };
  });

  const listFields = [
    ['experience', 'entries'],
    ['education', 'entries'],
    ['skills', 'items'],
    ['projects', 'items'],
    ['certifications', 'items'],
    ['achievements', 'items'],
    ['languages', 'items'],
    ['hobbies', 'items'],
  ] as const;

  for (const [field, label] of listFields) {
    const affindaN = (a as Record<string, unknown>)?.[field];
    const edenN = (e as Record<string, unknown>)?.[field];
    const recoveryN = (r as Record<string, unknown>)?.[field];
    const finalN = f[field];
    const pick = pickScalarSource(
      previewList(Array.isArray(affindaN) ? affindaN : [], label),
      previewList(Array.isArray(edenN) ? edenN : [], label),
      previewList(Array.isArray(recoveryN) ? recoveryN : [], label),
      previewList(Array.isArray(finalN) ? finalN : [], label)
    );
    entries.push({
      field,
      affinda: previewList(Array.isArray(affindaN) ? affindaN : [], label),
      eden: previewList(Array.isArray(edenN) ? edenN : [], label),
      recovery: previewList(Array.isArray(recoveryN) ? recoveryN : [], label),
      final: previewList(Array.isArray(finalN) ? finalN : [], label),
      sourceSelected: pick.source,
      reasonSelected: pick.reason,
      reasonRejected: pick.rejected,
    });
  }

  return entries;
}

export function logFieldProvenanceReport(
  report: FieldProvenanceEntry[],
  label = '[resume-provenance]'
): void {
  console.log(`${label} field provenance (${report.length} fields):`);
  for (const row of report) {
    console.log(`${label} ${row.field}`, {
      affinda: row.affinda,
      eden: row.eden,
      recovery: row.recovery,
      final: row.final,
      sourceSelected: row.sourceSelected,
      reasonSelected: row.reasonSelected,
      reasonRejected: row.reasonRejected,
    });
  }
}
