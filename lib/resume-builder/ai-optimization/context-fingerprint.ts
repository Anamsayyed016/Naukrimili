/**
 * Client-side optimization fingerprint (mirrors server orchestrator cache inputs)
 */

import { buildResumeSnapshot, normalizeExperienceLevel } from './resume-snapshot';

export interface ContextFingerprintInput {
  targetRole: string;
  industry?: string;
  experienceLevel: string;
  jobDescription: string;
  formData: Record<string, unknown>;
}

export function buildContextFingerprint(input: ContextFingerprintInput): string {
  const snapshot = buildResumeSnapshot(input.formData);
  const expLevel = normalizeExperienceLevel(input.experienceLevel, input.formData);
  const jd = (input.jobDescription || '').trim();
  const role = (input.targetRole || '').trim().toLowerCase();
  const industry = (input.industry || snapshot.industry || '').trim().toLowerCase();

  const payload = {
    role,
    industry,
    experienceLevel: expLevel,
    jd: jd.slice(0, 500),
    resume: snapshot.resumeText.slice(0, 400),
  };

  return JSON.stringify(payload);
}

export function buildResumeContentFingerprint(formData: Record<string, unknown>): string {
  const snapshot = buildResumeSnapshot(formData);
  return snapshot.resumeText.slice(0, 400);
}
