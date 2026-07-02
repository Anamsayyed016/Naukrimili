/**
 * Confidence scoring — frequency, source priority, context quality.
 */

import { scoreSkillConfidence } from '@/lib/resume-parser/import-sanitize';

import { getSourceWeight } from './collect';
import type { SkillCandidate, SkillSource } from './types';
import { KNOWN_TECH_ACRONYMS_RE } from './validate';

const SOURCE_BASE_SCORE: Record<SkillSource, number> = {
  skills_section: 88,
  experience: 78,
  project: 74,
  certification: 70,
  education: 62,
  summary: 55,
};

export interface ScoredSkillAggregate {
  name: string;
  sources: SkillSource[];
  frequency: number;
  baseConfidence: number;
  sourceScore: number;
  contextScore: number;
  confidence: number;
  recentUsage: boolean;
}

export function scoreSkillCandidate(candidate: SkillCandidate): number {
  let quality = scoreSkillConfidence(candidate.raw);
  if (quality <= 0 && candidate.normalized) {
    quality = scoreSkillConfidence(candidate.normalized);
  }
  if (quality <= 0 && KNOWN_TECH_ACRONYMS_RE.test(candidate.raw)) {
    quality = 72;
  }
  const sourceBoost = Math.round(SOURCE_BASE_SCORE[candidate.source] * getSourceWeight(candidate.source) * 0.35);
  return Math.min(100, Math.round(quality * 0.55 + sourceBoost));
}

export function aggregateSkillCandidates(
  candidates: SkillCandidate[]
): ScoredSkillAggregate[] {
  const map = new Map<
    string,
    {
      name: string;
      sources: Set<SkillSource>;
      frequency: number;
      scores: number[];
    }
  >();

  for (const c of candidates) {
    const key = c.normalized.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.sources.add(c.source);
      existing.frequency += 1;
      existing.scores.push(scoreSkillCandidate(c));
    } else {
      map.set(key, {
        name: c.normalized,
        sources: new Set([c.source]),
        frequency: 1,
        scores: [scoreSkillCandidate(c)],
      });
    }
  }

  const out: ScoredSkillAggregate[] = [];

  for (const entry of map.values()) {
    const sources = [...entry.sources];
    const avgScore =
      entry.scores.reduce((a, b) => a + b, 0) / Math.max(entry.scores.length, 1);
    const sourceScore = Math.min(
      100,
      sources.reduce((max, s) => Math.max(max, SOURCE_BASE_SCORE[s]), 0)
    );
    const frequencyBoost = Math.min(20, (entry.frequency - 1) * 6);
    const multiSourceBoost = sources.length > 1 ? 10 : 0;
    const contextScore = Math.min(100, sourceScore + frequencyBoost + multiSourceBoost);
    const confidence = Math.min(
      100,
      Math.round(avgScore * 0.5 + contextScore * 0.35 + frequencyBoost * 0.15)
    );

    out.push({
      name: entry.name,
      sources,
      frequency: entry.frequency,
      baseConfidence: Math.round(avgScore),
      sourceScore,
      contextScore,
      confidence,
      recentUsage: sources.includes('experience') || sources.includes('project'),
    });
  }

  return out.sort((a, b) => b.confidence - a.confidence || b.frequency - a.frequency);
}

export function computeImportance(agg: ScoredSkillAggregate): number {
  const sourceDiversity = agg.sources.length * 8;
  const freq = Math.min(25, agg.frequency * 5);
  const recency = agg.recentUsage ? 12 : 0;
  const explicit = agg.sources.includes('skills_section') ? 15 : 0;
  return Math.min(100, Math.round(agg.confidence * 0.55 + freq + sourceDiversity + recency + explicit));
}
