/**
 * Types for Skills Intelligence Engine (isolated module).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const SKILLS_INTELLIGENCE_VERSION = '1.0.0';

export type SkillSource =
  | 'skills_section'
  | 'experience'
  | 'project'
  | 'summary'
  | 'education'
  | 'certification';

export type SkillCategory =
  | 'Programming Languages'
  | 'Frameworks'
  | 'Libraries'
  | 'Databases'
  | 'Cloud'
  | 'DevOps'
  | 'Operating Systems'
  | 'Testing'
  | 'Mobile'
  | 'AI'
  | 'Data Science'
  | 'Version Control'
  | 'Soft Skills'
  | 'Office Tools'
  | 'Other';

/** Rich skill record with metadata — maps to ExtractedResumeData.skills (string[]). */
export interface IntelligentSkill {
  name: string;
  category: SkillCategory;
  categoryConfidence: number;
  confidence: number;
  importance: number;
  sources: SkillSource[];
  frequency: number;
  yearsOfUse: number | null;
  recentUsage: boolean;
}

export interface SkillCandidate {
  raw: string;
  normalized: string;
  source: SkillSource;
}

export interface SkillsIntelligenceInput {
  skillsSectionText?: string;
  /** Preamble / sidebar block before first major section (multi-column skill lists). */
  preambleText?: string;
  /** Per-experience technology lists */
  experienceTechnologies?: string[][];
  /** Per-experience description + bullet text for technology recovery */
  experienceTexts?: string[];
  /** Per-project technology lists */
  projectTechnologies?: string[][];
  summaryText?: string;
  /** Per-education degree / field / coursework text */
  educationTexts?: string[];
  /** Per-education coursework lists */
  educationCoursework?: string[][];
  certificationNames?: string[];
}

export type CanonicalSkills = ExtractedResumeData['skills'];

export interface SkillsIntelligenceResult {
  skills: IntelligentSkill[];
  canonical: CanonicalSkills;
  candidateCount: number;
  rejectedCount: number;
}

export function toCanonicalSkills(skills: IntelligentSkill[]): CanonicalSkills {
  return [...skills]
    .sort((a, b) => b.importance - a.importance || b.confidence - a.confidence)
    .map((s) => s.name);
}
