/**
 * Parser adapters — thin wrappers around existing production parsers.
 * No duplicate parser implementations.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { AffindaResumeParser } from '@/lib/affinda-resume-parser';
import { ApilayerResumeParser } from '@/lib/apilayer-resume-parser';
import { HybridResumeAI, type HybridResumeData } from '@/lib/hybrid-resume-ai';
import { isAffindaEnabled } from '@/lib/resume-parser/affinda-config';
import { isApilayerEnabled } from '@/lib/resume-parser/apilayer-config';
import {
  hasMinimalAutofillPayload,
  isAffindaPrimaryAcceptable,
  isUsableExtraction,
} from '@/lib/resume-parser/map-to-upload-profile';
import {
  mergeTextRecoveryIntoExtracted,
  resolveDocumentParserAutofill,
} from '@/lib/resume-parser/merge-resume-data';
import { extractResumeFromText } from '@/lib/resume-parser/text-recovery';
import { VALIDATION_REPAIR_VERSION } from '../validation-repair/types';
import { runCustomParserPipeline } from '../reliability/pipeline';
import type { OrchestratorConfig } from './config';
import type { OrchestratorInput, ParserAdapterResult, ParserId } from './types';

/** Maps HybridResumeData → ExtractedResumeData (mirrors ultimate-upload gate helper). */
export function hybridResumeDataToExtracted(hybrid: HybridResumeData): ExtractedResumeData {
  return {
    fullName: hybrid.personalInformation?.fullName || '',
    email: hybrid.personalInformation?.email || '',
    phone: hybrid.personalInformation?.phone || '',
    location: hybrid.personalInformation?.location || '',
    linkedin: hybrid.personalInformation?.linkedin,
    portfolio: hybrid.personalInformation?.portfolio || hybrid.personalInformation?.github,
    summary: hybrid.summary || '',
    skills: hybrid.skills || [],
    experience: (hybrid.experience || []).map((exp) => ({
      company: exp.company || '',
      position: exp.role || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      current: Boolean(exp.current),
      description: exp.description || '',
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
    })),
    education: (hybrid.education || []).map((edu) => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      field: edu.field || '',
      startDate: '',
      endDate: edu.year || '',
      gpa: edu.gpa || '',
    })),
    projects: (hybrid.projects || []).map((p) => ({
      name: p.name || '',
      description: p.description || '',
      technologies: p.technologies || [],
      url: p.url,
    })),
    certifications: (hybrid.certifications || []).map((c) => ({
      name: typeof c === 'string' ? c : String(c),
      issuer: '',
      date: '',
    })),
    languages: hybrid.languages || [],
    confidence: hybrid.confidence || 0,
    rawText: '',
  };
}

function sectionScoresFromValidation(
  sectionConfidence: Record<string, number> | undefined
): Record<string, number> {
  if (!sectionConfidence) return {};
  return { ...sectionConfidence };
}

export function passesCustomQualityGates(
  parserConfidence: number,
  resumeQuality: number,
  sectionConfidence: Record<string, number> | undefined,
  config: OrchestratorConfig,
  options?: { validationErrorCount?: number; experienceEntryCount?: number }
): { passed: boolean; reason?: string } {
  if ((options?.validationErrorCount ?? 0) > 0) {
    return {
      passed: false,
      reason: `validation failed (${options?.validationErrorCount} errors)`,
    };
  }
  if (parserConfidence < config.confidenceThreshold) {
    return {
      passed: false,
      reason: `parser confidence ${parserConfidence} < threshold ${config.confidenceThreshold}`,
    };
  }
  if (resumeQuality < config.qualityThreshold) {
    return {
      passed: false,
      reason: `resume quality ${resumeQuality} < threshold ${config.qualityThreshold}`,
    };
  }
  const identity = sectionConfidence?.identity ?? 0;
  const experience = sectionConfidence?.experience ?? 0;
  if (identity < config.minIdentityConfidence) {
    return {
      passed: false,
      reason: `identity confidence ${identity} < minimum ${config.minIdentityConfidence}`,
    };
  }
  const experienceEntries = options?.experienceEntryCount ?? 0;
  if (experienceEntries > 0 && experience < config.minExperienceConfidence) {
    return {
      passed: false,
      reason: `experience confidence ${experience} < minimum ${config.minExperienceConfidence}`,
    };
  }
  return { passed: true };
}

export async function runCustomParserAdapter(
  input: OrchestratorInput
): Promise<ParserAdapterResult> {
  const t0 = performance.now();
  const pipeline = runCustomParserPipeline(input.normalizedText);
  const sectionScores = sectionScoresFromValidation(
    pipeline.validation.validationReport.sectionConfidence as Record<string, number>
  );

  return {
    data: pipeline.validation.resume,
    parserId: 'custom',
    parserVersion: VALIDATION_REPAIR_VERSION,
    confidence: pipeline.validation.parserConfidenceScore,
    resumeQuality: pipeline.validation.resumeQualityScore,
    executionTimeMs: performance.now() - t0,
    sectionScores,
    validationErrorCount: pipeline.validation.validationReport.errors.length,
  };
}

