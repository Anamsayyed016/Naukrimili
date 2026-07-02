/**
 * Text normalization and similarity for benchmark comparisons.
 */

import { normalizeSkillAlias, skillDedupeKey } from '../skills-intelligence/aliases';

export function normalizeCompareText(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^\w\s@.+/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePhone(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '').slice(-10);
}

export function normalizeEmail(value: string | null | undefined): string {
  return normalizeCompareText(value);
}

export function normalizeUrl(value: string | null | undefined): string {
  const v = (value || '').trim().toLowerCase();
  return v.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function normalizeSkill(value: string): string {
  return normalizeSkillAlias(value);
}

export function skillKey(value: string): string {
  return skillDedupeKey(value);
}

export function tokenOverlapRatio(a: string, b: string): number {
  const na = normalizeCompareText(a);
  const nb = normalizeCompareText(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const ta = new Set(na.split(/\s+/).filter(Boolean));
  const tb = new Set(nb.split(/\s+/).filter(Boolean));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return inter / Math.max(ta.size, tb.size);
}

export function levenshteinRatio(a: string, b: string): number {
  const sa = normalizeCompareText(a);
  const sb = normalizeCompareText(b);
  if (sa === sb) return 1;
  if (!sa.length || !sb.length) return 0;

  const rows = sa.length + 1;
  const cols = sb.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = sa[i - 1] === sb[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const dist = matrix[rows - 1][cols - 1];
  return 1 - dist / Math.max(sa.length, sb.length);
}

export function blendedSimilarity(a: string, b: string): number {
  const token = tokenOverlapRatio(a, b);
  const lev = levenshteinRatio(a, b);
  return token * 0.55 + lev * 0.45;
}

export function similarityToStatus(similarity: number): 'match' | 'partial' | 'missing' {
  if (similarity >= 0.92) return 'match';
  if (similarity >= 0.55) return 'partial';
  return 'missing';
}

export function countParagraphs(text: string): number {
  return (text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

export function hasBulletLines(text: string): boolean {
  return /^[\s]*[-•*▪–]\s+/m.test(text || '');
}
