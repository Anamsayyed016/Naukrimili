/**
 * Duplicate removal — merge aliases, preserve richest metadata.
 */

import { categorizeSkill } from './categorize';
import { computeImportance, aggregateSkillCandidates } from './confidence';
import { skillDedupeKey } from './aliases';
import type { IntelligentSkill, SkillCandidate } from './types';

export function dedupeAndMergeSkills(candidates: SkillCandidate[]): IntelligentSkill[] {
  const aggregated = aggregateSkillCandidates(candidates);
  const byKey = new Map<string, IntelligentSkill>();

  for (const agg of aggregated) {
    const key = skillDedupeKey(agg.name);
    const { category, confidence: catConf } = categorizeSkill(agg.name);
    const importance = computeImportance(agg);

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        name: agg.name,
        category,
        categoryConfidence: catConf,
        confidence: agg.confidence,
        importance,
        sources: [...agg.sources],
        frequency: agg.frequency,
        yearsOfUse: null,
        recentUsage: agg.recentUsage,
        rawForms: agg.rawForms,
      });
      continue;
    }

    existing.frequency += agg.frequency;
    existing.confidence = Math.max(existing.confidence, agg.confidence);
    existing.importance = Math.max(existing.importance, importance);
    existing.categoryConfidence = Math.max(existing.categoryConfidence, catConf);
    existing.recentUsage = existing.recentUsage || agg.recentUsage;

    for (const src of agg.sources) {
      if (!existing.sources.includes(src)) existing.sources.push(src);
    }
  }

  return [...byKey.values()].sort(
    (a, b) => b.importance - a.importance || b.confidence - a.confidence
  );
}
