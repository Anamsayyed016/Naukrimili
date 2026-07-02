/**
 * Node factories — attach deterministic ids to ExtractedResumeData-shaped payloads.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

import {
  certificationNodeId,
  educationNodeId,
  experienceNodeId,
  identityNodeId,
  languageNodeId,
  projectNodeId,
  skillNodeId,
  summaryNodeId,
} from './ids';
import type {
  CanonicalCertificationData,
  CanonicalCertificationNode,
  CanonicalEducationData,
  CanonicalEducationNode,
  CanonicalExperienceData,
  CanonicalExperienceNode,
  CanonicalIdentityData,
  CanonicalIdentityNode,
  CanonicalLanguageData,
  CanonicalLanguageNode,
  CanonicalProjectData,
  CanonicalProjectNode,
  CanonicalSkillData,
  CanonicalSkillNode,
  CanonicalSummaryData,
  CanonicalSummaryNode,
} from './types';

export function createIdentityNode(data: CanonicalIdentityData): CanonicalIdentityNode {
  return {
    id: identityNodeId(data),
    data: {
      fullName: data.fullName || '',
      email: data.email || '',
      phone: data.phone || '',
      location: data.location,
      linkedin: data.linkedin,
      portfolio: data.portfolio,
    },
  };
}

export function createSummaryNode(data: CanonicalSummaryData): CanonicalSummaryNode {
  return {
    id: summaryNodeId(data.summary || ''),
    data: { summary: data.summary || '' },
  };
}

export function createExperienceNode(
  index: number,
  data: CanonicalExperienceData
): CanonicalExperienceNode {
  return {
    id: experienceNodeId(index, data),
    data: {
      company: data.company || '',
      position: data.position || '',
      location: data.location,
      startDate: data.startDate || '',
      endDate: data.endDate,
      current: Boolean(data.current),
      description: data.description || '',
      achievements: [...(data.achievements || [])],
    },
  };
}

export function createProjectNode(index: number, data: CanonicalProjectData): CanonicalProjectNode {
  return {
    id: projectNodeId(index, data),
    data: {
      name: data.name || '',
      description: data.description || '',
      technologies: [...(data.technologies || [])],
      url: data.url,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  };
}

export function createEducationNode(
  index: number,
  data: CanonicalEducationData
): CanonicalEducationNode {
  return {
    id: educationNodeId(index, data),
    data: {
      institution: data.institution || '',
      degree: data.degree || '',
      field: data.field || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      gpa: data.gpa,
      description: data.description,
    },
  };
}

export function createSkillNode(index: number, data: CanonicalSkillData): CanonicalSkillNode {
  const name = (data.name || '').trim();
  return {
    id: skillNodeId(index, name),
    data: { name },
  };
}

export function normalizeLanguageEntry(
  entry: string | { name: string; proficiency?: string },
  index: number
): CanonicalLanguageNode {
  const data: CanonicalLanguageData =
    typeof entry === 'string'
      ? { name: entry.trim() }
      : { name: (entry.name || '').trim(), proficiency: entry.proficiency };

  return {
    id: languageNodeId(index, data.name, data.proficiency),
    data,
  };
}

export function createCertificationNode(
  index: number,
  data: CanonicalCertificationData
): CanonicalCertificationNode {
  return {
    id: certificationNodeId(index, data),
    data: {
      name: data.name || '',
      issuer: data.issuer || '',
      date: data.date || '',
      url: data.url,
    },
  };
}

export function languagesFromExtracted(
  languages: ExtractedResumeData['languages'] | undefined
): CanonicalLanguageNode[] {
  if (!languages?.length) return [];
  return languages.map((entry, index) => normalizeLanguageEntry(entry, index));
}
