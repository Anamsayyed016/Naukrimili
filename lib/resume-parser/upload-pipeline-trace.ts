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

export interface UploadStageTimings {
  textExtractionMs?: number;
  ocrMs?: number;
  affindaMs?: number;
  edenMs?: number;
  apilayerMs?: number;
  aiExtractionMs?: number;
  totalProcessingMs?: number;
  parserBudgetMs?: number;
  parserBudgetRemainingMs?: number;
}

/** Tracks per-stage durations for upload pipeline diagnostics. */
export class UploadPipelineTiming {
  private readonly pipelineStart = Date.now();
  readonly stages: UploadStageTimings = {};

  record(stage: keyof UploadStageTimings, ms: number): void {
    const key = stage as keyof UploadStageTimings;
    const current = this.stages[key];
    if (typeof current === 'number') {
      (this.stages as Record<string, number>)[key] = current + ms;
    } else {
      (this.stages as Record<string, number>)[key] = ms;
    }
  }

  async measure<T>(stage: keyof UploadStageTimings, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      this.record(stage, Date.now() - start);
    }
  }

  finalize(parserBudget?: ParserTimeBudget): void {
    this.stages.totalProcessingMs = Date.now() - this.pipelineStart;
    if (parserBudget) {
      this.stages.parserBudgetMs = parserBudget.budgetMs;
      this.stages.parserBudgetRemainingMs = parserBudget.remainingMs();
    }
  }

  log(reqId: string): void {
    console.log(`[upload-timing:${reqId}]`, this.stages);
  }
}

/** Soft cap for serial document-parser calls — keeps uploads under typical nginx limits. */
export class ParserTimeBudget {
  readonly budgetMs: number;
  private readonly start = Date.now();

  constructor(budgetMs: number) {
    this.budgetMs = budgetMs;
  }

  elapsedMs(): number {
    return Date.now() - this.start;
  }

  remainingMs(): number {
    return Math.max(0, this.budgetMs - this.elapsedMs());
  }

  isExceeded(): boolean {
    return this.remainingMs() <= 0;
  }

  shouldRunNextParser(minReserveMs = 5000): boolean {
    return this.remainingMs() > minReserveMs;
  }
}

export function getUploadParserBudgetMs(): number {
  const parsed = parseInt(process.env.UPLOAD_PARSER_BUDGET_MS || '75000', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 75000;
}
