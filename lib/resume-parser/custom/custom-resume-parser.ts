/**
 * Custom text-only resume parser — delegates to the reliability pipeline.
 *
 * ISOLATED: not imported by ultimate-upload unless CUSTOM_PARSER_ENABLED.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';

import { runCustomParserPipeline } from './reliability/pipeline';
import { CUSTOM_PARSER_VERSION } from './types';

/**
 * Parse plain resume text into ExtractedResumeData via the full custom pipeline.
 */
export function parseResume(resumeText: string): ExtractedResumeData {
  const { text } = prepareResumeTextForParsing(resumeText ?? '');
  const result = runCustomParserPipeline(text);
  const resume = result.validation.resume;
  return {
    ...resume,
    rawText: text,
    confidence: result.validation.parserConfidenceScore,
  };
}

export { CUSTOM_PARSER_VERSION };
