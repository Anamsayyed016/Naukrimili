/**
 * Skills validation — alias normalize, dedupe, reject misclassified entries.
 */

import { normalizeSkillAlias, skillDedupeKey } from '../skills-intelligence/aliases';
import { isValidSkillCandidate } from '../skills-intelligence/validate';
import type { IntelligentSkill } from '../skills-intelligence/types';
import type { RepairContext } from './types';
import { recordIssue, recordRepair } from './types';

export function validateAndRepairSkills(
  skills: IntelligentSkill[] | undefined,
  ctx: RepairContext
): IntelligentSkill[] {
  if (!skills?.length) return [];

  const kept: IntelligentSkill[] = [];
  const seen = new Map<string, IntelligentSkill>();

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const raw = skill.name;

    if (!isValidSkillCandidate(raw)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'skills',
        field: 'name',
        index: i,
        code: 'invalid_skill',
        message: `Skill rejected: "${raw}".`,
      });
      continue;
    }

    const normalized = normalizeSkillAlias(raw);
    if (normalized !== raw) {
      recordRepair(ctx, {
        section: 'skills',
        field: 'name',
        index: i,
        originalValue: raw,
        recoveredValue: normalized,
        evidenceSource: 'parser_aliases',
        confidence: 85,
        reason: 'Normalized skill alias to canonical form.',
      });
    } else if (skill.rawForms?.length) {
      for (const alias of skill.rawForms) {
        const aliasNorm = normalizeSkillAlias(alias);
        if (aliasNorm !== alias) {
          recordRepair(ctx, {
            section: 'skills',
            field: 'name',
            index: i,
            originalValue: alias,
            recoveredValue: aliasNorm,
            evidenceSource: 'parser_aliases',
            confidence: 85,
            reason: 'Normalized skill alias to canonical form.',
          });
          break;
        }
      }
    }

    const key = skillDedupeKey(normalized);
    const existing = seen.get(key);
    if (existing) {
      recordRepair(ctx, {
        section: 'skills',
        field: 'name',
        index: i,
        originalValue: raw,
        recoveredValue: normalized,
        evidenceSource: 'parser_aliases',
        confidence: 80,
        reason: 'Merged duplicate skill alias.',
      });
      recordIssue(ctx, {
        severity: 'warning',
        section: 'skills',
        index: i,
        code: 'duplicate_skill',
        message: `Duplicate skill alias: "${normalized}".`,
      });
      existing.frequency += skill.frequency || 1;
      existing.sources = [...new Set([...existing.sources, ...skill.sources])];
      existing.confidence = Math.max(existing.confidence, skill.confidence);
      existing.importance = Math.max(existing.importance, skill.importance);
      continue;
    }

    const merged: IntelligentSkill = {
      ...skill,
      name: normalized,
    };
    seen.set(key, merged);
    kept.push(merged);
  }

  return kept;
}

export function scoreSkillsSection(skills: IntelligentSkill[]): number {
  if (!skills.length) return 0;
  const avg = skills.reduce((sum, s) => sum + (s.confidence || 0), 0) / skills.length;
  return Math.min(100, Math.round(avg));
}
