/**
 * Hybrid repair bridge — runs section-confidence OpenAI repair for ANY parser path.
 * Custom parser output stays primary; OpenAI only patches weak sections.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { HybridResumeAI } from '@/lib/hybrid-resume-ai';
import { normalizeUploadProfile } from '@/lib/resume-parser/normalize-extracted';
import {
  repairLowConfidenceSections,
  type SectionConfidenceRepairResult,
} from '@/lib/resume-parser/section-confidence-repair';
import {
  computeUnifiedSectionConfidence,
  selectHybridRepairTier,
  type UnifiedSectionConfidence,
} from '@/lib/resume-parser/unified-confidence-engine';
import type { DynamicDocumentAnalysis } from '@/lib/resume-parser/dynamic-document-analysis';

export interface HybridRepairBridgeInput {
  parsedData: Record<string, unknown>;
  rawText: string;
  hybridAI?: HybridResumeAI | null;
  customSectionScores?: Record<string, number>;
  documentAnalysis?: DynamicDocumentAnalysis;
}

export interface HybridRepairBridgeResult {
  parsedData: Record<string, unknown>;
  repair: SectionConfidenceRepairResult;
  unifiedScores: UnifiedSectionConfidence;
  tier: ReturnType<typeof selectHybridRepairTier>;
}

function toExtracted(
  parsedData: Record<string, unknown>,
  rawText: string
): ExtractedResumeData {
  return {
    fullName: String(parsedData.fullName || parsedData.name || ''),
    email: String(parsedData.email || ''),
    phone: String(parsedData.phone || ''),
    location: String(parsedData.location || parsedData.address || ''),
    linkedin: String(parsedData.linkedin || ''),
    portfolio: String(parsedData.portfolio || ''),
    summary: String(parsedData.summary || ''),
    skills: Array.isArray(parsedData.skills) ? (parsedData.skills as string[]) : [],
    experience: Array.isArray(parsedData.experience)
      ? (parsedData.experience as ExtractedResumeData['experience'])
      : [],
    education: Array.isArray(parsedData.education)
      ? (parsedData.education as ExtractedResumeData['education'])
      : [],
    projects: Array.isArray(parsedData.projects)
      ? (parsedData.projects as ExtractedResumeData['projects'])
      : [],
    certifications: Array.isArray(parsedData.certifications)
      ? (parsedData.certifications as ExtractedResumeData['certifications'])
      : [],
    languages: Array.isArray(parsedData.languages)
      ? (parsedData.languages as ExtractedResumeData['languages'])
      : [],
    achievements: Array.isArray(parsedData.achievements)
      ? (parsedData.achievements as string[])
      : [],
    hobbies: Array.isArray(parsedData.hobbies) ? (parsedData.hobbies as string[]) : [],
    confidence: Number(parsedData.confidence || 0),
    rawText,
  };
}

/**
 * Apply confidence-driven section repair — works for custom AND legacy parser output.
 */
export async function applyHybridSectionRepair(
  input: HybridRepairBridgeInput
): Promise<HybridRepairBridgeResult> {
  const rawText = String(input.rawText || '').trim();
  const asExtracted = toExtracted(input.parsedData, rawText);

  const unifiedScores = computeUnifiedSectionConfidence(asExtracted, {
    rawText,
    customSectionScores: input.customSectionScores,
    documentAnalysis: input.documentAnalysis,
  });
  const tier = selectHybridRepairTier(unifiedScores);

  if (tier === 'none' || rawText.length < 80) {
    return {
      parsedData: input.parsedData,
      repair: {
        data: asExtracted,
        scores: {
          summary: unifiedScores.summary,
          experience: unifiedScores.experience,
          education: unifiedScores.education,
          projects: unifiedScores.projects,
          skills: unifiedScores.skills,
          languages: unifiedScores.languages,
          certifications: unifiedScores.certifications,
          achievements: unifiedScores.achievements,
        },
        repairedSections: [],
        skipped: true,
        reason: tier === 'none' ? 'all_sections_confident' : 'raw_text_too_short',
      },
      unifiedScores,
      tier,
    };
  }

  const hybridAI = input.hybridAI ?? new HybridResumeAI();
  const repaired = await repairLowConfidenceSections(asExtracted, {
    rawText,
    hybridAI,
  });

  if (repaired.skipped || repaired.repairedSections.length === 0) {
    return {
      parsedData: input.parsedData,
      repair: repaired,
      unifiedScores,
      tier,
    };
  }

  const merged: Record<string, unknown> = {
    ...input.parsedData,
    ...repaired.data,
    fullName: repaired.data.fullName || input.parsedData.fullName,
    name: repaired.data.fullName || input.parsedData.name,
  };

  return {
    parsedData: normalizeUploadProfile(merged),
    repair: repaired,
    unifiedScores,
    tier,
  };
}

/**
 * Fill-only augmentation: add items to empty section arrays from text-recovery.
 * Never overwrites populated custom-parser fields.
 */
export async function augmentEmptySectionsOnly(
  parsedData: Record<string, unknown>,
  rawText: string
): Promise<Record<string, unknown>> {
  const text = rawText.trim();
  if (text.length < 100) return parsedData;

  const { extractResumeFromText } = await import('@/lib/resume-parser/text-recovery');
  const recovered = extractResumeFromText(text);
  const next = { ...parsedData };

  if (!Array.isArray(next.skills) || next.skills.length === 0) {
    if (recovered.skills?.length) next.skills = recovered.skills;
  }
  if (!Array.isArray(next.experience) || next.experience.length === 0) {
    if (recovered.experience?.length) next.experience = recovered.experience;
  }
  if (!Array.isArray(next.education) || next.education.length === 0) {
    if (recovered.education?.length) next.education = recovered.education;
  }
  if (!Array.isArray(next.projects) || next.projects.length === 0) {
    if (recovered.projects?.length) next.projects = recovered.projects;
  }
  if (!Array.isArray(next.certifications) || next.certifications.length === 0) {
    if (recovered.certifications?.length) next.certifications = recovered.certifications;
  }
  if (!Array.isArray(next.languages) || next.languages.length === 0) {
    if (recovered.languages?.length) next.languages = recovered.languages;
  }
  if (!String(next.summary || '').trim() && recovered.summary) {
    next.summary = recovered.summary;
  }
  if (!String(next.email || '').trim() && recovered.email) {
    next.email = recovered.email;
  }

  return normalizeUploadProfile(next);
}
