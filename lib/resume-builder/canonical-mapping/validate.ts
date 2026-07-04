/**
 * Validate canonical nodes — reject misplacements and repair types.
 */

import {
  isExperienceDateOrDurationToken,
  isPlausibleExperienceCompany,
  looksLikeCompanyNameLine,
  looksLikeJobTitleLine,
  sanitizeExperienceCompanyValue,
  sanitizeFieldText,
  stripRedundantCompanyFromPosition,
} from '@/lib/resume-parser/import-sanitize';
import { classifyResumeTextFragment } from '@/lib/resume-parser/field-classification';
import type { CanonicalFieldNode, CanonicalNodeType } from './types';

export interface NodeValidationResult {
  nodes: CanonicalFieldNode[];
  rejected: string[];
  repaired: string[];
}

function isInvalidJobTitle(value: string): boolean {
  const v = sanitizeFieldText(value, 160);
  if (!v) return true;
  if (isExperienceDateOrDurationToken(v)) return true;
  if (isPlausibleExperienceCompany(v) && looksLikeCompanyNameLine(v)) return true;
  if (/\b(19|20)\d{2}\b/.test(v) && v.length < 24) return true;
  return false;
}

function isInvalidCompany(value: string): boolean {
  const v = sanitizeExperienceCompanyValue(value);
  if (!v) return true;
  if (looksLikeJobTitleLine(v) && !looksLikeCompanyNameLine(v)) return true;
  return false;
}

function isInvalidSummary(value: string): boolean {
  const v = sanitizeFieldText(value, 4000);
  if (!v || v.length < 20) return false;
  if (
    /\b(work experience|professional experience|employment history|certifications?|projects?)\s*:/i.test(
      v
    ) &&
    v.length > 200
  ) {
    return true;
  }
  return false;
}

function reclassifyNode(node: CanonicalFieldNode): CanonicalFieldNode {
  const classified = classifyResumeTextFragment(node.value);
  const typeMap: Partial<Record<string, CanonicalNodeType>> = {
    PERSON_NAME: 'PERSON_NAME',
    DESIGNATION: 'JOB_TITLE',
    COMPANY_NAME: 'COMPANY',
    LOCATION: 'LOCATION',
    SKILL: 'TECHNICAL_SKILL',
    CERTIFICATION: 'CERTIFICATION',
    ACHIEVEMENT: 'ACHIEVEMENT',
    EDUCATION: 'EDUCATION',
    PROJECT_NAME: 'PROJECT',
  };
  const mapped = typeMap[classified.kind];
  if (mapped && mapped !== node.type) {
    return { ...node, type: mapped, confidence: Math.max(node.confidence, classified.confidence) };
  }
  return node;
}

export function validateCanonicalNodes(nodes: CanonicalFieldNode[]): NodeValidationResult {
  const rejected: string[] = [];
  const repaired: string[] = [];
  const valid: CanonicalFieldNode[] = [];

  const experienceParents = nodes.filter((n) => n.type === 'EXPERIENCE');
  const companyByParent = new Map<string, string>();
  const titleByParent = new Map<string, string>();

  for (const node of nodes) {
    let current = { ...node };

    if (current.type === 'JOB_TITLE' && isInvalidJobTitle(current.value)) {
      if (looksLikeCompanyNameLine(current.value)) {
        current.type = 'COMPANY';
        repaired.push(`${current.source}:title→company`);
      } else {
        rejected.push(`${current.source}:invalid-title:${current.value.slice(0, 40)}`);
        continue;
      }
    }

    if (
      (current.type === 'COMPANY' || current.type === 'ORGANIZATION' || current.type === 'EMPLOYER') &&
      isInvalidCompany(current.value)
    ) {
      rejected.push(`${current.source}:invalid-company:${current.value.slice(0, 40)}`);
      continue;
    }

    if (current.type === 'SUMMARY' && isInvalidSummary(current.value)) {
      rejected.push(`${current.source}:summary-section-bleed`);
      continue;
    }

    if (current.type === 'TECHNICAL_SKILL' && current.section.includes('hobbies')) {
      current.type = 'HOBBY';
      repaired.push(`${current.source}:skill→hobby`);
    }
    if (current.type === 'HOBBY' && current.section.includes('skills')) {
      current.type = 'TECHNICAL_SKILL';
      repaired.push(`${current.source}:hobby→skill`);
    }
    if (current.type === 'EDUCATION' && current.section.includes('certifications')) {
      current.type = 'CERTIFICATION';
      repaired.push(`${current.source}:education→certification`);
    }

    if (current.type === 'UNKNOWN' || current.confidence < 60) {
      const reclassified = reclassifyNode(current);
      if (reclassified.type !== current.type) {
        repaired.push(`${current.source}:${current.type}→${reclassified.type}`);
        current = reclassified;
      }
    }

    if (current.parent && (current.type === 'COMPANY' || current.type === 'ORGANIZATION')) {
      companyByParent.set(current.parent, current.value);
    }
    if (current.parent && current.type === 'JOB_TITLE') {
      titleByParent.set(current.parent, current.value);
    }

    valid.push(current);
  }

  for (const parent of experienceParents) {
    const company = companyByParent.get(parent.id) || '';
    const title = titleByParent.get(parent.id) || '';
    if (company && title) {
      const cleaned = stripRedundantCompanyFromPosition(title, company);
      if (cleaned !== title) {
        const idx = valid.findIndex((n) => n.parent === parent.id && n.type === 'JOB_TITLE');
        if (idx >= 0) {
          valid[idx] = { ...valid[idx], value: cleaned };
          repaired.push(`${valid[idx].source}:strip-company-from-title`);
        }
      }
    }
  }

  return { nodes: valid, rejected, repaired };
}
