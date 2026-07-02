/**
 * Serialization — full internal snapshot vs builder-clean export.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

import { freezeCanonicalResume } from './immutable';
import type { CanonicalResume, CanonicalResumeSnapshot } from './types';

/** Full canonical graph including metadata (internal pipeline use). */
export function serializeCanonicalResume(resume: CanonicalResume): string {
  const snapshot: CanonicalResumeSnapshot = {
    version: resume.version,
    identity: { ...resume.identity, data: { ...resume.identity.data } },
    summary: { ...resume.summary, data: { ...resume.summary.data } },
    experience: resume.experience.map((n) => ({
      id: n.id,
      data: { ...n.data, achievements: [...n.data.achievements] },
    })),
    projects: resume.projects.map((n) => ({
      id: n.id,
      data: { ...n.data, technologies: [...n.data.technologies] },
    })),
    education: resume.education.map((n) => ({ id: n.id, data: { ...n.data } })),
    skills: resume.skills.map((n) => ({ id: n.id, data: { ...n.data } })),
    languages: resume.languages.map((n) => ({ id: n.id, data: { ...n.data } })),
    certifications: resume.certifications.map((n) => ({ id: n.id, data: { ...n.data } })),
    metadata: JSON.parse(JSON.stringify(resume.metadata)),
  };

  return JSON.stringify(snapshot);
}

export function deserializeCanonicalResume(json: string): CanonicalResume {
  const parsed = JSON.parse(json) as CanonicalResumeSnapshot;
  return freezeCanonicalResume(parsed as CanonicalResume);
}

/**
 * Clean resume for Builder / templates / preview — no ids, no metadata.
 * Reuses ExtractedResumeData schema exactly.
 */
export function toExtractedResumeData(resume: CanonicalResume): ExtractedResumeData {
  return {
    fullName: resume.identity.data.fullName,
    email: resume.identity.data.email,
    phone: resume.identity.data.phone,
    location: resume.identity.data.location || '',
    linkedin: resume.identity.data.linkedin,
    portfolio: resume.identity.data.portfolio,
    summary: resume.summary.data.summary,
    skills: resume.skills.map((s) => s.data.name),
    experience: resume.experience.map((n) => ({
      company: n.data.company,
      position: n.data.position,
      location: n.data.location,
      startDate: n.data.startDate,
      endDate: n.data.endDate,
      current: n.data.current,
      description: n.data.description,
      achievements: [...n.data.achievements],
    })),
    education: resume.education.map((n) => ({
      institution: n.data.institution,
      degree: n.data.degree,
      field: n.data.field,
      startDate: n.data.startDate,
      endDate: n.data.endDate,
      gpa: n.data.gpa,
      description: n.data.description,
    })),
    projects: resume.projects.map((n) => ({
      name: n.data.name,
      description: n.data.description,
      technologies: [...n.data.technologies],
      url: n.data.url,
      startDate: n.data.startDate,
      endDate: n.data.endDate,
    })),
    certifications: resume.certifications.map((n) => ({
      name: n.data.name,
      issuer: n.data.issuer,
      date: n.data.date,
      url: n.data.url,
    })),
    languages: resume.languages.map((n) =>
      n.data.proficiency
        ? { name: n.data.name, proficiency: n.data.proficiency }
        : n.data.name
    ),
    confidence: resume.metadata.quality.parserConfidenceScore,
    rawText: resume.metadata.parser.rawText || '',
  };
}

/** Builder-safe JSON — ExtractedResumeData only, deterministic key order. */
export function serializeBuilderResume(resume: CanonicalResume): string {
  return JSON.stringify(toExtractedResumeData(resume));
}

export function parseBuilderResume(json: string): ExtractedResumeData {
  return JSON.parse(json) as ExtractedResumeData;
}
