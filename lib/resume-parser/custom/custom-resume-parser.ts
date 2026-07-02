/**
 * Custom text-only resume parser — foundation only.
 *
 * ISOLATED: not imported by ultimate-upload, merge-resume-data, or any production route.
 * Input: plain extracted text. Output: ExtractedResumeData.
 *
 * Section extractors (experience, skills, etc.) are extension points — not implemented yet.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';

import { createEmptyExtractedResumeData } from './empty-extracted';
import {
  CUSTOM_PARSER_VERSION,
  type CustomParserConfidenceReport,
  type CustomParserContext,
  type CustomParserFieldConfidence,
  type CustomParserPipelineHooks,
  type CustomParserSectionExtractor,
} from './types';

/** Minimum normalized text length before any future extractor runs. */
const MIN_TEXT_LENGTH = 30;

/** Registered section extractors — empty until integration step adds implementations. */
const SECTION_EXTRACTORS: readonly CustomParserSectionExtractor[] = [];

function buildFieldConfidenceSkeleton(): CustomParserFieldConfidence[] {
  return [
    { field: 'fullName', confidence: 0, note: 'not-implemented' },
    { field: 'email', confidence: 0, note: 'not-implemented' },
    { field: 'phone', confidence: 0, note: 'not-implemented' },
    { field: 'location', confidence: 0, note: 'not-implemented' },
    { field: 'summary', confidence: 0, extractor: 'summary', note: 'not-implemented' },
    { field: 'skills', confidence: 0, extractor: 'skills', note: 'not-implemented' },
    { field: 'experience', confidence: 0, extractor: 'experience', note: 'not-implemented' },
    { field: 'education', confidence: 0, extractor: 'education', note: 'not-implemented' },
    { field: 'projects', confidence: 0, extractor: 'projects', note: 'not-implemented' },
    { field: 'certifications', confidence: 0, extractor: 'certifications', note: 'not-implemented' },
    { field: 'languages', confidence: 0, extractor: 'languages', note: 'not-implemented' },
  ];
}

function scoreFoundationConfidence(
  ctx: CustomParserContext,
  _data: ExtractedResumeData
): CustomParserConfidenceReport {
  const fields = buildFieldConfidenceSkeleton();
  const hasUsableText = ctx.normalizedText.length >= MIN_TEXT_LENGTH;
  const overall = hasUsableText ? 0 : 0;
  return {
    overall,
    fields,
    parserVersion: ctx.parserVersion,
  };
}

function prepareParserContext(resumeText: string): CustomParserContext {
  const sourceText = resumeText ?? '';
  const { text, profile } = prepareResumeTextForParsing(sourceText);
  return {
    sourceText,
    normalizedText: text,
    documentProfile: profile,
    signals: profile.signals,
    parserVersion: CUSTOM_PARSER_VERSION,
  };
}

function runSectionExtractors(
  ctx: CustomParserContext,
  base: ExtractedResumeData
): ExtractedResumeData {
  if (!SECTION_EXTRACTORS.length || ctx.normalizedText.length < MIN_TEXT_LENGTH) {
    return base;
  }

  const ordered = [...SECTION_EXTRACTORS].sort((a, b) => a.priority - b.priority);
  let merged = base;

  for (const extractor of ordered) {
    const patch = extractor.extract(ctx, merged);
    merged = { ...merged, ...patch };
  }

  return merged;
}

function finalizeParserResult(
  ctx: CustomParserContext,
  data: ExtractedResumeData,
  confidence: CustomParserConfidenceReport
): ExtractedResumeData {
  return {
    ...data,
    rawText: ctx.normalizedText,
    confidence: confidence.overall,
  };
}

/** Internal pipeline — for future tests / orchestration within this module only. */
const customParserPipeline: CustomParserPipelineHooks = {
  prepare: prepareParserContext,
  extractors: SECTION_EXTRACTORS,
  finalize: finalizeParserResult,
};

/**
 * Parse plain resume text into ExtractedResumeData.
 *
 * Foundation: normalizes input text and returns an empty structured shell.
 * No section parsing, API calls, or mapping — safe to call in isolation.
 */
export function parseResume(resumeText: string): ExtractedResumeData {
  const ctx = customParserPipeline.prepare(resumeText);
  let data = createEmptyExtractedResumeData(ctx.normalizedText);
  data = runSectionExtractors(ctx, data);
  const confidence = scoreFoundationConfidence(ctx, data);
  return customParserPipeline.finalize(ctx, data, confidence);
}
