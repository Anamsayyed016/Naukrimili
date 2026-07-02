/**
 * Core field comparison utilities.
 */

import { classifyMismatch } from './classify';
import {
  blendedSimilarity,
  normalizeCompareText,
  normalizeEmail,
  normalizePhone,
  normalizeUrl,
  similarityToStatus,
} from './normalize';
import type { FieldComparison, FieldMatchStatus } from './types';

export interface CompareScalarOptions {
  section: string;
  field: string;
  index?: number;
  expected?: string | null;
  actual?: string | null;
  confidence?: number;
  mode?: 'text' | 'email' | 'phone' | 'url';
  partialThreshold?: number;
}

export function compareScalarField(options: CompareScalarOptions): FieldComparison {
  const {
    section,
    field,
    index,
    confidence,
    mode = 'text',
    partialThreshold = 0.55,
  } = options;

  const expectedRaw = options.expected || '';
  const actualRaw = options.actual || '';

  let similarity = 0;
  if (mode === 'email') {
    similarity = normalizeEmail(expectedRaw) === normalizeEmail(actualRaw) ? 1 : 0;
  } else if (mode === 'phone') {
    const ep = normalizePhone(expectedRaw);
    const ap = normalizePhone(actualRaw);
    similarity = ep && ap && ep === ap ? 1 : blendedSimilarity(expectedRaw, actualRaw);
  } else if (mode === 'url') {
    similarity =
      normalizeUrl(expectedRaw) === normalizeUrl(actualRaw) ? 1 : blendedSimilarity(expectedRaw, actualRaw);
  } else {
    similarity = blendedSimilarity(expectedRaw, actualRaw);
  }

  let status: FieldMatchStatus;
  if (!expectedRaw && actualRaw) {
    status = 'unexpected';
  } else if (expectedRaw && !actualRaw) {
    status = 'missing';
  } else {
    const base = similarityToStatus(similarity);
    status = base === 'missing' && similarity >= partialThreshold ? 'partial' : base;
  }

  const errorClass = classifyMismatch({
    section,
    field,
    status,
    expected: expectedRaw,
    actual: actualRaw,
    similarity,
    confidence,
  });

  return {
    section,
    field,
    index,
    expected: expectedRaw,
    actual: actualRaw,
    status,
    similarity: Math.round(similarity * 1000) / 1000,
    confidence,
    errorClass,
    message: `${section}.${field}: ${status} (similarity ${Math.round(similarity * 100)}%)`,
  };
}

export function compareStringArrays(
  section: string,
  field: string,
  expected: string[],
  actual: string[],
  normalizeFn: (s: string) => string = normalizeCompareText
): FieldComparison[] {
  const results: FieldComparison[] = [];
  const expSet = new Map<string, string>();
  for (const e of expected) expSet.set(normalizeFn(e), e);
  const actSet = new Map<string, string>();
  for (const a of actual) actSet.set(normalizeFn(a), a);

  for (const [key, expVal] of expSet) {
    const actVal = actSet.get(key) || '';
    results.push(
      compareScalarField({
        section,
        field,
        expected: expVal,
        actual: actVal,
      })
    );
    if (actSet.has(key)) actSet.delete(key);
  }

  for (const [, actVal] of actSet) {
    results.push(
      compareScalarField({
        section,
        field,
        expected: '',
        actual: actVal,
      })
    );
  }

  return results;
}

export interface MatchPair<T> {
  expectedIndex: number;
  actualIndex: number;
  expected: T;
  actual: T;
  score: number;
}

export function greedyMatchEntries<T>(
  expected: T[],
  actual: T[],
  scoreFn: (exp: T, act: T) => number,
  threshold = 0.45
): {
  pairs: MatchPair<T>[];
  unmatchedExpected: number[];
  unmatchedActual: number[];
} {
  const pairs: MatchPair<T>[] = [];
  const usedActual = new Set<number>();

  for (let ei = 0; ei < expected.length; ei++) {
    let bestAi = -1;
    let bestScore = 0;
    for (let ai = 0; ai < actual.length; ai++) {
      if (usedActual.has(ai)) continue;
      const score = scoreFn(expected[ei], actual[ai]);
      if (score > bestScore) {
        bestScore = score;
        bestAi = ai;
      }
    }
    if (bestAi >= 0 && bestScore >= threshold) {
      usedActual.add(bestAi);
      pairs.push({
        expectedIndex: ei,
        actualIndex: bestAi,
        expected: expected[ei],
        actual: actual[bestAi],
        score: bestScore,
      });
    }
  }

  const matchedExpected = new Set(pairs.map((p) => p.expectedIndex));
  const unmatchedExpected = expected.map((_, i) => i).filter((i) => !matchedExpected.has(i));
  const unmatchedActual = actual.map((_, i) => i).filter((i) => !usedActual.has(i));

  return { pairs, unmatchedExpected, unmatchedActual };
}

export function scoreFieldComparisons(fields: FieldComparison[]): number {
  if (!fields.length) return 100;
  let points = 0;
  for (const f of fields) {
    if (f.status === 'match') points += 1;
    else if (f.status === 'partial') points += 0.5;
  }
  return Math.round((points / fields.length) * 100);
}

export function aggregateFieldStats(fields: FieldComparison[]): {
  matchedFields: number;
  partialFields: number;
  missingFields: number;
  unexpectedFields: number;
} {
  return {
    matchedFields: fields.filter((f) => f.status === 'match').length,
    partialFields: fields.filter((f) => f.status === 'partial').length,
    missingFields: fields.filter((f) => f.status === 'missing').length,
    unexpectedFields: fields.filter((f) => f.status === 'unexpected').length,
  };
}
