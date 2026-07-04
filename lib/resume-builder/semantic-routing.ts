/**
 * Semantic routing — maps classified sections and canonical nodes to Builder fields.
 */

import {
  classifySectionHeading,
  type BuilderTarget,
  type SemanticSectionDefinition,
} from '@/lib/resume-builder/semantic-registry';
import type { CanonicalFieldNode } from '@/lib/resume-builder/canonical-mapping/types';
import type { ExtendedBuilderSections } from '@/lib/resume-builder/canonical-mapping/types';
import { emptyExtendedBuilderSections } from '@/lib/resume-builder/canonical-mapping/types';
import { splitBullets } from '@/lib/resume-parser/normalize-extracted';

export function resolveBuilderTargetForHeading(heading: string): {
  target: BuilderTarget;
  definition: SemanticSectionDefinition;
  confidence: number;
} | null {
  const classified = classifySectionHeading(heading);
  if (!classified) return null;
  return {
    target: classified.definition.builderTarget,
    definition: classified.definition,
    confidence: classified.confidence,
  };
}

function mergeUniqueStrings(arr: string[], items: string[]) {
  const seen = new Set(arr.map((s) => s.toLowerCase()));
  for (const item of items) {
    const t = item.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      arr.push(t);
    }
  }
}

function bodyToLines(body: string): string[] {
  return splitBullets(body)
    .map((l) => l.replace(/^[\s\-–—*•·]+/, '').trim())
    .filter((l) => l.length >= 2);
}

/** Route section body text into extended or standard builder buckets (non-destructive merge). */
export function routeSectionBodyToBuilder(
  builder: Record<string, unknown>,
  heading: string,
  body: string,
  confidence: number
): Record<string, unknown> {
  const routed = resolveBuilderTargetForHeading(heading);
  if (!routed || !body.trim()) {
    const extended = {
      ...emptyExtendedBuilderSections(),
      ...(typeof builder.extendedSections === 'object'
        ? (builder.extendedSections as ExtendedBuilderSections)
        : {}),
    };
    extended.extraSections.push({ heading, body: body.trim() });
    return {
      ...builder,
      extendedSections: extended,
      extraSections: extended.extraSections,
    };
  }

  const { target, definition } = routed;
  const lines = bodyToLines(body);
  const next = { ...builder };

  if (target.kind === 'standard') {
    const field = target.field;
    if (field === 'summary') {
      const prev = String(next.summary || next.bio || '').trim();
      next.summary = prev ? `${prev}\n\n${body.trim()}` : body.trim();
      next.bio = next.summary;
    } else if (field === 'skills') {
      const prev = Array.isArray(next.skills) ? (next.skills as string[]) : [];
      next.skills = [...prev, ...lines];
    } else if (field === 'achievements') {
      const prev = Array.isArray(next.achievements) ? (next.achievements as string[]) : [];
      next.achievements = [...prev, ...lines];
    } else if (field === 'hobbies') {
      const prev = Array.isArray(next.hobbies) ? (next.hobbies as string[]) : [];
      next.hobbies = [...prev, ...lines];
    }
    return next;
  }

  if (target.kind === 'experience_body') {
    const exp = Array.isArray(next.experience) ? [...(next.experience as Record<string, unknown>[])] : [];
    if (exp.length === 0) {
      exp.push({ title: '', company: '', description: body.trim() });
    } else {
      const last = { ...exp[exp.length - 1] };
      const prevDesc = String(last.description ?? '').trim();
      last.description = prevDesc ? `${prevDesc}\n\n${body.trim()}` : body.trim();
      exp[exp.length - 1] = last;
    }
    next.experience = exp;
    next['Work Experience'] = exp;
    return next;
  }

  if (target.kind === 'extended') {
    const extended: ExtendedBuilderSections = {
      ...emptyExtendedBuilderSections(),
      ...(typeof next.extendedSections === 'object'
        ? (next.extendedSections as ExtendedBuilderSections)
        : {}),
    };
    const fieldKey = target.field;
    if (fieldKey === 'declaration') {
      extended.declaration = body.trim();
    } else if (fieldKey === 'personalDetails') {
      extended.personalDetails[heading] = body.trim();
    } else if (Array.isArray(extended[fieldKey])) {
      mergeUniqueStrings(extended[fieldKey] as string[], lines.length ? lines : [body.trim()]);
    }
    next.extendedSections = extended;
    next[fieldKey] = extended[fieldKey];
    next._semanticRoute = { heading, definitionId: definition.id, confidence };
    return next;
  }

  return next;
}

/** Route a canonical node into builder using semantic registry when type is ambiguous. */
export function routeNodeToExtendedBucket(
  extended: ExtendedBuilderSections,
  node: CanonicalFieldNode
): ExtendedBuilderSections {
  const out = { ...extended, personalDetails: { ...extended.personalDetails } };
  const val = node.value.trim();
  if (!val) return out;

  switch (node.type) {
    case 'AWARD':
      mergeUniqueStrings(out.awards, [val]);
      break;
    case 'PUBLICATION':
      mergeUniqueStrings(out.publications, [val]);
      break;
    case 'PATENT':
      mergeUniqueStrings(out.patents, [val]);
      break;
    case 'VOLUNTEER':
      mergeUniqueStrings(out.volunteer, [val]);
      break;
    case 'MEMBERSHIP':
      mergeUniqueStrings(out.memberships, [val]);
      break;
    case 'TRAINING':
      mergeUniqueStrings(out.training, [val]);
      break;
    case 'RESEARCH':
      mergeUniqueStrings(out.research, [val]);
      break;
    case 'CORE_SKILL':
      mergeUniqueStrings(out.coreCompetencies, [val]);
      break;
    case 'SOFT_SKILL':
      mergeUniqueStrings(out.softSkills, [val]);
      break;
    case 'TECHNICAL_SKILL':
    case 'TOOLS':
    case 'FRAMEWORK':
    case 'DATABASE':
      mergeUniqueStrings(out.technicalSkills, [val]);
      break;
    case 'STRENGTH':
      mergeUniqueStrings(out.strengths, [val]);
      break;
    case 'INDUSTRY_EXPERTISE':
      mergeUniqueStrings(out.industryExpertise, [val]);
      break;
    case 'SEMANTIC_SECTION': {
      const sec = `${node.section} ${node.source}`.toLowerCase();
      if (/highlight/.test(sec)) mergeUniqueStrings(out.professionalHighlights, [val]);
      else if (/qualification/.test(sec)) mergeUniqueStrings(out.professionalQualifications, [val]);
      break;
    }
    case 'DECLARATION':
      out.declaration = val;
      break;
    default:
      break;
  }
  return out;
}

export { classifySectionHeading };