export async function runAffindaAdapter(
  input: OrchestratorInput
): Promise<ParserAdapterResult | null> {
  if (!isAffindaEnabled() || !input.fileBuffer || !input.fileName) return null;

  const t0 = performance.now();
  const parser = new AffindaResumeParser();
  const data = await parser.parseResume(input.fileBuffer, input.fileName);

  return {
    data,
    parserId: 'affinda',
    parserVersion: 'affinda-production',
    confidence: data.confidence || 0,
    executionTimeMs: performance.now() - t0,
    sectionScores: {},
  };
}

export async function runApilayerAdapter(
  input: OrchestratorInput
): Promise<ParserAdapterResult | null> {
  if (!isApilayerEnabled() || !input.fileBuffer || !input.fileName) return null;

  const t0 = performance.now();
  const parser = new ApilayerResumeParser();
  const data = await parser.parseResume(input.fileBuffer, input.fileName);

  return {
    data,
    parserId: 'apilayer',
    parserVersion: 'apilayer-production',
    confidence: data.confidence || 0,
    executionTimeMs: performance.now() - t0,
    sectionScores: {},
  };
}

export async function runHybridAdapter(input: OrchestratorInput): Promise<ParserAdapterResult> {
  const t0 = performance.now();
  const hybridAI = new HybridResumeAI();
  const hybrid = await hybridAI.parseResumeText(input.normalizedText);
  const data = hybridResumeDataToExtracted(hybrid);

  return {
    data: { ...data, confidence: hybrid.confidence || data.confidence, rawText: input.normalizedText },
    parserId: 'hybrid',
    parserVersion: 'hybrid-production',
    confidence: hybrid.confidence || 0,
    executionTimeMs: performance.now() - t0,
    sectionScores: {},
  };
}

/**
 * Legacy production parser chain — uses existing lib functions only.
 * Mirrors ultimate-upload decision order without profile/builder mapping.
 */
export async function runLegacyProductionParser(
  input: OrchestratorInput
): Promise<ParserAdapterResult> {
  const t0 = performance.now();
  let affindaData: ExtractedResumeData | null = null;
  let selectedParser: ParserId = 'text-recovery';
  let data: ExtractedResumeData;

  if (input.fileBuffer && input.fileName && isAffindaEnabled()) {
    try {
      const affinda = await runAffindaAdapter(input);
      if (affinda) {
        affindaData = affinda.data;
        if (isAffindaPrimaryAcceptable(affinda.data, input.documentProfile ?? null)) {
          return {
            ...affinda,
            executionTimeMs: performance.now() - t0,
          };
        }
        const withText = mergeTextRecoveryIntoExtracted(affinda.data, input.normalizedText);
        if (hasMinimalAutofillPayload(withText)) {
          return {
            data: withText,
            parserId: 'affinda',
            parserVersion: 'affinda-production',
            confidence: withText.confidence || 0,
            executionTimeMs: performance.now() - t0,
            sectionScores: {},
          };
        }
      }
    } catch {
      affindaData = null;
    }
  }

  if (input.fileBuffer && input.fileName) {
    try {
      const doc = await resolveDocumentParserAutofill(
        affindaData,
        input.fileBuffer,
        input.fileName,
        input.normalizedText
      );
      if (doc?.data && isUsableExtraction(doc.data)) {
        const provider = doc.provider || 'document-autofill';
        const parserId: ParserId = provider.includes('apilayer')
          ? 'apilayer'
          : provider.includes('eden')
            ? 'eden'
            : 'document-autofill';

        return {
          data: doc.data,
          parserId,
          parserVersion: provider,
          confidence: doc.data.confidence || 0,
          executionTimeMs: performance.now() - t0,
          sectionScores: {},
        };
      }
    } catch {
      // fall through
    }
  }

  try {
    const hybrid = await runHybridAdapter(input);
    if ((hybrid.confidence || 0) >= 25 && hasMinimalAutofillPayload(hybrid.data)) {
      return {
        ...hybrid,
        executionTimeMs: performance.now() - t0,
      };
    }
  } catch {
    // fall through
  }

  data = extractResumeFromText(input.normalizedText);
  data.rawText = input.normalizedText;

  return {
    data,
    parserId: selectedParser,
    parserVersion: 'text-recovery-production',
    confidence: data.confidence || 0,
    executionTimeMs: performance.now() - t0,
    sectionScores: {},
  };
}
